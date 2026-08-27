"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CashFlowChartProps {
  income: number;
  expenses: number;
  savings: number;
}

export function CashFlowChart({ income, expenses, savings }: CashFlowChartProps) {
  const data = [
    {
      name: "Current Month",
      Income: income,
      Expenses: expenses,
      Savings: Math.max(0, savings),
    },
  ];

  return (
    <div className="h-64 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} opacity={0.6} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            fontSize={12}
            opacity={0.6}
            width={50}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
            contentStyle={{
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(val) => <span className="text-xs text-slate-600 dark:text-slate-400">{val}</span>}
          />
          <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
          <Bar dataKey="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={45} />
          <Bar dataKey="Savings" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={45} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
