import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from '@genkit-ai/flow';
import { nextSprintSuggestionFlow } from '../../../ai/flows/nextSprintSuggestion';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { assignmentId } = await req.json();
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!assignmentId) {
    return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
  }

  try {
    const suggestion = await runFlow(nextSprintSuggestionFlow, { userId, assignmentId });
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error running nextSprintSuggestionFlow:', error);
    return NextResponse.json({ error: 'Unable to generate a suggestion right now.' }, { status: 500 });
  }
}
