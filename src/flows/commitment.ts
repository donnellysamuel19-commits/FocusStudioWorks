import { z } from 'zod';
import { ai } from '../ai/genkit'; // This ensures we use the stable config you just fixed

export const commitmentClarificationFlow = ai.defineFlow(
  {
    name: 'commitmentClarificationFlow',
    inputSchema: z.object({
        assignmentId: z.string(),
        durationMinutes: z.number(),
        targetObject: z.string(),
        nextAction: z.string(),
        sprintDeliverable: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (sprintInput) => {
    const prompt = `You are assisting a study sprint app called FocusSprint.
Your job is strictly bounded: you may ONLY identify if the “Next Action” section is too vague, or possibly too vigorous. 

Hard limits:
- Do NOT tutor.
- Do NOT generate academic content.
- Do NOT provide study strategies or methods.
- Do NOT create multi-step plans or schedules.
- Do NOT judge motivation, ability, or realism.

Style rules:
- Concise, neutral tone.
- Under 120 words.
- Non-authoritative language (use ‘suggest’, not ‘require’).
- If the sprint input is already clear, explicitly say so and do NOT rewrite it.

Sprint input:
AssignmentId: ${sprintInput.assignmentId}
Duration: ${sprintInput.durationMinutes} minutes
Target Object: ${sprintInput.targetObject}
Next Action: ${sprintInput.nextAction}
Sprint Deliverable: ${sprintInput.sprintDeliverable}

Output format:
- 1–2 sentences identifying whether the prompt is too vague or too much of a workload (if anything).
- Then EITHER:
• 1–3 optional clarifying questions
OR
• one optional rewrite suggestion.
Keep it short.`;

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt,
        config: { temperature: 0.3 },
    });

    return llmResponse.text;
  }
);