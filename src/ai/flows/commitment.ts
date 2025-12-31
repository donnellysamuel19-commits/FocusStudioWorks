'use server';
/**
 * @fileOverview A Genkit flow to provide clarification on a user's study sprint commitment.
 *
 * - commitmentClarificationFlow - A function that analyzes a study sprint and provides feedback.
 * - CommitmentClarificationInput - The input type for the flow.
 * - CommitmentClarificationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const CommitmentClarificationInputSchema = z.object({
  targetObject: z.string().describe('The specific thing the user is focusing on.'),
  nextAction: z.string().describe('The very next physical action the user will take.'),
  sprintDeliverable: z.string().describe('The tangible thing that will exist when the user is done.'),
  durationMinutes: z.number().describe('The duration of the sprint in minutes.'),
});
export type CommitmentClarificationInput = z.infer<typeof CommitmentClarificationInputSchema>;

export const commitmentClarificationFlow = ai.defineFlow(
  {
    name: 'commitmentClarificationFlow',
    inputSchema: CommitmentClarificationInputSchema,
    outputSchema: z.string(),
  },
  async (sprintInput) => {
    const prompt = `You are assisting a study sprint app called FocusSprint.
Your job is strictly bounded: you may ONLY identify if the “Next Action” section is too vague, or possibly too vigorous for the duration.

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
      prompt,
      config: { temperature: 0.3 },
    });

    return llmResponse.text;
  }
);
