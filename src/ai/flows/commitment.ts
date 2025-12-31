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

export const CommitmentClarificationOutputSchema = z.object({
  clarification: z.string().describe('Concise feedback on the user sprint commitment, under 120 words.')
});
export type CommitmentClarificationOutput = z.infer<typeof CommitmentClarificationOutputSchema>;


const commitmentPrompt = ai.definePrompt({
  name: 'commitmentClarificationPrompt',
  input: { schema: CommitmentClarificationInputSchema },
  output: { schema: CommitmentClarificationOutputSchema },
  prompt: `You are assisting a study sprint app called FocusSprint.
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
Duration: {{{durationMinutes}}} minutes
Target Object: {{{targetObject}}}
Next Action: {{{nextAction}}}
Sprint Deliverable: {{{sprintDeliverable}}}

Your output must be a JSON object with a single key "clarification". The value should be a string containing your feedback.

Example Output:
{
  "clarification": "The next action seems clear and achievable for the time. Suggestion: 'Summarize notes' could be more specific, like 'Create 3 bullet points summarizing the key arguments'."
}
`
});

export const commitmentClarificationFlow = ai.defineFlow(
  {
    name: 'commitmentClarificationFlow',
    inputSchema: CommitmentClarificationInputSchema,
    outputSchema: CommitmentClarificationOutputSchema,
  },
  async (sprintInput) => {
    const { output } = await commitmentPrompt(sprintInput);
    if (!output) {
      throw new Error('AI failed to generate a clarification.');
    }
    return output;
  }
);