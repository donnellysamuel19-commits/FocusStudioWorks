import { NextResponse } from "next/server";
import { internalCommitmentFlow } from "@/ai/flows/commitment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // runFlow() (client) wraps as { data: input } — unwrap it
    const flowInput = body?.data ?? body;

    const result = await internalCommitmentFlow(flowInput);
    return NextResponse.json(result);
  } catch (e: any) {
    // Keep response simple in dev; remove stack later if you prefer
    return NextResponse.json(
      { error: { message: e?.message || String(e), name: e?.name } },
      { status: 500 }
    );
  }
}
