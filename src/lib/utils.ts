import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  options: {
    showSign?: boolean;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const {
    showSign = false,
    currency = "USD",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `-${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatPercent(value: number, decimals: number = 1) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, pattern: "short" | "medium" | "long" = "medium") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (pattern === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (pattern === "long") {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
