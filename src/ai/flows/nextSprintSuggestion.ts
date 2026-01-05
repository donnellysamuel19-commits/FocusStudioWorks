
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { geminiPro } from 'genkitx-vertexai';
import * as z from 'zod';
import { getStudySessionsForAssignment, saveAIOutput, getLatestAIOutput } from '../../lib/firebase/firestore';
import { StudySession } from '../../types';

const nextSprintSuggestionSystemInstruction = `You are assisting a study sprint app called FocusSprint.

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
Non-authoritative (‘suggest’, not ‘should’).

Task:
Analyze the recent study sessions and identify:
- What types of sprints were completed successfully
- What types were abandoned and why (scope, blockers)

Then suggest ONE narrowly scoped next sprint idea
that fits a 10–25 minute session.

If the data is inconclusive, say so and suggest keeping the next sprint small.`;

export const nextSprintSuggestionFlow = defineFlow(
  {
    name: 'nextSprintSuggestionFlow',
    inputSchema: z.object({
      userId: z.string(),
      assignmentId: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ userId, assignmentId }) => {
    
    const studySessions = await getStudySessionsForAssignment(userId, assignmentId, 8);

    if (studySessions.length === 0) {
      return "Complete at least one study sprint to receive suggestions.";
    }

    const latestSession = studySessions[0];
    const latestOutput = await getLatestAIOutput(userId, assignmentId, "feature2_next_sprint_suggestion");

    if(latestOutput && latestOutput.createdAt > latestSession.createdAt) {
      return latestOutput.ai_original;
    }

    const llmResponse = await geminiPro.generate({
      prompt: `${JSON.stringify(studySessions)}`,
      config: {
        temperature: 0.3,
      },
      systemInstruction: {
        parts: [ {text: nextSprintSuggestionSystemInstruction }]
      }
    });

    const suggestion = llmResponse.text();

    await saveAIOutput({
      userId,
      assignmentId,
      featureName: "feature2_next_sprint_suggestion",
      ai_original: suggestion,
      createdAt: new Date(),
    });

    return suggestion;
  }
);
