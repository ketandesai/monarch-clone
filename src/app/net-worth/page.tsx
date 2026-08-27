"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { NetWorthSummary } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShieldAlert,
  PieChart,
} from "lucide-react";

export default function NetWorthPage() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL">("1Y");
  const [loading, setLoading] = useState(true);

  const fetchNetWorth = async () => {
    try {
      const res = await fetch(`/api/net-worth?timeframe=${timeframe}`);
      const data = await res.json();
      if (data.summary) setNetWorth(data.summary);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetWorth();
  }, [timeframe]);

  const renderBreakdownSection = (
    title: string,
    accounts: { name: string; currentBalance: number; mask?: string | null; institutionName?: string }[],
    total: number,
    isLiability: boolean = false
  ) => {
    return (
      <Card className="border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {title}
          </span>
          <span
            className={`text-sm font-bold ${
              isLiability
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {formatCurrency(total)}
          </span>
        </div>

        <div className="space-y-2">
          {accounts.map((acc, idx) => {
            const percentOfAssets =
              netWorth && netWorth.totalAssets > 0
                ? (Math.abs(acc.currentBalance) / netWorth.totalAssets) * 100
                : 0;

            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {acc.name}
                  </span>
                  {acc.mask && (
                    <span className="text-slate-400 text-[11px] ml-1">
                      (••• {acc.mask})
                    </span>
                  )}
                  {acc.institutionName && (
                    <div className="text-[10px] text-slate-400">
                      {acc.institutionName}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      isLiability
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {formatCurrency(acc.currentBalance)}
                  </div>
                  {!isLiability && (
                    <div className="text-[10px] text-slate-400">
                      {percentOfAssets.toFixed(1)}% of assets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Net Worth Tracking"
        subtitle="Comprehensive asset & liability trajectory across all synced institutions"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Net Worth
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
                <span className="text-slate-400">in selected timeframe</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Assets
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {netWorth ? formatCurrency(netWorth.totalAssets) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Cash + Brokerage + 401(k)
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                Revolving Credit + Loans
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Debt-to-Asset Ratio
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <PieChart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {netWorth && netWorth.totalAssets > 0
                  ? ((netWorth.totalLiabilities / netWorth.totalAssets) * 100).toFixed(1) + "%"
                  : "0%"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Leverage proportion
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interactive Chart */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 p-6">
          <CardTitle className="pb-2">Historical Net Worth Trajectory</CardTitle>
          {netWorth && (
            <NetWorthChart
              data={netWorth.timeSeries}
              activeTimeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}
        </Card>

        {/* Asset & Liability Breakdown Sections */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Portfolio Composition
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {netWorth && (
              <>
                {renderBreakdownSection(
                  "Cash & Savings",
                  netWorth.accountsByType.cash,
                  netWorth.accountsByType.cash.reduce((s, a) => s + a.currentBalance, 0)
                )}
                {renderBreakdownSection(
                  "Investments & 401(k)",
                  netWorth.accountsByType.investments,
                  netWorth.accountsByType.investments.reduce((s, a) => s + a.currentBalance, 0)
                )}
                {renderBreakdownSection(
                  "Credit Cards",
                  netWorth.accountsByType.creditCards,
                  netWorth.accountsByType.creditCards.reduce((s, a) => s + Math.abs(a.currentBalance), 0),
                  true
                )}
                {renderBreakdownSection(
                  "Loans & Mortgages",
                  netWorth.accountsByType.loans,
                  netWorth.accountsByType.loans.reduce((s, a) => s + Math.abs(a.currentBalance), 0),
                  true
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
