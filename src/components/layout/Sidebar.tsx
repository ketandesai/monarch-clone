"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  CalendarDays,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Cash Flow", href: "/cash-flow", icon: TrendingUp },
  { label: "Budget", href: "/budget", icon: PieChart },
  { label: "Net Worth", href: "/net-worth", icon: Sparkles },
  { label: "Recurring", href: "/recurring", icon: CalendarDays },
  { label: "Rules & Settings", href: "/settings", icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-6 dark:border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Monarch Money
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Financial Suite
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Summary Footer */}
      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Sync Status</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Plaid Live & Sandbox Ready
        </p>
      </div>
    </aside>
  );
}
