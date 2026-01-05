'use server';

/**
 * Feature 2 — Next Sprint Suggestion (Genkit)
 * Matches Feature 1 pattern: definePrompt + defineFlow, then CALL the flow directly from the API route.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NextSprintSuggestionInputSchema = z.object({
  assignmentId: z.string(),
  sessions: z
    .array(
      z.object({
        targetObject: z.string().optional().default(''),
        nextAction: z.string().optional().default(''),
        sprintDeliverable: z.string().optional().default(''),
        durationMinutes: z.number().optional().default(0),
        state: z.string().optional().default(''),
        outcome: z.string().optional().default(''),
        optionalBlockerNote: z.string().optional().default(''),
        createdAtMillis: z.number().optional().default(0),
      })
    )
    .min(1),
});

const NextSprintSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('One optional next sprint idea (1–3 sentences).'),
});

const systemInstruction = `You are assisting a study sprint app called FocusSprint.

Your role is strictly bounded:
You may ONLY synthesize patterns across past study sessions
and suggest ONE optional next sprint focus.

Hard limits:
- Do NOT tutor.
- Do NOT generate academic content.
- Do NOT provide study strategies or methods.
- Do NOT judge performance, motivation, or ability.
- Do NOT create multi-step plans or schedules.

Tone: neutral, supportive, concise.
Length: 1–3 sentences max.
Non-authoritative (“suggest”, not “should”).

Task:
Analyze the recent study sessions and identify:
- What types of sprints were completed successfully
- What types were abandoned and why (scope, blockers)

Then suggest ONE narrowly scoped next sprint idea
that fits a 10–25 minute session.

If the data is inconclusive, say so and suggest keeping the next sprint small.`;

const nextSprintPrompt = ai.definePrompt({
  name: 'nextSprintSuggestionPrompt',
  input: { schema: NextSprintSuggestionInputSchema },
  output: { schema: NextSprintSuggestionOutputSchema },
  prompt: `${systemInstruction}

Here are the most recent study sessions (JSON):
{{{json sessions}}}

Return ONLY the suggestion in the "suggestion" field.`,
});

// IMPORTANT: ai.defineFlow returns a callable function (same as Feature 1)
export const nextSprintSuggestionFlow = ai.defineFlow(
  {
    name: 'nextSprintSuggestionFlow',
    inputSchema: NextSprintSuggestionInputSchema,
    outputSchema: NextSprintSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await nextSprintPrompt(input);

    return {
      suggestion:
        output?.suggestion?.trim() ||
        'Keep the next sprint very small: pick one tiny step you can finish in 10–15 minutes.',
    };
  }
);
