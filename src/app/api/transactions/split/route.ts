import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, splits } = body;

    if (!transactionId || !Array.isArray(splits) || splits.length < 2) {
      return NextResponse.json(
        { error: "Invalid split request. Must provide transactionId and at least 2 split allocations." },
        { status: 400 }
      );
    }

    const transaction = store.splitTransaction(transactionId, splits);
    return NextResponse.json({ transaction });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to split transaction";
    const status = message.includes("Permission Denied") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
