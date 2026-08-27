import {
  CategoryGroupDto,
  CategoryDto,
  TransactionDto,
  BudgetDto,
  BudgetOverview,
  BudgetGroupRow,
  BudgetCategoryRow,
} from "@/types";

export function calculateBudgetOverview(
  year: number,
  month: number, // 1 to 12
  groups: CategoryGroupDto[],
  categories: CategoryDto[],
  transactions: TransactionDto[],
  budgets: BudgetDto[]
): BudgetOverview {
  // Filter transactions belonging to target year & month
  const monthTransactions = transactions.filter((tx) => {
    if (tx.isExcludedFromBudget) return false;
    const txDate = new Date(tx.date);
    return (
      txDate.getUTCFullYear() === year && txDate.getUTCMonth() + 1 === month
    );
  });

  // Calculate actual spending / income per category
  const actualByCategory = new Map<string, number>();

  for (const tx of monthTransactions) {
    if (tx.isSplit && tx.splits && tx.splits.length > 0) {
      for (const split of tx.splits) {
        const cur = actualByCategory.get(split.categoryId) || 0;
        actualByCategory.set(split.categoryId, cur + split.amount);
      }
    } else if (tx.categoryId) {
      const cur = actualByCategory.get(tx.categoryId) || 0;
      actualByCategory.set(tx.categoryId, cur + tx.amount);
    }
  }

  // Map budgets by categoryId
  const budgetMap = new Map<string, BudgetDto>();
  for (const b of budgets) {
    if (b.year === year && b.month === month) {
      budgetMap.set(b.categoryId, b);
    }
  }

  const groupRows: BudgetGroupRow[] = [];
  let totalIncomeBudgeted = 0;
  let totalIncomeActual = 0;
  let totalExpenseBudgeted = 0;
  let totalExpenseActual = 0;

  for (const group of groups) {
    const groupCategories = categories.filter((c) => c.groupId === group.id);
    const categoryRows: BudgetCategoryRow[] = [];

    let groupBudgeted = 0;
    let groupActual = 0;
    let groupRollover = 0;
    let groupRemaining = 0;

    for (const cat of groupCategories) {
      const budgetEntry = budgetMap.get(cat.id);
      const budgeted = budgetEntry ? budgetEntry.budgetedAmount : 0;
      const rollover = budgetEntry && cat.isRolloverEnabled ? budgetEntry.rolloverAmount : 0;
      const rawActual = actualByCategory.get(cat.id) || 0;

      // Income transactions are stored as negative in our convention, or positive in expenses
      const actualSpent = group.type === "INCOME" ? Math.abs(Math.min(0, -rawActual)) : Math.max(0, rawActual);

      let remaining = 0;
      if (group.type === "INCOME") {
        remaining = actualSpent - (budgeted + rollover);
      } else {
        remaining = budgeted + rollover - actualSpent;
      }

      groupBudgeted += budgeted;
      groupActual += actualSpent;
      groupRollover += rollover;
      groupRemaining += remaining;

      categoryRows.push({
        category: cat,
        budgeted,
        actualSpent,
        rollover,
        remaining,
      });
    }

    if (group.type === "INCOME") {
      totalIncomeBudgeted += groupBudgeted;
      totalIncomeActual += groupActual;
    } else {
      totalExpenseBudgeted += groupBudgeted;
      totalExpenseActual += groupActual;
    }

    groupRows.push({
      group,
      totalBudgeted: groupBudgeted,
      totalActual: groupActual,
      totalRollover: groupRollover,
      totalRemaining: groupRemaining,
      categories: categoryRows,
    });
  }

  return {
    year,
    month,
    totalIncomeBudgeted,
    totalIncomeActual,
    totalExpenseBudgeted,
    totalExpenseActual,
    netBudgeted: totalIncomeBudgeted - totalExpenseBudgeted,
    netActual: totalIncomeActual - totalExpenseActual,
    groups: groupRows,
  };
}
