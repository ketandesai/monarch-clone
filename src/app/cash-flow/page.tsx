"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { CashFlowSummary } from "@/types";
import { formatCurrency, formatPercent, MONTH_NAMES } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CashFlowPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCashFlow = async () => {
    try {
      const res = await fetch(`/api/cash-flow?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
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

  // Format spending pie chart data
  const pieData =
    summary?.expenseBreakdown.flatMap((grp) =>
      grp.categories.map((c) => ({
        name: c.name,
        amount: c.amount,
      }))
    ) || [];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Cash Flow & Money Flow"
        subtitle="Visualize how your income moves through expense categories into savings"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* Month Selector Bar */}
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

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Income
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {summary ? formatCurrency(summary.totalIncome) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">Total inflow earned</div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Expenses
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {summary ? formatCurrency(summary.totalExpenses) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">Total outflow spent</div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Net Savings
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {summary ? formatCurrency(summary.netSavings, { showSign: true }) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">Income minus expenses</div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Savings Rate
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {summary ? formatPercent(summary.savingsRate) : "0%"}
              </div>
              <div className="mt-1 text-xs text-slate-400">Proportion of income saved</div>
            </CardContent>
          </Card>
        </div>

        {/* Sankey Flow Diagram Card */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 p-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <CardTitle>Cash Flow Sankey Diagram</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hover over nodes and flow bands to inspect individual stream allocations
              </p>
            </div>
          </div>

          <div className="py-4">
            {summary && <SankeyChart data={summary.sankey} width={820} height={380} />}
          </div>
        </Card>

        {/* Detailed Breakdown Tables and Spending Donut */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Categorized Outflow List - 2 Cols */}
          <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800/80 p-6">
            <CardTitle className="pb-4">Expense Breakdown by Group</CardTitle>

            <div className="space-y-6">
              {summary?.expenseBreakdown.map((grp) => (
                <div key={grp.groupName} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {grp.groupName}
                    </span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(grp.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {grp.categories.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between rounded-lg bg-slate-50/70 px-3 py-2 text-xs dark:bg-slate-900/40"
                      >
                        <span className="text-slate-600 dark:text-slate-400">{c.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          {formatCurrency(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Spending Distribution Donut - 1 Col */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col justify-between">
            <div>
              <CardTitle className="pb-2">Expense Distribution</CardTitle>
              <p className="text-xs text-slate-400 pb-4">
                Category proportion of total expenses
              </p>
              <SpendingPieChart data={pieData} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800/60 dark:bg-slate-900/50">
              <div className="flex justify-between font-medium">
                <span>Net Cash Retained:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {summary ? formatCurrency(summary.netSavings) : "$0"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
