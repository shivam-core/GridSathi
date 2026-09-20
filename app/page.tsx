'use client';

import React, { useState, useMemo } from 'react';
import { generateConformalForecast } from '@/lib/conformal';
import { optimizeCampusDispatch, CAMPUS_LOADS } from '@/lib/optimizer';
import EnergyForecastChart from '@/components/EnergyForecastChart';
import { Zap, ShieldCheck, SunMedium, ArrowDownRight, Layers, Radio, Settings2 } from 'lucide-react';

export default function Simulator() {
  // --- HACKATHON INTERACTIVE STATES ---
  const [weather, setWeather] = useState<'CLEAR' | 'VARIABLE' | 'OVERCAST'>('VARIABLE');
  const [demandMult, setDemandMult] = useState<number>(1.0);

  // Recalculate the entire microgrid twin instantly when a slider or toggle changes
  const result = useMemo(() => {
    const forecast = generateConformalForecast(weather, demandMult);
    return optimizeCampusDispatch(forecast, CAMPUS_LOADS);
  }, [weather, demandMult]);

  const totalSolar = result.optimizedTelemetry.reduce((acc, curr) => acc + curr.solarP50, 0);
  const maxNetDemand = Math.max(...result.optimizedTelemetry.map((t) => t.netGridDraw));

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100 font-sans p-4 sm:p-8 flex flex-col xl:flex-row gap-6">
      
      {/* LEFT COLUMN: VISUALIZER & MATRIX */}
      <div className="flex-1 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-neutral-800 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                GridSathi: Loadshift
              </h1>
            </div>
            <p className="text-sm text-neutral-400 mt-1">
              Interactive Microgrid Twin • Drag controls to trigger live AI rescheduling
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/80 font-mono text-emerald-400 flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse" /> Engine Online
          </span>
        </header>

        {/* KPI Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider mb-1">Peak Demand Shaved</div>
            <div className="text-xl font-bold text-emerald-400">{result.peakShavedKw} kW</div>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider mb-1">Max Grid Import Draw</div>
            <div className="text-xl font-bold text-blue-400">{maxNetDemand} kW</div>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider mb-1">Solar Yield (P50)</div>
            <div className="text-xl font-bold text-amber-400">{totalSolar.toLocaleString()} kWh</div>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider mb-1">Confidence Bound</div>
            <div className="text-xl font-bold text-white">95.0%</div>
          </div>
        </section>

        {/* Chart */}
        <section>
          <EnergyForecastChart data={result.optimizedTelemetry} />
        </section>

        {/* Relay Matrix */}
        <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Edge Relay Schedule</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-neutral-800 text-neutral-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-2">Subsystem Name</th>
                  <th className="pb-2">Load</th>
                  <th className="pb-2">Scheduled Window</th>
                  <th className="pb-2 text-right">Relay Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {result.scheduledLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-neutral-800/20">
                    <td className="py-3 font-medium text-white">{load.name}</td>
                    <td className="py-3 font-mono">{load.capacityKw} kW</td>
                    <td className="py-3 font-mono text-emerald-400 font-bold">
                      {load.scheduledStartHour !== undefined
                        ? `${load.scheduledStartHour.toString().padStart(2, '0')}:00 - ${(load.scheduledStartHour + load.durationHours).toString().padStart(2, '0')}:00`
                        : <span className="text-red-400">UNABLE TO SCHEDULE (HOLD)</span>}
                    </td>
                    <td className="py-3 text-right">
                      {load.scheduledStartHour !== undefined ? (
                        <span className="px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/50">ARMED</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-red-950/50 text-red-400 border border-red-800/50">LOCKED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: HACKATHON CONTROL PANEL */}
      <aside className="w-full xl:w-80 flex flex-col gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sticky top-6">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-3">
            <Settings2 className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Live Sim Controls</h2>
          </div>

          {/* Cloud Cover Radio Toggle */}
          <div className="mb-6">
            <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-3">Weather / Volatility</label>
            <div className="space-y-2">
              {['CLEAR', 'VARIABLE', 'OVERCAST'].map((w) => (
                <label key={w} className={`flex items-center justify-between p-2 rounded cursor-pointer border ${weather === w ? 'border-amber-500 bg-amber-950/20' : 'border-neutral-800 hover:bg-neutral-800/50'}`}>
                  <span className="text-xs font-mono">{w}</span>
                  <input 
                    type="radio" 
                    name="weather" 
                    value={w} 
                    checked={weather === w}
                    onChange={(e) => setWeather(e.target.value as any)}
                    className="accent-amber-500"
                  />
                </label>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Notice how "Overcast" massively widens the uncertainty band, forcing the P05 safe floor downward.</p>
          </div>

          {/* Baseline Demand Slider */}
          <div className="mb-6">
            <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-3">
              Campus Base Demand: {Math.round(demandMult * 100)}%
            </label>
            <input 
              type="range" 
              min="0.6" 
              max="1.6" 
              step="0.1"
              value={demandMult} 
              onChange={(e) => setDemandMult(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="text-[10px] text-neutral-500 mt-2">Spike the demand to 140%+. Watch the AI scramble to push loads into tighter solar windows, or lock them out entirely to prevent a grid blowout.</p>
          </div>
          
          <div className="mt-8 p-3 rounded-lg bg-blue-950/20 border border-blue-900/40">
            <p className="text-[11px] text-blue-300 leading-relaxed">
              <strong>Hackathon Tip:</strong> Drag the slider fast. The Recharts graph will animate the load blocks shifting hours instantly. This proves the scheduling algorithm executes in sub-millisecond time on the edge.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
