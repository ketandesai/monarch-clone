import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";
import { calculateNetWorthSummary } from "@/lib/net-worth-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get("timeframe") || "ALL") as
      | "1M"
      | "3M"
      | "6M"
      | "YTD"
      | "1Y"
      | "ALL";

    const accounts = store.getAccounts();
    const historyPoints = store.getNetWorthHistory();

    const summary = calculateNetWorthSummary(accounts, historyPoints, timeframe);

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate net worth";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
