import { NextResponse } from 'next/server';
import { generateConformalForecast } from '@/lib/conformal';
import { optimizeCampusDispatch, CAMPUS_LOADS } from '@/lib/optimizer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawForecast = generateConformalForecast('VARIABLE');
    const result = optimizeCampusDispatch(rawForecast, CAMPUS_LOADS);

    const peakDraw = Math.max(...result.optimizedTelemetry.map((t) => t.netGridDraw));
    const totalSolarGenerated = result.optimizedTelemetry.reduce((acc, curr) => acc + curr.solarP50, 0);
    const criticalHours = result.optimizedTelemetry.filter((t) => t.uncertaintyRisk === 'HIGH').length;

    return NextResponse.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      facility: 'BVDU Pune Campus Microgrid',
      metrics: {
        peakGridDemandKw: peakDraw,
        peakShavedKw: result.peakShavedKw,
        totalSolarKwh: totalSolarGenerated,
        solarSelfConsumptionRate: `${result.solarSelfConsumptionPercent}%`,
        highUncertaintyHoursCount: criticalHours,
      },
      schedule: result.optimizedTelemetry,
      actuatedRelays: result.scheduledLoads,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to process optimization cycle', details: String(error) },
      { status: 500 }
    );
  }
}
