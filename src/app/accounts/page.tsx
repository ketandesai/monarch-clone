"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlaidLinkButton } from "@/components/accounts/PlaidLinkButton";
import { AccountDto, Role } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  CreditCard,
  Building,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [role, setRole] = useState<Role>("ADMIN");
  const [loading, setLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState<AccountDto["type"]>("DEPOSITORY");
  const [manualBalance, setManualBalance] = useState("");

  const fetchAccounts = async () => {
    try {
      const [accRes, roleRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/auth/role"),
      ]);
      const accData = await accRes.json();
      const roleData = await roleRes.json();
      if (accData.accounts) setAccounts(accData.accounts);
      if (roleData.profile?.role) setRole(roleData.profile.role);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateManual = async () => {
    if (!manualName.trim() || !manualBalance) return;
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-admin",
          institutionName: "Manual Asset",
          name: manualName.trim(),
          type: manualType,
          currentBalance: parseFloat(manualBalance) || 0,
          isoCurrencyCode: "USD",
          isHidden: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create account");
      } else {
        setIsManualModalOpen(false);
        setManualName("");
        setManualBalance("");
        fetchAccounts();
      }
    } catch {
      alert("Failed to create account");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to delete accounts.");
      return;
    }
    if (!confirm("Are you sure you want to disconnect and delete this account?")) return;

    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAccounts();
      }
    } catch {
      alert("Failed to delete account");
    }
  };

  const cashAccounts = accounts.filter((a) => a.type === "DEPOSITORY");
  const investmentAccounts = accounts.filter((a) => a.type === "INVESTMENT");
  const creditAccounts = accounts.filter((a) => a.type === "CREDIT");
  const loanAccounts = accounts.filter((a) => a.type === "LOAN");

  const totalCash = cashAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalInvestments = investmentAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalCredit = creditAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
  const totalLoans = loanAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);

  const totalAssets = totalCash + totalInvestments;
  const totalLiabilities = totalCredit + totalLoans;
  const netWorth = totalAssets - totalLiabilities;

  const renderAccountGroup = (
    title: string,
    icon: React.ReactNode,
    groupAccounts: AccountDto[],
    total: number,
    isLiability: boolean = false
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {icon}
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
              {groupAccounts.length}
            </span>
          </div>
          <span
            className={`text-base font-bold ${
              isLiability
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {formatCurrency(total)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupAccounts.map((acc) => (
            <Card
              key={acc.id}
              className="card-hover border-slate-200/80 p-4.5 dark:border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {acc.institutionName || "Bank"}
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {acc.name}
                    </div>
                  </div>
                  {acc.mask && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      •••• {acc.mask}
                    </span>
                  )}
                </div>

                {acc.officialName && (
                  <p className="mt-1 text-xs text-slate-400 truncate">
                    {acc.officialName}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Current Balance</div>
                  <div
                    className={`text-lg font-bold ${
                      isLiability
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>

                {role === "ADMIN" ? (
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Disconnect account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span title="Read-only in Guest mode">
                    <Lock className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Accounts & Balances"
        subtitle="Manage connected institutions and manual assets"
      />

      <main className="flex-1 space-y-8 p-8">
        {/* Top Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-lg">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Total Net Worth
            </span>
            <div className="text-3xl font-extrabold tracking-tight">
              {formatCurrency(netWorth)}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-blue-100">
              <span>Assets: <strong>{formatCurrency(totalAssets)}</strong></span>
              <span>•</span>
              <span>Debt: <strong>{formatCurrency(totalLiabilities)}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PlaidLinkButton onSuccess={fetchAccounts} variant="default" size="default" />
            {role === "ADMIN" && (
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setIsManualModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Manual Account
              </Button>
            )}
          </div>
        </div>

        {/* Account Groups */}
        <div className="space-y-8">
          {renderAccountGroup("Cash & Depository", <Landmark className="h-4 w-4" />, cashAccounts, totalCash)}
          {renderAccountGroup("Investments & Retirement", <TrendingUp className="h-4 w-4" />, investmentAccounts, totalInvestments)}
          {renderAccountGroup("Credit Cards", <CreditCard className="h-4 w-4" />, creditAccounts, totalCredit, true)}
          {renderAccountGroup("Loans & Mortgages", <Building className="h-4 w-4" />, loanAccounts, totalLoans, true)}
        </div>

        {/* Manual Account Modal */}
        <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Manual Asset or Liability</DialogTitle>
              <DialogDescription>
                Track accounts not connected via Plaid, such as real estate, collectibles, or private loans.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Name
                </label>
                <Input
                  placeholder="e.g. Primary Residence, Vintage Car, Emergency Cash"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as AccountDto["type"])}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="DEPOSITORY">Cash & Depository (Asset)</option>
                  <option value="INVESTMENT">Investment / Crypto (Asset)</option>
                  <option value="OTHER">Property / Physical Asset (Asset)</option>
                  <option value="CREDIT">Credit Card (Liability)</option>
                  <option value="LOAN">Loan / Mortgage (Liability)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Balance ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualBalance}
                  onChange={(e) => setManualBalance(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsManualModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="monarch" onClick={handleCreateManual}>
                Add Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
