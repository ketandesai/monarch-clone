import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";
import { calculateCashFlowSummary } from "@/lib/net-worth-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

    const groups = store.getCategoryGroups();
    const categories = store.getCategories();
    const transactions = store.getTransactions();

    const summary = calculateCashFlowSummary(
      month,
      year,
      groups,
      categories,
      transactions
    );

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate cash flow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
