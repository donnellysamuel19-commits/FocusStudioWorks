import { NextRequest, NextResponse } from 'next/server';
import { nextSprintSuggestionFlow } from '@/ai/flows/nextSprintSuggestion';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const assignmentId = body?.assignmentId;
    const sessions = body?.sessions;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: 'Missing sessions data' }, { status: 400 });
    }

    // ✅ DO NOT use runFlow() here. Call the flow directly (Feature 1 pattern).
    const result = await nextSprintSuggestionFlow({ assignmentId, sessions });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('nextSprintSuggestionFlow route error:', err?.message || err);
    console.error('stack:', err?.stack || '(no stack)');
    return NextResponse.json(
      { error: err?.message || 'Unable to generate a suggestion right now.' },
      { status: 500 }
    );
  }
}
