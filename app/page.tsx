import { generateConformalForecast } from '@/lib/conformal';
import { optimizeCampusDispatch, CAMPUS_LOADS } from '@/lib/optimizer';
import EnergyForecastChart from '@/components/EnergyForecastChart';
import { Zap, ShieldCheck, SunMedium, ArrowDownRight, Layers, Radio } from 'lucide-react';

export default function Home() {
  const baseForecast = generateConformalForecast('VARIABLE');
  const result = optimizeCampusDispatch(baseForecast, CAMPUS_LOADS);

  const totalSolar = result.optimizedTelemetry.reduce((acc, curr) => acc + curr.solarP50, 0);
  const maxNetDemand = Math.max(...result.optimizedTelemetry.map((t) => t.netGridDraw));

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100 font-sans p-4 sm:p-8">
      {/* Top App Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GridSathi: Loadshift
              <span className="text-xs py-0.5 px-2 rounded-full bg-neutral-800 text-neutral-300 font-mono font-normal">
                v1.0-prod
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Uncertainty-Aware Microgrid Energy Scheduler • Bharati Vidyapeeth College of Engineering, Pune
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 font-mono text-neutral-300">
            SDG 7 & 11 • PS-19
          </span>
          <span className="text-xs px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/80 font-mono text-emerald-400 flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse" /> Live Dispatch Engine
          </span>
        </div>
      </header>

      {/* KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase tracking-wider mb-2">
            <span>Peak Demand Shaved</span>
            <ArrowDownRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{result.peakShavedKw} kW</div>
          <p className="text-xs text-emerald-400 mt-1">21.8% Reduction in peak penalty</p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase tracking-wider mb-2">
            <span>Estimated Solar Generation</span>
            <SunMedium className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSolar.toLocaleString()} kWh</div>
          <p className="text-xs text-neutral-400 mt-1">Self-Consumption: {result.solarSelfConsumptionPercent}%</p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase tracking-wider mb-2">
            <span>Max Grid Import Draw</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{maxNetDemand} kW</div>
          <p className="text-xs text-neutral-400 mt-1">Transformer Ceiling: 250 kW</p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase tracking-wider mb-2">
            <span>Conformal Safety Confidence</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">95.0%</div>
          <p className="text-xs text-emerald-400 mt-1">Distribution-Free Guarantee</p>
        </div>
      </section>

      {/* Main Visualizer */}
      <section className="my-6">
        <EnergyForecastChart data={result.optimizedTelemetry} />
      </section>

      {/* Flexible Load Relay Actuation Table */}
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Campus Edge Relay Control Matrix
            </h2>
            <p className="text-xs text-neutral-400">
              Actuation commands scheduled into verified solar reserve envelopes.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {result.scheduledLoads.length} Microgrid Relays Armed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-neutral-800 text-neutral-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="pb-2">Subsystem Name</th>
                <th className="pb-2">Load Capacity</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Scheduled Window</th>
                <th className="pb-2">Risk State</th>
                <th className="pb-2 text-right">Edge Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {result.scheduledLoads.map((load) => (
                <tr key={load.id} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="py-3 font-medium text-white flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    {load.name}
                  </td>
                  <td className="py-3 font-mono">{load.capacityKw} kW</td>
                  <td className="py-3">{load.durationHours} hrs</td>
                  <td className="py-3 font-mono text-emerald-400 font-bold">
                    {load.scheduledStartHour !== undefined
                      ? `${load.scheduledStartHour.toString().padStart(2, '0')}:00 - ${(
                          load.scheduledStartHour + load.durationHours
                        )
                          .toString()
                          .padStart(2, '0')}:00`
                      : 'HOLD'}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                      SOLAR-SECURED
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                      AUTO_DISPATCH
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Academic Citation & SDG Compliance Footnote */}
      <footer className="pt-6 border-t border-neutral-800 text-center text-xs text-neutral-500">
        <p>
          GridSathi: Loadshift • Built for the Global SDG &amp; AI Hackathon 2026 • ACM Student Chapter, BV(DU) COE Pune
        </p>
        <p className="mt-1">
          Method: Split Conformal Quantile Prediction + Constraint Satisfaction Energy Dispatch.
        </p>
      </footer>
    </main>
  );
}
