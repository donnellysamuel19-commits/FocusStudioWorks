import { ai } from '@/ai/genkit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    
    // This calls the Gemini model to clarify the sprint commitment
    const response = await ai.generate({
      prompt: `Review this study sprint: 
               Target: ${data.targetObject}
               Action: ${data.nextAction}
               Deliverable: ${data.sprintDeliverable}. 
               Provide a 2-sentence encouraging clarification.`,
    });

    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
  }
}
