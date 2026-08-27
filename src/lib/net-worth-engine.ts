import {
  AccountDto,
  CategoryGroupDto,
  CategoryDto,
  TransactionDto,
  NetWorthPoint,
  NetWorthSummary,
  CashFlowSummary,
  SankeyData,
  SankeyNode,
  SankeyLink,
} from "@/types";

export function calculateNetWorthSummary(
  accounts: AccountDto[],
  historyPoints: NetWorthPoint[],
  timeframe: "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL" = "ALL"
): NetWorthSummary {
  const visibleAccounts = accounts.filter((a) => !a.isHidden);

  const cash = visibleAccounts.filter(
    (a) => a.type === "DEPOSITORY"
  );
  const investments = visibleAccounts.filter(
    (a) => a.type === "INVESTMENT"
  );
  const creditCards = visibleAccounts.filter(
    (a) => a.type === "CREDIT"
  );
  const loans = visibleAccounts.filter(
    (a) => a.type === "LOAN"
  );
  const other = visibleAccounts.filter(
    (a) => a.type === "OTHER"
  );

  const totalCash = cash.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalInvestments = investments.reduce(
    (sum, a) => sum + a.currentBalance,
    0
  );
  const totalOther = other.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalAssets = totalCash + totalInvestments + totalOther;

  const totalCreditCards = creditCards.reduce(
    (sum, a) => sum + Math.abs(a.currentBalance),
    0
  );
  const totalLoans = loans.reduce(
    (sum, a) => sum + Math.abs(a.currentBalance),
    0
  );
  const totalLiabilities = totalCreditCards + totalLoans;

  const currentNetWorth = totalAssets - totalLiabilities;

  // Filter history points according to timeframe
  const now = new Date();
  let filteredPoints = [...historyPoints];

  if (timeframe === "1M") {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    filteredPoints = historyPoints.filter((p) => new Date(p.date) >= cutoff);
  } else if (timeframe === "3M") {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    filteredPoints = historyPoints.filter((p) => new Date(p.date) >= cutoff);
  } else if (timeframe === "6M") {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    filteredPoints = historyPoints.filter((p) => new Date(p.date) >= cutoff);
  } else if (timeframe === "YTD") {
    const cutoff = new Date(now.getFullYear(), 0, 1);
    filteredPoints = historyPoints.filter((p) => new Date(p.date) >= cutoff);
  } else if (timeframe === "1Y") {
    const cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    filteredPoints = historyPoints.filter((p) => new Date(p.date) >= cutoff);
  }

  // Ensure current latest point is included at the end
  const latestDateStr = now.toISOString().split("T")[0];
  const lastPoint = filteredPoints[filteredPoints.length - 1];
  if (!lastPoint || lastPoint.date !== latestDateStr) {
    filteredPoints.push({
      date: latestDateStr,
      netWorth: Math.round(currentNetWorth),
      assets: Math.round(totalAssets),
      liabilities: Math.round(totalLiabilities),
    });
  }

  const startPoint = filteredPoints[0] || {
    netWorth: currentNetWorth,
  };
  const periodChangeAmount = currentNetWorth - startPoint.netWorth;
  const periodChangePercent =
    startPoint.netWorth !== 0
      ? (periodChangeAmount / Math.abs(startPoint.netWorth)) * 100
      : 0;

  return {
    currentNetWorth,
    totalAssets,
    totalLiabilities,
    periodChangeAmount,
    periodChangePercent,
    timeSeries: filteredPoints,
    accountsByType: {
      cash,
      investments,
      creditCards,
      loans,
      other,
    },
  };
}

export function calculateCashFlowSummary(
  month: number,
  year: number,
  groups: CategoryGroupDto[],
  categories: CategoryDto[],
  transactions: TransactionDto[]
): CashFlowSummary {
  const monthTransactions = transactions.filter((tx) => {
    if (tx.isExcludedFromBudget) return false;
    const txDate = new Date(tx.date);
    return (
      txDate.getUTCFullYear() === year && txDate.getUTCMonth() + 1 === month
    );
  });

  const catMap = new Map<string, CategoryDto>();
  for (const cat of categories) {
    catMap.set(cat.id, cat);
  }

  const groupMap = new Map<string, CategoryGroupDto>();
  for (const grp of groups) {
    groupMap.set(grp.id, grp);
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  const incomeByCat = new Map<string, number>();
  const expenseByGroup = new Map<string, Map<string, number>>();

  for (const tx of monthTransactions) {
    const handleEntry = (categoryId: string | undefined | null, amount: number) => {
      if (!categoryId) return;
      const cat = catMap.get(categoryId);
      if (!cat) return;
      const group = groupMap.get(cat.groupId);
      if (!group) return;

      if (group.type === "INCOME") {
        const inc = Math.abs(amount);
        totalIncome += inc;
        incomeByCat.set(cat.name, (incomeByCat.get(cat.name) || 0) + inc);
      } else {
        const exp = Math.max(0, amount);
        totalExpenses += exp;
        if (!expenseByGroup.has(group.name)) {
          expenseByGroup.set(group.name, new Map<string, number>());
        }
        const grpCats = expenseByGroup.get(group.name)!;
        grpCats.set(cat.name, (grpCats.get(cat.name) || 0) + exp);
      }
    };

    if (tx.isSplit && tx.splits && tx.splits.length > 0) {
      for (const split of tx.splits) {
        handleEntry(split.categoryId, split.amount);
      }
    } else {
      handleEntry(tx.categoryId, tx.amount);
    }
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const incomeBreakdown = Array.from(incomeByCat.entries()).map(
    ([categoryName, amount]) => ({ categoryName, amount })
  );

  const expenseBreakdown = Array.from(expenseByGroup.entries()).map(
    ([groupName, catsMap]) => ({
      groupName,
      amount: Array.from(catsMap.values()).reduce((a, b) => a + b, 0),
      categories: Array.from(catsMap.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
    })
  );

  // Build Sankey Data
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Node 0: Income Sources -> Total Income (Hub)
  const hubIndex = 0;
  nodes.push({ name: "Total Inflow", color: "#10B981" });

  incomeBreakdown.forEach((inc) => {
    const nodeIdx = nodes.length;
    nodes.push({ name: inc.categoryName, color: "#059669" });
    links.push({ source: nodeIdx, target: hubIndex, value: Math.max(inc.amount, 1) });
  });

  // Hub -> Expense Groups & Net Savings
  expenseBreakdown.forEach((exp) => {
    const grpIdx = nodes.length;
    nodes.push({ name: exp.groupName, color: "#6366F1" });
    links.push({ source: hubIndex, target: grpIdx, value: Math.max(exp.amount, 1) });

    // Expense Groups -> Category Sub-nodes
    exp.categories.forEach((cat) => {
      const catIdx = nodes.length;
      nodes.push({ name: cat.name, color: "#EC4899" });
      links.push({ source: grpIdx, target: catIdx, value: Math.max(cat.amount, 1) });
    });
  });

  if (netSavings > 0) {
    const savingsIdx = nodes.length;
    nodes.push({ name: "Net Savings", color: "#3B82F6" });
    links.push({ source: hubIndex, target: savingsIdx, value: netSavings });
  }

  const sankey: SankeyData = { nodes, links };

  return {
    month,
    year,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    incomeBreakdown,
    expenseBreakdown,
    sankey,
  };
}
