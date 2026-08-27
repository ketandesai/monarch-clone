"use client";

import React, { useState } from "react";
import { CategoryDto, RuleCondition, RuleAction } from "@/types";
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
import { Sparkles, SlidersHorizontal } from "lucide-react";

interface RuleEditorModalProps {
  categories: CategoryDto[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMerchant?: string;
}

export function RuleEditorModal({
  categories,
  isOpen,
  onClose,
  onSuccess,
  defaultMerchant = "",
}: RuleEditorModalProps) {
  const [ruleName, setRuleName] = useState(
    defaultMerchant ? `Auto-categorize ${defaultMerchant}` : "New Automation Rule"
  );
  const [merchantKeyword, setMerchantKeyword] = useState(defaultMerchant);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [cleanName, setCleanName] = useState(defaultMerchant);
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!merchantKeyword.trim()) {
      setError("Please enter a merchant keyword or pattern to match.");
      return;
    }

    setLoading(true);
    setError(null);

    const conditions: RuleCondition[] = [
      {
        field: "merchant",
        operator: "contains",
        value: merchantKeyword.trim(),
      },
    ];

    const actions: RuleAction[] = [];
    if (selectedCategoryId) {
      actions.push({ type: "set_category", value: selectedCategoryId });
    }
    if (cleanName.trim()) {
      actions.push({ type: "rename_merchant", value: cleanName.trim() });
    }
    if (tag.trim()) {
      actions.push({ type: "add_tag", value: tag.trim() });
    }

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-admin",
          name: ruleName,
          priority: 10,
          conditions,
          actions,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create rule");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Network error while creating rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
            Create Transaction Rule
          </DialogTitle>
          <DialogDescription>
            Automatically categorize, rename, and tag future transactions matching your condition.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="space-y-3.5 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rule Name
            </label>
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              IF (Condition)
            </span>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Merchant name contains:
              </label>
              <Input
                placeholder="e.g. Starbucks, Uber, Netflix"
                value={merchantKeyword}
                onChange={(e) => setMerchantKeyword(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              THEN (Actions)
            </span>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Assign Category:
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Clean Display Name:
              </label>
              <Input
                placeholder="e.g. Starbucks"
                value={cleanName}
                onChange={(e) => setCleanName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                Apply Tag (optional):
              </label>
              <Input
                placeholder="e.g. subscription, dining, recurring"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="monarch" onClick={handleSave} disabled={loading}>
            {loading ? "Creating Rule..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
