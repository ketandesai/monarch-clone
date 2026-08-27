import {
  Role,
  UserProfile,
  AccountDto,
  CategoryGroupDto,
  CategoryDto,
  TransactionDto,
  BudgetDto,
  RuleDto,
  RecurringItemDto,
  NetWorthPoint,
} from "@/types";
import {
  SEED_ACCOUNTS,
  SEED_CATEGORIES,
  SEED_CATEGORY_GROUPS,
  SEED_TRANSACTIONS,
  SEED_BUDGETS,
  SEED_RULES,
  SEED_RECURRING,
  generateSeedNetWorthHistory,
} from "./mock-data";
import { runRulesOnTransaction } from "./rules-engine";

// In-memory state store for interactive operations
class DataStore {
  private currentRole: Role = "ADMIN";
  private accounts: AccountDto[] = [...SEED_ACCOUNTS];
  private categoryGroups: CategoryGroupDto[] = [...SEED_CATEGORY_GROUPS];
  private categories: CategoryDto[] = [...SEED_CATEGORIES];
  private transactions: TransactionDto[] = [...SEED_TRANSACTIONS];
  private budgets: BudgetDto[] = [...SEED_BUDGETS];
  private rules: RuleDto[] = [...SEED_RULES];
  private recurring: RecurringItemDto[] = [...SEED_RECURRING];
  private netWorthHistory: NetWorthPoint[] = generateSeedNetWorthHistory();

  // Role Management
  public getRole(): Role {
    return this.currentRole;
  }

  public setRole(role: Role): Role {
    this.currentRole = role;
    return this.currentRole;
  }

  public checkWriteAccess(): void {
    if (this.currentRole === "GUEST") {
      throw new Error(
        "Permission Denied: Guest users have read-only access. Switch to Admin mode to create or modify data."
      );
    }
  }

  public getUserProfile(): UserProfile {
    return {
      id: "user-current",
      email: this.currentRole === "ADMIN" ? "admin@monarch.local" : "guest@monarch.local",
      name: this.currentRole === "ADMIN" ? "Admin User" : "Guest Viewer",
      role: this.currentRole,
    };
  }

  // Accounts
  public getAccounts(): AccountDto[] {
    return [...this.accounts];
  }

  public addAccount(account: Omit<AccountDto, "id" | "updatedAt">): AccountDto {
    this.checkWriteAccess();
    const newAcc: AccountDto = {
      ...account,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      updatedAt: new Date().toISOString(),
    };
    this.accounts.unshift(newAcc);
    return newAcc;
  }

