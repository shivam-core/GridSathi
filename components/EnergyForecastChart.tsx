'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { HourlyTelemetry } from '@/lib/conformal';

export default function EnergyForecastChart({ data }: { data: HourlyTelemetry[] }) {
  return (
    <div className="w-full h-96 bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-neutral-100 uppercase">
            24-Hour Conformal Dispatch Horizon
          </h3>
          <p className="text-xs text-neutral-400">
            Shaded area shows the 95% conformal prediction region [$P_&#123;05&#125; \leftrightarrow P_&#123;95&#125;$]. Flexible loads are scheduled inside conservative solar availability.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/30 border border-amber-400" />
            Solar Safe Zone
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-0.5 bg-blue-500" />
            Net Grid Draw
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="solarConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="shiftedLoadFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#262626" />
          <XAxis dataKey="timeLabel" stroke="#737373" fontSize={11} tickLine={false} />
          <YAxis stroke="#737373" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              borderColor: '#262626',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

          {/* Conformal Uncertainty Interval */}
          <Area
            type="monotone"
            dataKey="solarP95"
            stroke="none"
            fill="url(#solarConfidence)"
            name="Solar 95% Bound"
          />
          <Area
            type="monotone"
            dataKey="solarP05"
            stroke="#d97706"
            strokeDasharray="3 3"
            fill="#0a0a0a"
            fillOpacity={0.95}
            name="Solar 5% Safe Reserve"
          />

          {/* Shifted Load Allocation */}
          <Area
            type="stepAfter"
            dataKey="shiftedLoad"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#shiftedLoadFill)"
            name="Shifted Flexible Load"
          />

          {/* Reference Lines */}
          <Line
            type="monotone"
            dataKey="demandBase"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            name="Campus Baseline Demand"
          />
          <Line
            type="monotone"
            dataKey="netGridDraw"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            name="Optimized Net Grid Draw"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
