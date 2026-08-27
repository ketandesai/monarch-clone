import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";
import { calculateBudgetOverview } from "@/lib/budget-engine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

    const groups = store.getCategoryGroups();
    const categories = store.getCategories();
    const transactions = store.getTransactions();
    const budgets = store.getBudgets();

    const overview = calculateBudgetOverview(
      year,
      month,
      groups,
      categories,
      transactions,
      budgets
    );

    return NextResponse.json({ overview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate budget";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, year, month, budgetedAmount, rolloverAmount } = body;

    if (!categoryId || !year || !month || budgetedAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (categoryId, year, month, budgetedAmount)" },
        { status: 400 }
      );
    }

    const budget = store.setBudget(
      categoryId,
      year,
      month,
      Number(budgetedAmount),
      rolloverAmount !== undefined ? Number(rolloverAmount) : undefined
    );

    return NextResponse.json({ budget });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update budget";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
