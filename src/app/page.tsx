"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { PlaidLinkButton } from "@/components/accounts/PlaidLinkButton";
import {
  NetWorthSummary,
  CashFlowSummary,
  TransactionDto,
  RecurringItemDto,
} from "@/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [recurring, setRecurring] = useState<RecurringItemDto[]>([]);
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL">("1Y");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [nwRes, cfRes, txRes, recRes] = await Promise.all([
        fetch(`/api/net-worth?timeframe=${timeframe}`),
        fetch(`/api/cash-flow`),
        fetch(`/api/transactions`),
        fetch(`/api/recurring`),
      ]);

      const [nwData, cfData, txData, recData] = await Promise.all([
        nwRes.json(),
        cfRes.json(),
        txRes.json(),
        recRes.json(),
      ]);

      if (nwData.summary) setNetWorth(nwData.summary);
      if (cfData.summary) setCashFlow(cfData.summary);
      if (txData.transactions) setTransactions(txData.transactions.slice(0, 6));
      if (recData.recurring) setRecurring(recData.recurring);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Financial Dashboard"
        subtitle="Real-time net worth, cash flow & account balances"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Net Worth Card */}
          <Card className="card-hover relative overflow-hidden border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Worth
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {netWorth ? formatCurrency(netWorth.currentNetWorth) : "—"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {netWorth && netWorth.periodChangeAmount >= 0 ? (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {formatCurrency(netWorth.periodChangeAmount, { showSign: true })} (
                    {formatPercent(netWorth.periodChangePercent)})
                  </span>
                ) : (
                  <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    {netWorth
                      ? `${formatCurrency(netWorth.periodChangeAmount)} (${formatPercent(
                          netWorth.periodChangePercent
                        )})`
                      : ""}
                  </span>
                )}
                <span className="text-slate-400">vs period start</span>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow / Savings Rate Card */}
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Savings (This Month)
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {cashFlow ? formatCurrency(cashFlow.netSavings, { showSign: true }) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Savings Rate:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {cashFlow ? formatPercent(cashFlow.savingsRate) : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Assets Card */}
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Assets
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {netWorth ? formatCurrency(netWorth.totalAssets) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Cash, Brokerage & 401(k)
              </div>
            </CardContent>
          </Card>

          {/* Total Liabilities Card */}
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Liabilities
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {netWorth ? formatCurrency(netWorth.totalLiabilities) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Credit Cards & Mortgages
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Net Worth Trend - 2 Columns */}
          <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800/80 p-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <CardTitle>Net Worth History</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track balance trajectories across assets and debt
                </p>
              </div>
              <Link href="/net-worth">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                  Full Analytics →
                </Button>
              </Link>
            </div>
            {netWorth && (
              <NetWorthChart
                data={netWorth.timeSeries}
                activeTimeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            )}
          </Card>

          {/* Monthly Cash Flow Bar Overview - 1 Column */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2">
                <div>
                  <CardTitle>Monthly Cash Flow</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Income vs. Expenses
                  </p>
                </div>
                <Link href="/cash-flow">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                    Sankey Flow →
                  </Button>
                </Link>
              </div>
              {cashFlow && (
                <CashFlowChart
                  income={cashFlow.totalIncome}
                  expenses={cashFlow.totalExpenses}
                  savings={cashFlow.netSavings}
                />
              )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800/60 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Income Inflow:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {cashFlow ? formatCurrency(cashFlow.totalIncome) : "$0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Outflow:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {cashFlow ? formatCurrency(cashFlow.totalExpenses) : "$0"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Split: Recent Transactions & Upcoming Bills */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Transactions - 2 Columns */}
          <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800/80 p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest synced bank transactions
                </p>
              </div>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                  View All Transactions →
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs">
                      {(tx.merchantName || tx.cleanName || tx.originalName || "T")[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {tx.cleanName || tx.merchantName || tx.originalName}
                        </span>
                        {tx.isSplit && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                            Split
                          </span>
                        )}
                        {tx.pending && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(tx.date, "short")}</span>
                        <span>•</span>
                        <span>{tx.category?.name || "Uncategorized"}</span>
                        <span>•</span>
                        <span>{tx.account?.name || "Account"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold ${
                        tx.amount < 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {tx.amount < 0
                        ? formatCurrency(Math.abs(tx.amount), { showSign: true })
                        : formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Bills Widget - 1 Column */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>Upcoming Bills</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recurring subscriptions & utilities
                  </p>
                </div>
                <Link href="/recurring">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                    Manage →
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recurring.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.merchantName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Due {formatDate(item.nextDate, "short")} ({item.frequency.toLowerCase()})
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.expectedAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <PlaidLinkButton onSuccess={fetchData} className="w-full" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
