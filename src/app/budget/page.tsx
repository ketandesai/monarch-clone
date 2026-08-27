"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BudgetOverview,
  BudgetGroupRow,
  BudgetCategoryRow,
  Role,
} from "@/types";
import { formatCurrency, formatPercent, MONTH_NAMES } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Edit2,
  Lock,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [role, setRole] = useState<Role>("ADMIN");
  const [loading, setLoading] = useState(true);

  // Edit Budget Target Dialog State
  const [editCategory, setEditCategory] = useState<BudgetCategoryRow | null>(null);
  const [targetAmount, setTargetAmount] = useState("");
  const [rolloverAmount, setRolloverAmount] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  const fetchBudget = async () => {
    try {
      const [bRes, roleRes] = await Promise.all([
        fetch(`/api/budgets?year=${year}&month=${month}`),
        fetch("/api/auth/role"),
      ]);
      const bData = await bRes.json();
      const roleData = await roleRes.json();

      if (bData.overview) setOverview(bData.overview);
      if (roleData.profile?.role) setRole(roleData.profile.role);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const openEditModal = (row: BudgetCategoryRow) => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to modify budget targets.");
      return;
    }
    setEditCategory(row);
    setTargetAmount(String(row.budgeted));
    setRolloverAmount(String(row.rollover));
  };

  const handleSaveBudget = async () => {
    if (!editCategory) return;
    setSavingBudget(true);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editCategory.category.id,
          year,
          month,
          budgetedAmount: parseFloat(targetAmount) || 0,
          rolloverAmount: parseFloat(rolloverAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update budget");
      } else {
        setEditCategory(null);
        fetchBudget();
      }
    } catch {
      alert("Failed to update budget");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Flexible Monthly Budget"
        subtitle="Set category targets, track spending burn rates, and carry forward rollovers"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Budget Overview KPI Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Budgeted Income
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {overview ? formatCurrency(overview.totalIncomeBudgeted) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Actual Earned:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {overview ? formatCurrency(overview.totalIncomeActual) : "$0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Budgeted Expenses
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {overview ? formatCurrency(overview.totalExpenseBudgeted) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Actual Spent:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {overview ? formatCurrency(overview.totalExpenseActual) : "$0"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Net Planned Surplus
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {overview ? formatCurrency(overview.netBudgeted, { showSign: true }) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Actual Remaining:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {overview ? formatCurrency(overview.netActual, { showSign: true }) : "$0"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Category Groups Table */}
        <div className="space-y-6">
          {overview?.groups.map((groupRow) => {
            const isIncome = groupRow.group.type === "INCOME";

            return (
              <Card
                key={groupRow.group.id}
                className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
              >
                {/* Group Header Banner */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {groupRow.group.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({groupRow.categories.length} categories)
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-400">Target: </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(groupRow.totalBudgeted)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Actual: </span>
                      <span
                        className={`font-bold ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {formatCurrency(groupRow.totalActual)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Remaining: </span>
                      <span
                        className={`font-bold ${
                          groupRow.totalRemaining >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatCurrency(groupRow.totalRemaining, { showSign: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[140px] text-right">Target</TableHead>
                      <TableHead className="w-[140px] text-right">Actual</TableHead>
                      <TableHead className="w-[130px] text-right">Rollover</TableHead>
                      <TableHead className="w-[140px] text-right">Remaining</TableHead>
                      <TableHead className="w-[180px]">Burn Rate</TableHead>
                      <TableHead className="w-[60px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupRow.categories.map((catRow) => {
                      const totalAvailable = catRow.budgeted + catRow.rollover;
                      const burnPercent =
                        totalAvailable > 0
                          ? Math.min(100, Math.round((catRow.actualSpent / totalAvailable) * 100))
                          : catRow.actualSpent > 0
                          ? 100
                          : 0;

                      const isOverspent =
                        !isIncome && totalAvailable > 0 && catRow.actualSpent > totalAvailable;

                      return (
                        <TableRow key={catRow.category.id} className="group">
                          {/* Category Name & Rollover Indicator */}
                          <TableCell className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{catRow.category.name}</span>
                              {catRow.category.isRolloverEnabled && (
                                <span title="Rollover enabled">
                                  <RotateCcw className="h-3 w-3 text-indigo-500" />
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Budgeted Target */}
                          <TableCell className="text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(catRow.budgeted)}
                          </TableCell>

                          {/* Actual Spent */}
                          <TableCell className="text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(catRow.actualSpent)}
                          </TableCell>

                          {/* Rollover */}
                          <TableCell className="text-right text-xs">
                            {catRow.rollover !== 0 ? (
                              <span
                                className={`font-semibold ${
                                  catRow.rollover > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {formatCurrency(catRow.rollover, { showSign: true })}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </TableCell>

                          {/* Remaining */}
                          <TableCell className="text-right text-xs">
                            <span
                              className={`font-bold ${
                                isOverspent
                                  ? "text-rose-600 dark:text-rose-400"
                                  : catRow.remaining >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {formatCurrency(catRow.remaining, { showSign: true })}
                            </span>
                          </TableCell>

                          {/* Progress Burn Bar */}
                          <TableCell>
                            <div className="space-y-1">
                              <Progress
                                value={burnPercent}
                                indicatorClassName={
                                  isIncome
                                    ? "bg-emerald-500"
                                    : isOverspent
                                    ? "bg-rose-500"
                                    : burnPercent > 80
                                    ? "bg-amber-500"
                                    : "bg-blue-600"
                                }
                              />
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{burnPercent}%</span>
                                {isOverspent && (
                                  <span className="text-rose-500 font-medium">Over budget</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Edit Action */}
                          <TableCell className="text-right">
                            {role === "ADMIN" ? (
                              <button
                                onClick={() => openEditModal(catRow)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                                title="Edit monthly target & rollover"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <span title="Read-only in Guest mode">
                                <Lock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            );
          })}
        </div>

        {/* Edit Budget Dialog */}
        <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit Budget for {editCategory?.category.name}
              </DialogTitle>
              <DialogDescription>
                Adjust the spending target and carryover rollover balance for {MONTH_NAMES[month - 1]} {year}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Monthly Target Amount ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rollover Carryover from Prior Month ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={rolloverAmount}
                  onChange={(e) => setRolloverAmount(e.target.value)}
                  className="mt-1 text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Positive amounts add available funds; negative amounts subtract prior deficit.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditCategory(null)}
                disabled={savingBudget}
              >
                Cancel
              </Button>
              <Button
                variant="monarch"
                onClick={handleSaveBudget}
                disabled={savingBudget}
              >
                {savingBudget ? "Saving..." : "Update Target"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
