export type Role = "ADMIN" | "GUEST";

export type AccountType =
  | "DEPOSITORY"
  | "INVESTMENT"
  | "CREDIT"
  | "LOAN"
  | "OTHER";

export type CategoryGroupType =
  | "INCOME"
  | "FIXED_EXPENSE"
  | "VARIABLE_EXPENSE"
  | "NON_MONTHLY";

export type Frequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALLY";

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}

export interface PlaidItemDto {
  id: string;
  institutionName: string;
  institutionId?: string | null;
  status: string;
  createdAt: string;
}

export interface AccountDto {
  id: string;
  userId: string;
  plaidItemId?: string | null;
  plaidAccountId?: string | null;
  institutionName?: string;
  name: string;
  officialName?: string | null;
  mask?: string | null;
  type: AccountType;
  subtype?: string | null;
  currentBalance: number;
  availableBalance?: number | null;
  isoCurrencyCode: string;
  isHidden: boolean;
  updatedAt: string;
}

export interface AccountBalanceHistoryDto {
  id: string;
  accountId: string;
  date: string;
  currentBalance: number;
  availableBalance?: number | null;
}

export interface CategoryGroupDto {
  id: string;
  name: string;
  type: CategoryGroupType;
  sortOrder: number;
  categories: CategoryDto[];
}

export interface CategoryDto {
  id: string;
  groupId: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isRolloverEnabled: boolean;
  isHidden: boolean;
  sortOrder: number;
}

export interface TransactionSplitDto {
  id: string;
  transactionId: string;
  categoryId: string;
  amount: number;
  notes?: string | null;
  category?: CategoryDto;
}

export interface TransactionDto {
  id: string;
  userId: string;
  accountId: string;
  account?: {
    name: string;
    mask?: string | null;
    type: AccountType;
  };
  categoryId?: string | null;
  category?: CategoryDto | null;
  categoryGroup?: {
    id: string;
    name: string;
    type: CategoryGroupType;
  };
  plaidTransactionId?: string | null;
  date: string;
  amount: number; // positive for expense, negative for income
  originalName: string;
  cleanName?: string | null;
  merchantName?: string | null;
  pending: boolean;
  notes?: string | null;
  tags: string[];
  isExcludedFromBudget: boolean;
  isSplit: boolean;
  splits?: TransactionSplitDto[];
  createdAt: string;
}

export interface BudgetDto {
  id: string;
  userId: string;
  categoryId: string;
  year: number;
  month: number;
  budgetedAmount: number;
  rolloverAmount: number;
}

export interface BudgetCategoryRow {
  category: CategoryDto;
  budgeted: number;
  actualSpent: number;
  rollover: number;
  remaining: number; // budgeted + rollover - actualSpent (for expense) or actualSpent - budgeted (for income)
}

export interface BudgetGroupRow {
  group: CategoryGroupDto;
  totalBudgeted: number;
  totalActual: number;
  totalRollover: number;
  totalRemaining: number;
  categories: BudgetCategoryRow[];
}

export interface BudgetOverview {
  year: number;
  month: number;
  totalIncomeBudgeted: number;
  totalIncomeActual: number;
  totalExpenseBudgeted: number;
  totalExpenseActual: number;
  netBudgeted: number;
  netActual: number;
  groups: BudgetGroupRow[];
}

export interface RuleCondition {
  field: "merchant" | "originalName" | "amount" | "accountId";
  operator: "contains" | "equals" | "starts_with" | "greater_than" | "less_than";
  value: string | number;
}

export interface RuleAction {
  type: "set_category" | "rename_merchant" | "add_tag" | "exclude_budget";
  value: string | boolean;
}

export interface RuleDto {
  id: string;
  userId: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  createdAt: string;
}

export interface RecurringItemDto {
  id: string;
  userId: string;
  accountId?: string | null;
  categoryId?: string | null;
  category?: CategoryDto | null;
  merchantName: string;
  expectedAmount: number;
  frequency: Frequency;
  nextDate: string;
  lastDate?: string | null;
  isActive: boolean;
}

export interface NetWorthPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface NetWorthSummary {
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  periodChangeAmount: number;
  periodChangePercent: number;
  timeSeries: NetWorthPoint[];
  accountsByType: {
    cash: AccountDto[];
    investments: AccountDto[];
    creditCards: AccountDto[];
    loans: AccountDto[];
    other: AccountDto[];
  };
}

export interface SankeyNode {
  name: string;
  category?: string;
  color?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface CashFlowSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage
  incomeBreakdown: { categoryName: string; amount: number }[];
  expenseBreakdown: { groupName: string; amount: number; categories: { name: string; amount: number }[] }[];
  sankey: SankeyData;
}
