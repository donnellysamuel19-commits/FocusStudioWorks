import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from '@genkit-ai/flow';

// Import the whole module so we can SEE what it exports
import * as nextSprintModule from '../../../ai/flows/nextSprintSuggestion';

export async function POST(req: NextRequest) {
  try {
    // 🔎 Debug: what is actually exported from the module?
    console.log('nextSprintModule keys:', Object.keys(nextSprintModule));

    const nextSprintSuggestionFlow =
      (nextSprintModule as any).nextSprintSuggestionFlow;

    console.log('nextSprintSuggestionFlow typeof:', typeof nextSprintSuggestionFlow);

    const body = await req.json().catch(() => null);
    const assignmentId = body?.assignmentId;
    const sessions = body?.sessions;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: 'Missing sessions data' }, { status: 400 });
    }

    const result = await runFlow(nextSprintSuggestionFlow, { assignmentId, sessions });
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
