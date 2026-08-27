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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecurringItemDto, CategoryDto, Role } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CalendarDays,
  Plus,
  Tv,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<RecurringItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [role, setRole] = useState<Role>("ADMIN");
  const [loading, setLoading] = useState(true);

  // New Subscription Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringItemDto["frequency"]>("MONTHLY");
  const [categoryId, setCategoryId] = useState("");
  const [nextDate, setNextDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [recRes, catRes, roleRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/categories"),
        fetch("/api/auth/role"),
      ]);
      const [recData, catData, roleData] = await Promise.all([
        recRes.json(),
        catRes.json(),
        roleRes.json(),
      ]);

      if (recData.recurring) setRecurring(recData.recurring);
      if (catData.categories) {
        setCategories(catData.categories);
        if (!categoryId && catData.categories.length) setCategoryId(catData.categories[0].id);
      }
      if (roleData.profile?.role) setRole(roleData.profile.role);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalMonthlyCommitment = recurring.reduce((sum, item) => {
    let monthlyVal = item.expectedAmount;
    if (item.frequency === "ANNUALLY") monthlyVal = item.expectedAmount / 12;
    if (item.frequency === "WEEKLY") monthlyVal = (item.expectedAmount * 52) / 12;
    if (item.frequency === "BIWEEKLY") monthlyVal = (item.expectedAmount * 26) / 12;
    return sum + monthlyVal;
  }, 0);

  const handleCreateRecurring = async () => {
    if (!merchantName.trim() || !expectedAmount) return;
    setCreating(true);

    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-admin",
          merchantName: merchantName.trim(),
          expectedAmount: parseFloat(expectedAmount) || 0,
          frequency,
          categoryId: categoryId || null,
          nextDate,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add subscription");
      } else {
        setIsModalOpen(false);
        setMerchantName("");
        setExpectedAmount("");
        fetchData();
      }
    } catch {
      alert("Failed to add subscription");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Recurring Bills & Subscriptions"
        subtitle="Track subscription renewals, utility bills, and fixed recurring commitments"
      />

      <main className="flex-1 space-y-6 p-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Recurring Commitment
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(totalMonthlyCommitment)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Normalized monthly fixed outflow
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Subscriptions & Bills
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {recurring.length}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Auto-renewing recurring items
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Annual Fixed Cost
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {formatCurrency(totalMonthlyCommitment * 12)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Projected annual run-rate
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Schedule & Renewals
              </span>
            </div>

            {role === "ADMIN" ? (
              <Button
                variant="monarch"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Recurring Item
              </Button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Read-only
              </span>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant / Subscription</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead className="text-right">Expected Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.merchantName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {item.category?.name || "Fixed Expense"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.frequency.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {formatDate(item.nextDate, "medium")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.expectedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Add Recurring Item Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Recurring Bill or Subscription</DialogTitle>
              <DialogDescription>
                Set up automated tracking for subscriptions, rent, utilities, and memberships.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Merchant / Service Name
                </label>
                <Input
                  placeholder="e.g. Disney+, Gym, Internet, Electric"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Expected Amount ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Billing Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as RecurringItemDto["frequency"])
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Next Due Date
                  </label>
                  <Input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="monarch"
                onClick={handleCreateRecurring}
                disabled={creating}
              >
                {creating ? "Adding..." : "Add Subscription"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
