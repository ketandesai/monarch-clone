"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SplitTransactionModal } from "@/components/transactions/SplitTransactionModal";
import { RuleEditorModal } from "@/components/transactions/RuleEditorModal";
import {
  TransactionDto,
  CategoryDto,
  AccountDto,
  Role,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Split,
  SlidersHorizontal,
  Plus,
  Trash2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [role, setRole] = useState<Role>("ADMIN");
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [splitTx, setSplitTx] = useState<TransactionDto | null>(null);
  const [ruleMerchant, setRuleMerchant] = useState<string | null>(null);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);

  // New Transaction Form State
  const [newMerchant, setNewMerchant] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newAccountId, setNewAccountId] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedAccountId) params.set("accountId", selectedAccountId);
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);

      const [txRes, catRes, accRes, roleRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch("/api/categories"),
        fetch("/api/accounts"),
        fetch("/api/auth/role"),
      ]);

      const [txData, catData, accData, roleData] = await Promise.all([
        txRes.json(),
        catRes.json(),
        accRes.json(),
        roleRes.json(),
      ]);

      if (txData.transactions) setTransactions(txData.transactions);
      if (catData.categories) {
        setCategories(catData.categories);
        if (!newCategoryId && catData.categories.length) setNewCategoryId(catData.categories[0].id);
      }
      if (accData.accounts) {
        setAccounts(accData.accounts);
        if (!newAccountId && accData.accounts.length) setNewAccountId(accData.accounts[0].id);
      }
      if (roleData.profile?.role) setRole(roleData.profile.role);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedAccountId, selectedCategoryId]);

  const handleCategoryChange = async (txId: string, categoryId: string) => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to recategorize.");
      return;
    }

    try {
      await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId, categoryId }),
      });
      fetchData();
    } catch {
      alert("Failed to update category");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to delete transactions.");
      return;
    }
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      alert("Failed to delete transaction");
    }
  };

  const handleCreateTransaction = async () => {
    if (!newMerchant.trim() || !newAmount || !newAccountId) return;

    const amt = parseFloat(newAmount) || 0;
    const finalAmount = newType === "income" ? -Math.abs(amt) : Math.abs(amt);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-admin",
          accountId: newAccountId,
          categoryId: newCategoryId || null,
          date: newDate,
          amount: finalAmount,
          originalName: newMerchant.trim(),
          cleanName: newMerchant.trim(),
          merchantName: newMerchant.trim(),
          pending: false,
          tags: ["manual"],
          isExcludedFromBudget: false,
          isSplit: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create transaction");
      } else {
        setIsNewTxOpen(false);
        setNewMerchant("");
        setNewAmount("");
        fetchData();
      }
    } catch {
      alert("Failed to create transaction");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Transactions"
        subtitle="Search, filter, categorize, and split transaction records"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search merchant, tag, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Account Filter */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.mask ? `•••• ${a.mask}` : a.type})
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {role === "ADMIN" && (
              <Button
                variant="monarch"
                size="sm"
                onClick={() => setIsNewTxOpen(true)}
                className="h-9 gap-1.5 text-xs"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            )}
          </div>
        </div>

        {/* Transactions Table Card */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Merchant / Description</TableHead>
                <TableHead className="w-[200px]">Category</TableHead>
                <TableHead className="w-[180px]">Account</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[110px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    No transactions found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    {/* Date */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date, "short")}
                    </TableCell>

                    {/* Merchant & Tags */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {tx.cleanName || tx.merchantName || tx.originalName}
                          </span>
                          {tx.isSplit && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              Split ({tx.splits?.length || 2})
                            </Badge>
                          )}
                          {tx.pending && (
                            <Badge variant="secondary" className="text-[10px] py-0 text-amber-600">
                              Pending
                            </Badge>
                          )}
                        </div>
                        {tx.cleanName && tx.originalName !== tx.cleanName && (
                          <span className="text-[11px] text-slate-400 truncate max-w-sm">
                            {tx.originalName}
                          </span>
                        )}
                        {tx.notes && (
                          <span className="text-[11px] text-blue-500/80 italic mt-0.5">
                            Note: {tx.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Category Select */}
                    <TableCell>
                      {role === "ADMIN" ? (
                        <select
                          value={tx.categoryId || ""}
                          onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tx.category?.name || "Uncategorized"}
                        </span>
                      )}
                    </TableCell>

                    {/* Account Badge */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {tx.account?.name || "Account"}
                      </span>
                      {tx.account?.mask && (
                        <span className="text-[11px] text-slate-400 ml-1">
                          (••• {tx.account.mask})
                        </span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-bold ${
                          tx.amount < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {tx.amount < 0
                          ? formatCurrency(Math.abs(tx.amount), { showSign: true })
                          : formatCurrency(tx.amount)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {role === "ADMIN" ? (
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => setSplitTx(tx)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Split transaction"
                          >
                            <Split className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setRuleMerchant(
                                tx.merchantName || tx.cleanName || tx.originalName
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Create auto-rule for merchant"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex justify-end text-slate-300 dark:text-slate-600">
                          <Lock className="h-4 w-4" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Split Transaction Modal */}
        <SplitTransactionModal
          transaction={splitTx}
          categories={categories}
          isOpen={!!splitTx}
          onClose={() => setSplitTx(null)}
          onSuccess={fetchData}
        />

        {/* Rule Builder Modal */}
        <RuleEditorModal
          categories={categories}
          defaultMerchant={ruleMerchant || ""}
          isOpen={!!ruleMerchant}
          onClose={() => setRuleMerchant(null)}
          onSuccess={fetchData}
        />

        {/* Add Transaction Dialog */}
        <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Manual Transaction</DialogTitle>
              <DialogDescription>
                Record cash or offline expenses and income.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Merchant / Description
                </label>
                <Input
                  placeholder="e.g. Farmer's Market, Landlord, Bonus"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "expense" | "income")}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Account
                  </label>
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsNewTxOpen(false)}>
                Cancel
              </Button>
              <Button variant="monarch" onClick={handleCreateTransaction}>
                Save Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
