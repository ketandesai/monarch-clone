"use client";

import React, { useState } from "react";
import { TransactionDto, CategoryDto } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Split } from "lucide-react";

interface SplitTransactionModalProps {
  transaction: TransactionDto | null;
  categories: CategoryDto[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SplitTransactionModal({
  transaction,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: SplitTransactionModalProps) {
  const totalAmount = transaction ? Math.abs(transaction.amount) : 0;

  const [splits, setSplits] = useState<
    { categoryId: string; amount: number; notes: string }[]
  >([
    { categoryId: categories[0]?.id || "", amount: totalAmount / 2, notes: "" },
    { categoryId: categories[1]?.id || "", amount: totalAmount / 2, notes: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTotal = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const diff = totalAmount - currentTotal;
  const isBalanced = Math.abs(diff) < 0.01;

  const handleAddLine = () => {
    setSplits([
      ...splits,
      { categoryId: categories[0]?.id || "", amount: Math.max(0, diff), notes: "" },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!transaction || !isBalanced) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          splits: splits.map((s) => ({
            categoryId: s.categoryId,
            amount: Number(s.amount),
            notes: s.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to split transaction");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Network error while splitting transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-blue-600" />
            Split Transaction
          </DialogTitle>
          <DialogDescription>
            Allocate <strong>{transaction.cleanName || transaction.originalName}</strong> ({formatCurrency(totalAmount)}) across multiple categories.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Split Lines */}
        <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto pr-1">
          {splits.map((split, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-500">Category</label>
                <select
                  value={split.categoryId}
                  onChange={(e) => {
                    const updated = [...splits];
                    updated[idx].categoryId = e.target.value;
                    setSplits(updated);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <label className="text-[11px] font-medium text-slate-500">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={split.amount}
                  onChange={(e) => {
                    const updated = [...splits];
                    updated[idx].amount = parseFloat(e.target.value) || 0;
                    setSplits(updated);
                  }}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-500">Note</label>
                <Input
                  type="text"
                  placeholder="Optional note"
                  value={split.notes}
                  onChange={(e) => {
                    const updated = [...splits];
                    updated[idx].notes = e.target.value;
                    setSplits(updated);
                  }}
                  className="h-8 text-xs"
                />
              </div>

              {splits.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  className="mt-4 p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLine}
          className="h-8 gap-1.5 text-xs w-full"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Another Split Line
        </Button>

        {/* Balance Status Indicator */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900/60">
          <div>
            <span className="text-slate-500">Allocated: </span>
            <span className="font-semibold">{formatCurrency(currentTotal)}</span>
            <span className="text-slate-400"> of {formatCurrency(totalAmount)}</span>
          </div>
          <div
            className={`font-semibold ${
              isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isBalanced ? "✓ Balanced" : `Remaining: ${formatCurrency(diff)}`}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!isBalanced || loading}
          >
            {loading ? "Saving Split..." : "Apply Split"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
