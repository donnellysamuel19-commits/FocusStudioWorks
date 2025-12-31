import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { NextRequest, NextResponse } from 'next/server';
console.log("Checking API Key:", process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY ? "Found" : "MISSING!");

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY })], // Uses Line 7 of .env.local
  model: gemini15Flash,
});

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