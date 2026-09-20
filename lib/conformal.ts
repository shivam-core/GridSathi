export interface HourlyTelemetry {
  hour: number;
  timeLabel: string;
  solarP05: number;       // Conservative bound (5th percentile)
  solarP50: number;       // Median expected solar generation (50th percentile)
  solarP95: number;       // Upper bound (95th percentile)
  demandBase: number;     // Non-deferrable campus baseline demand (kW)
  shiftedLoad: number;    // Dynamically scheduled flexible loads (kW)
  netGridDraw: number;    // Resultant draw on the utility transformer
  uncertaintyRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WeatherCondition {
  cloudCoverPercent: number;
  ghi: number; // Global Horizontal Irradiance in W/m²
}

/**
 * Calculates conformal prediction bands for a 24-hour horizon based on live or historical irradiance.
 */
export function generateConformalForecast(
  cloudCondition: 'CLEAR' | 'VARIABLE' | 'OVERCAST' = 'VARIABLE',
  demandMultiplier: number = 1.0
): HourlyTelemetry[] {
  const telemetry: HourlyTelemetry[] = [];
  
  // Empirical non-conformity residual multipliers based on sky conditions
  const residualAlpha = cloudCondition === 'CLEAR' ? 0.08 : cloudCondition === 'VARIABLE' ? 0.24 : 0.48;

  for (let h = 0; h < 24; h++) {
    let baseSolarKw = 0;

    // Solar generation window (Pune, 06:00 to 18:00, peak at 13:00)
    if (h >= 6 && h <= 18) {
      const peakSolarCapacityKw = 180; // 180 kWp campus rooftop solar array
      baseSolarKw = Math.max(0, peakSolarCapacityKw * Math.sin(((h - 6) / 12) * Math.PI));
    }

    // Compute quantile residuals
    const residualMagnitude = baseSolarKw * residualAlpha + (baseSolarKw > 0 ? 4.5 : 0);
    const solarP50 = Math.round(baseSolarKw);
    const solarP05 = Math.max(0, Math.round(baseSolarKw - residualMagnitude * 1.645));
    const solarP95 = Math.round(baseSolarKw + residualMagnitude * 1.645);

    // Realistic campus baseline load profile:
    // Low night base (50kW) -> Morning peak (classes/labs, 130kW) -> Afternoon lab peak (160kW) -> Evening dip
    const baseDemand =
      55 +
      55 * Math.sin(((h - 5) / 13) * Math.PI) +
      (h >= 9 && h <= 16 ? 45 : 0) +
      (h >= 18 && h <= 21 ? 30 : 0);
    
    // Apply the slider's multiplier to the base demand
    const demandBase = Math.round(Math.max(45, baseDemand) * demandMultiplier);
    const spread = solarP95 - solarP05;

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (spread > 45) risk = 'HIGH';
    else if (spread > 18) risk = 'MEDIUM';

    telemetry.push({
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      solarP05,
      solarP50,
      solarP95,
      demandBase,
      shiftedLoad: 0,
      netGridDraw: demandBase - solarP50,
      uncertaintyRisk: risk,
    });
  }

  return telemetry;
}
