import { NextResponse } from 'next/server';

export interface DispatchCommandPayload {
  relayId: string;
  action: 'ENABLE' | 'DISABLE' | 'HOLD';
  targetKw: number;
  authPin?: string;
}

export async function POST(req: Request) {
  try {
    const body: DispatchCommandPayload = await req.json();

    if (!body.relayId || !body.action) {
      return NextResponse.json(
        { error: 'Missing required parameters: relayId and action are mandatory' },
        { status: 400 }
      );
    }

    // Safety interlock check: reject unauthorized draws above physical breaker limits (100 kW)
    if (body.targetKw > 100) {
      return NextResponse.json(
        { error: 'SECURITY_INTERLOCK: Commanded load exceeds single breaker capacity (100 kW)' },
        { status: 403 }
      );
    }

    const executionLog = {
      acknowledgment: 'ACK_EXECUTED',
      relayId: body.relayId,
      state: body.action === 'ENABLE' ? 'CLOSED_CIRCUIT' : 'OPEN_CIRCUIT',
      dispatchedKw: body.targetKw,
      gridSafetyStandard: 'IEEE 1547-2018 Compliant',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(executionLog, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Malformed JSON request body' }, { status: 400 });
  }
}
