'use server';
/**
 * @fileOverview A Genkit flow for providing AI-driven feedback on a user's study sprint commitment.
 * This file defines the AI prompt, the data schemas for input/output, and the flow logic.
 * The exported function `commitmentClarificationFlow` is called by the client to get feedback.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


// Define the input schema for the commitment clarification flow.
// This is NOT exported to avoid issues with Next.js server action serialization.
const CommitmentClarificationInputSchema = z.object({
  targetObject: z.string().describe('The specific thing the user is focusing on.'),
  nextAction: z.string().describe('The very next physical action the user will take.'),
  sprintDeliverable: z.string().describe('The tangible thing that will exist when the user is done.'),
  durationMinutes: z.number().describe('The duration of the sprint in minutes.'),
});

// Define the output schema for the commitment clarification flow.
// This is NOT exported. The `runFlow` client utility will still correctly handle the typed output.
const CommitmentClarificationOutputSchema = z.object({
  clarification: z.string().describe('Concise feedback on the user sprint commitment, under 120 words.')
});

// Define the AI prompt using the schemas.
const commitmentPrompt = ai.definePrompt({
  name: 'commitmentClarificationPrompt',
  input: { schema: CommitmentClarificationInputSchema },
  output: { schema: CommitmentClarificationOutputSchema },
  prompt: `You are an assistant for a study app called FocusSprint.
Your role is to provide brief, encouraging, and clarifying feedback on a user's planned study sprint.

Your feedback should be under 120 words.

The user has provided the following commitment:
- Focusing on: {{{targetObject}}}
- Next physical action: {{{nextAction}}}
- Sprint will produce: {{{sprintDeliverable}}}
- Duration: {{{durationMinutes}}} minutes

Analyze their commitment. Your feedback should:
1.  Acknowledge their plan positively.
2.  Gently nudge them toward more specificity if their 'Next Action' or 'Deliverable' is vague. For example, if they say "work on essay," you might suggest focusing on "writing the introduction paragraph" or "creating an outline."
3.  Ensure the goal seems reasonable for the specified duration. If it seems too ambitious (e.g., "write a 10-page paper in 25 minutes"), gently suggest breaking it down into a smaller first step.

Provide only the feedback in the 'clarification' field of your response. Do not add any extra conversational text.`,
});

// Define and EXPORT the Genkit flow (needed for appRoute).
export const internalCommitmentFlow = ai.defineFlow(
  {
    name: 'commitmentClarificationFlow',
    inputSchema: CommitmentClarificationInputSchema,
    outputSchema: CommitmentClarificationOutputSchema,
  },
  async (sprintInput) => {
    try {
      console.log(
        "Commitment flow input:",
        JSON.stringify(sprintInput, null, 2)
      );
  
      const { output } = await commitmentPrompt(sprintInput);
  
      console.log(
        "Commitment flow raw output:",
        JSON.stringify(output, null, 2)
      );
  
      if (!output) {
        throw new Error("AI returned no output");
      }
  
      return output;
    } catch (e) {
      console.error("Commitment flow FAILED:", e);
      throw e; // IMPORTANT: rethrow so the 500 propagates
    }
  }
);


/**
 * The public-facing server action that clients will call.
 * This wrapper takes a plain input object and calls the internal, strongly-typed Genkit flow.
 * This pattern avoids issues with serializing complex Zod schemas across the client-server boundary.
 * @param input The raw input from the client, expected to match CommitmentClarificationInputSchema.
 * @returns The output from the Genkit flow, which will match CommitmentClarificationOutputSchema.
 */

