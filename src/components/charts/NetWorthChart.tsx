"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { NetWorthPoint } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Layers, TrendingUp } from "lucide-react";

interface NetWorthChartProps {
  data: NetWorthPoint[];
  activeTimeframe: "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
  onTimeframeChange: (tf: "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL") => void;
}

export function NetWorthChart({
  data,
  activeTimeframe,
  onTimeframeChange,
}: NetWorthChartProps) {
  const [chartMode, setChartMode] = useState<"line" | "stacked">("line");

  const formattedData = data.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date, "short"),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Timeframe selector */}
        <div className="flex items-center space-x-1">
          {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as const).map((tf) => (
            <Button
              key={tf}
              variant={activeTimeframe === tf ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          <Button
            variant={chartMode === "line" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setChartMode("line")}
          >
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            Net Worth
          </Button>
          <Button
            variant={chartMode === "stacked" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setChartMode("stacked")}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            Assets vs. Debt
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "line" ? (
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                opacity={0.6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                fontSize={12}
                opacity={0.6}
                width={55}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as NetWorthPoint & { formattedDate: string };
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatDate(point.date, "long")}
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
                          {formatCurrency(point.netWorth)}
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                            <span>Total Assets:</span>
                            <span className="font-medium">{formatCurrency(point.assets)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                            <span>Total Debt:</span>
                            <span className="font-medium">{formatCurrency(point.liabilities)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                opacity={0.6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                fontSize={12}
                opacity={0.6}
                width={55}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as NetWorthPoint & { formattedDate: string };
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatDate(point.date, "long")}
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                            <span>Assets:</span>
                            <span className="font-semibold">{formatCurrency(point.assets)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                            <span>Liabilities:</span>
                            <span className="font-semibold">{formatCurrency(point.liabilities)}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-1.5 dark:border-slate-800 flex items-center justify-between gap-4 text-blue-600 dark:text-blue-400 font-bold">
                            <span>Net Worth:</span>
                            <span>{formatCurrency(point.netWorth)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="assets"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#assetsGrad)"
              />
              <Area
                type="monotone"
                dataKey="liabilities"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#debtGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
