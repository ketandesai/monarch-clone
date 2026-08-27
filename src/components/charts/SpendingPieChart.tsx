"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SpendingPieChartProps {
  data: { name: string; amount: number; color?: string }[];
}

const DEFAULT_COLORS = [
  "#6366F1",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F97316",
  "#3B82F6",
];

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  const chartData = data.filter((d) => d.amount > 0);

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        No expense data for this period.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="amount"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value) || 0), "Spent"]}
            contentStyle={{
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(val) => <span className="text-xs text-slate-600 dark:text-slate-400">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
