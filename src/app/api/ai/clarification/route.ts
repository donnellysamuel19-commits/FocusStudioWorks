
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentTitle, duration, targetObject, nextAction, sprintDeliverable } = body;

    if (!assignmentTitle || !duration || !targetObject || !nextAction || !sprintDeliverable) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are assisting a study sprint app called FocusSprint.
Your job is strictly bounded: you may ONLY identify missing or unclear sprint commitment elements and provide OPTIONAL clarifying questions or rewrite options.

Hard limits:
- Do NOT tutor.
- Do NOT generate academic content.
- Do NOT provide study strategies or methods.
- Do NOT create multi-step plans or schedules.
- Do NOT judge motivation, ability, or realism.

Style: concise, neutral, under 120 words, non-authoritative tone.
If the sprint input is already clear, say so and do not rewrite.

Sprint input:
Assignment: ${assignmentTitle}
Duration: ${duration} minutes
Target Object: ${targetObject}
Next Action: ${nextAction}
Sprint Deliverable: ${sprintDeliverable}

Output format:
- 1–2 sentences identifying what is missing/unclear (if anything)
- Then EITHER 1–3 optional clarifying questions OR one rewrite option.
Keep it short.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
    });

    const result = llmResponse.text();

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in AI clarification route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
