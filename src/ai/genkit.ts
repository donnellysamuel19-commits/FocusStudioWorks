import "server-only";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

console.log(
  "GENKIT ENV CHECK:",
  "cwd=",
  process.cwd(),
  "GOOGLE_GENAI_API_KEY present?",
  Boolean(process.env.GOOGLE_GENAI_API_KEY),
  "len=",
  process.env.GOOGLE_GENAI_API_KEY?.length ?? 0
);

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GOOGLE_GENAI_API_KEY");
}

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: "googleai/gemini-2.5-flash",
});

