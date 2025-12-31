
/**
 * @fileOverview A catch-all API route for handling Genkit flow requests from the client.
 * This route handler is essential for the Genkit Next.js plugin to work correctly.
 * It uses the `genkitNextHandler` to process incoming requests and route them to the appropriate Genkit flows.
 * All Genkit flows defined in the application will be exposed through this endpoint.
 */

import { genkitNextHandler } from '@genkit-ai/next';

export const GET = genkitNextHandler();
export const POST = genkitNextHandler();
