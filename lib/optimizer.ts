import { HourlyTelemetry } from './conformal';

export interface ControllableLoad {
  id: string;
  name: string;
  category: 'PUMP' | 'EV' | 'HVAC' | 'STORAGE';
  capacityKw: number;
  durationHours: number;
  deadlineHour: number;
  earliestHour: number;
  scheduledStartHour?: number;
  status: 'STANDBY' | 'SCHEDULED' | 'RUNNING';
  priority: 1 | 2 | 3; // 1 = Critical, 3 = Highly Flexible
}

export const CAMPUS_LOADS: ControllableLoad[] = [
  {
    id: 'load-pump-01',
    name: 'Primary Water Filtration Pumps',
    category: 'PUMP',
    capacityKw: 45,
    durationHours: 3,
    earliestHour: 8,
    deadlineHour: 18,
    status: 'STANDBY',
    priority: 2,
  },
  {
    id: 'load-ev-02',
    name: 'Academic Complex EV Fleet Bank',
    category: 'EV',
    capacityKw: 60,
    durationHours: 4,
    earliestHour: 9,
    deadlineHour: 17,
    status: 'STANDBY',
    priority: 3,
  },
  {
    id: 'load-hvac-03',
    name: 'Central Auditorium Chiller Pre-Cool',
    category: 'HVAC',
    capacityKw: 75,
    durationHours: 2,
    earliestHour: 10,
    deadlineHour: 14,
    status: 'STANDBY',
    priority: 1,
  },
  {
    id: 'load-batt-04',
    name: 'Data Center Deep-Cycle Storage',
    category: 'STORAGE',
    capacityKw: 35,
    durationHours: 3,
    earliestHour: 8,
    deadlineHour: 16,
    status: 'STANDBY',
    priority: 2,
  },
];

export interface OptimizationResult {
  optimizedTelemetry: HourlyTelemetry[];
  scheduledLoads: ControllableLoad[];
  peakShavedKw: number;
  solarSelfConsumptionPercent: number;
}

/**
 * Uncertainty-Aware Horizon Dispatch Optimizer.
 * Places loads where the conservative lower bound P05 provides sufficient margin.
 */
export function optimizeCampusDispatch(
  forecast: HourlyTelemetry[],
  loads: ControllableLoad[]
): OptimizationResult {
  // Deep clone working array
  const schedule = forecast.map((f) => ({ ...f }));
  const loadRegistry = loads.map((l) => ({ ...l }));

  // Sort loads by priority first, then by duration descending
  loadRegistry.sort((a, b) => a.priority - b.priority || b.durationHours - a.durationHours);

  for (const load of loadRegistry) {
    let optimalWindowStart = -1;
    let highestSafeMargin = -Infinity;

    // Evaluate valid contiguous windows between earliestHour and deadlineHour
    for (let h = load.earliestHour; h <= load.deadlineHour - load.durationHours; h++) {
      let cumulativeMargin = 0;
      let windowPermissible = true;

      for (let offset = 0; offset < load.durationHours; offset++) {
        const slot = schedule[h + offset];
        // Net power using conservative P05 lower bound
        const availableSafeSolar = slot.solarP05;
        const totalCurrentLoad = slot.demandBase + slot.shiftedLoad;
        const remainingSurplus = availableSafeSolar - totalCurrentLoad;

        // Severe penalty if this window risks breaching the 250 kW transformer ceiling
        if (totalCurrentLoad + load.capacityKw > 250) {
          windowPermissible = false;
          break;
        }

        cumulativeMargin += remainingSurplus;
      }

      if (windowPermissible && cumulativeMargin > highestSafeMargin) {
        highestSafeMargin = cumulativeMargin;
        optimalWindowStart = h;
      }
    }

    // Fallback: If no solar-positive window exists, schedule at the lowest baseline demand valley
    if (optimalWindowStart === -1) {
      let lowestValleyDemand = Infinity;
      for (let h = load.earliestHour; h <= load.deadlineHour - load.durationHours; h++) {
        const windowDemand = schedule
          .slice(h, h + load.durationHours)
          .reduce((sum, s) => sum + s.demandBase + s.shiftedLoad, 0);

        if (windowDemand < lowestValleyDemand) {
          lowestValleyDemand = windowDemand;
          optimalWindowStart = h;
        }
      }
    }

    // Commit the load placement into the telemetry profile
    if (optimalWindowStart !== -1) {
      load.scheduledStartHour = optimalWindowStart;
      load.status = 'SCHEDULED';

      for (let offset = 0; offset < load.durationHours; offset++) {
        const slot = schedule[optimalWindowStart + offset];
        slot.shiftedLoad += load.capacityKw;
        // Recompute net grid draw using median expected solar
        slot.netGridDraw = Math.round(slot.demandBase + slot.shiftedLoad - slot.solarP50);
      }
    }
  }

  // Calculate optimization impact metrics
  const unoptimizedMaxGrid = Math.max(...forecast.map((f) => f.demandBase - f.solarP50));
  const optimizedMaxGrid = Math.max(...schedule.map((s) => s.netGridDraw));
  const peakShavedKw = Math.max(0, unoptimizedMaxGrid - optimizedMaxGrid);

  const totalSolarYield = schedule.reduce((acc, curr) => acc + curr.solarP50, 0);
  const totalSolarAbsorbed = schedule.reduce((acc, curr) => {
    const consumption = curr.demandBase + curr.shiftedLoad;
    return acc + Math.min(curr.solarP50, consumption);
  }, 0);

  const solarSelfConsumptionPercent =
    totalSolarYield > 0 ? Math.round((totalSolarAbsorbed / totalSolarYield) * 100) : 100;

  return {
    optimizedTelemetry: schedule,
    scheduledLoads: loadRegistry,
    peakShavedKw,
    solarSelfConsumptionPercent,
  };
}