  public updateAccount(id: string, updates: Partial<AccountDto>): AccountDto {
    this.checkWriteAccess();
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Account not found");
    this.accounts[idx] = {
      ...this.accounts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.accounts[idx];
  }

  public deleteAccount(id: string): void {
    this.checkWriteAccess();
    this.accounts = this.accounts.filter((a) => a.id !== id);
  }

  // Categories & Groups
  public getCategoryGroups(): CategoryGroupDto[] {
    return this.categoryGroups.map((g) => ({
      ...g,
      categories: this.categories.filter((c) => c.groupId === g.id),
    }));
  }

  public getCategories(): CategoryDto[] {
    return [...this.categories];
  }

  public addCategory(category: Omit<CategoryDto, "id">): CategoryDto {
    this.checkWriteAccess();
    const newCat: CategoryDto = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.categories.push(newCat);
    return newCat;
  }

  // Transactions
  public getTransactions(): TransactionDto[] {
    const accMap = new Map(this.accounts.map((a) => [a.id, a]));
    const catMap = new Map(this.categories.map((c) => [c.id, c]));
    const grpMap = new Map(this.categoryGroups.map((g) => [g.id, g]));

    return this.transactions.map((tx) => {
      const acc = accMap.get(tx.accountId);
      const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
      const grp = cat ? grpMap.get(cat.groupId) : undefined;

      return {
        ...tx,
        account: acc ? { name: acc.name, mask: acc.mask, type: acc.type } : undefined,
        category: cat,
        categoryGroup: grp ? { id: grp.id, name: grp.name, type: grp.type } : undefined,
      };
    });
  }

  public addTransaction(
    txData: Omit<TransactionDto, "id" | "createdAt">
  ): TransactionDto {
    this.checkWriteAccess();
    let processed = { ...txData };

    // Run rules engine on transaction
    processed = runRulesOnTransaction(processed, this.rules) as Omit<
      TransactionDto,
      "id" | "createdAt"
    >;

    const newTx: TransactionDto = {
      ...processed,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(newTx);
    return newTx;
  }

  public updateTransaction(
    id: string,
    updates: Partial<TransactionDto>
  ): TransactionDto {
    this.checkWriteAccess();
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Transaction not found");

    this.transactions[idx] = {
      ...this.transactions[idx],
      ...updates,
    };
    return this.transactions[idx];
  }

  public deleteTransaction(id: string): void {
    this.checkWriteAccess();
    this.transactions = this.transactions.filter((t) => t.id !== id);
  }

  public splitTransaction(
    id: string,
    splits: { categoryId: string; amount: number; notes?: string }[]
  ): TransactionDto {
    this.checkWriteAccess();
    const tx = this.transactions.find((t) => t.id === id);
    if (!tx) throw new Error("Transaction not found");

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - Math.abs(tx.amount)) > 0.01) {
      throw new Error("Split amounts sum must match total transaction amount");
    }

    tx.isSplit = true;
    tx.splits = splits.map((s, idx) => ({
      id: `split-${id}-${idx}`,
      transactionId: id,
      categoryId: s.categoryId,
      amount: s.amount,
      notes: s.notes,
    }));

    return tx;
  }

  // Budgets
  public getBudgets(): BudgetDto[] {
    return [...this.budgets];
  }

  public setBudget(
    categoryId: string,
    year: number,
    month: number,
    budgetedAmount: number,
    rolloverAmount?: number
  ): BudgetDto {
    this.checkWriteAccess();
    const idx = this.budgets.findIndex(
      (b) => b.categoryId === categoryId && b.year === year && b.month === month
    );

    if (idx !== -1) {
      this.budgets[idx].budgetedAmount = budgetedAmount;
      if (rolloverAmount !== undefined) {
        this.budgets[idx].rolloverAmount = rolloverAmount;
      }
      return this.budgets[idx];
    } else {
      const newBudget: BudgetDto = {
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: "user-current",
        categoryId,
        year,
        month,
        budgetedAmount,
        rolloverAmount: rolloverAmount || 0,
      };
      this.budgets.push(newBudget);
      return newBudget;
    }
  }

  // Rules
  public getRules(): RuleDto[] {
    return [...this.rules];
  }

  public addRule(rule: Omit<RuleDto, "id" | "createdAt">): RuleDto {
    this.checkWriteAccess();
    const newRule: RuleDto = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.rules.push(newRule);
    return newRule;
  }

  public deleteRule(id: string): void {
    this.checkWriteAccess();
    this.rules = this.rules.filter((r) => r.id !== id);
  }

  // Recurring Items
  public getRecurring(): RecurringItemDto[] {
    const catMap = new Map(this.categories.map((c) => [c.id, c]));
    return this.recurring.map((rec) => ({
      ...rec,
      category: rec.categoryId ? catMap.get(rec.categoryId) : undefined,
    }));
  }

  public addRecurring(
    item: Omit<RecurringItemDto, "id">
  ): RecurringItemDto {
    this.checkWriteAccess();
    const newRec: RecurringItemDto = {
      ...item,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    this.recurring.push(newRec);
    return newRec;
  }

  // Net Worth History
  public getNetWorthHistory(): NetWorthPoint[] {
    return [...this.netWorthHistory];
  }

  public addNetWorthSnapshot(point: NetWorthPoint): void {
    this.netWorthHistory.push(point);
  }
}

// Global singleton instance
const globalStore = globalThis as unknown as {
  dataStore: DataStore | undefined;
};

export const store = globalStore.dataStore ?? new DataStore();

if (process.env.NODE_ENV !== "production") {
  globalStore.dataStore = store;
}
