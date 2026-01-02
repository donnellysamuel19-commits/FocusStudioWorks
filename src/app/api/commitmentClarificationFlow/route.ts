import { NextRequest, NextResponse } from "next/server";
import { appRoute } from "@genkit-ai/next";
import { internalCommitmentFlow } from "@/ai/flows/commitment";

console.log(">>> route.ts module loaded");

export const runtime = "nodejs";

const handler = appRoute(internalCommitmentFlow);

export async function POST(req: NextRequest) {
  console.log(">>> HIT /api/commitmentClarificationFlow");
  try {
    return await handler(req);
  } catch (e: any) {
    console.error(">>> route.ts ERROR:", e);
    return NextResponse.json(
      { error: { message: e?.message ?? String(e), stack: e?.stack } },
      { status: 500 }
    );
  }
}
