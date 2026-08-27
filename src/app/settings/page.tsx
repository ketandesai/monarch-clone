"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RuleEditorModal } from "@/components/transactions/RuleEditorModal";
import {
  RuleDto,
  CategoryDto,
  CategoryGroupDto,
  Role,
} from "@/types";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2,
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

export default function SettingsPage() {
  const [rules, setRules] = useState<RuleDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [groups, setGroups] = useState<CategoryGroupDto[]>([]);
  const [role, setRole] = useState<Role>("ADMIN");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatGroupId, setNewCatGroupId] = useState("");
  const [newCatRollover, setNewCatRollover] = useState(true);

  const fetchData = async () => {
    try {
      const [rulesRes, catRes, roleRes] = await Promise.all([
        fetch("/api/rules"),
        fetch("/api/categories"),
        fetch("/api/auth/role"),
      ]);

      const [rulesData, catData, roleData] = await Promise.all([
        rulesRes.json(),
        catRes.json(),
        roleRes.json(),
      ]);

      if (rulesData.rules) setRules(rulesData.rules);
      if (catData.categories) setCategories(catData.categories);
      if (catData.groups) {
        setGroups(catData.groups);
        if (!newCatGroupId && catData.groups.length) setNewCatGroupId(catData.groups[0].id);
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

  const handleRoleChange = async (newRole: Role) => {
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.profile?.role) {
        setRole(data.profile.role);
      }
    } catch {
      setRole(newRole);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to delete rules.");
      return;
    }
    if (!confirm("Are you sure you want to delete this automation rule?")) return;

    try {
      await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      alert("Failed to delete rule");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !newCatGroupId) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: newCatGroupId,
          name: newCatName.trim(),
          isRolloverEnabled: newCatRollover,
          isHidden: false,
          sortOrder: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create category");
      } else {
        setIsCategoryModalOpen(false);
        setNewCatName("");
        fetchData();
      }
    } catch {
      alert("Failed to create category");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Settings & Automation Rules"
        subtitle="Manage user roles, transaction automation rules, and custom categories"
      />

      <main className="flex-1 space-y-8 p-8 max-w-6xl">
        {/* User Role & Permission Switcher Card */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base">User Role & Access Control</CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Switch between Admin (full write access) and Guest (read-only view) to test permissions.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleRoleChange("ADMIN")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  role === "ADMIN"
                    ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-800 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Admin (Read / Write)
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("GUEST")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  role === "GUEST"
                    ? "bg-white text-amber-700 shadow-xs dark:bg-slate-800 dark:text-amber-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Eye className="h-4 w-4 text-amber-600" />
                Guest (Read-Only)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                Admin Role Privileges:
              </span>
              <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>Connect / disconnect Plaid bank accounts</li>
                <li>Create, edit, recategorize, and split transactions</li>
                <li>Update monthly budget targets and rollover balances</li>
                <li>Add, test, and delete transaction automation rules</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Guest Role Constraints:
              </span>
              <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>View-only access to all dashboards, charts, and balances</li>
                <li>Cannot modify transactions or budget allocations</li>
                <li>Cannot connect or disconnect bank accounts</li>
                <li>Write actions are guarded on both client and API routes</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Automation Rules Engine Section */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                Transaction Automation Rules
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Automatically clean merchant names, assign categories, and tag transactions on sync
              </p>
            </div>

            {role === "ADMIN" ? (
              <Button
                variant="monarch"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setIsRuleModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                New Rule
              </Button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Read-only
              </span>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rule.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      Active
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>IF merchant contains:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      &quot;{rule.conditions[0]?.value}&quot;
                    </span>
                    <span>→ THEN:</span>
                    {rule.actions.map((act, idx) => (
                      <Badge key={idx} variant="default" className="text-[10px]">
                        {act.type === "set_category"
                          ? `Set Category`
                          : act.type === "rename_merchant"
                          ? `Rename to "${act.value}"`
                          : `Add Tag "${act.value}"`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {role === "ADMIN" && (
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Custom Categories & Groups */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                Categories & Groups
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Customize category groupings and monthly rollover behaviors
              </p>
            </div>

            {role === "ADMIN" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/30"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {group.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.type}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {categories
                    .filter((c) => c.groupId === group.id)
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {cat.name}
                        </span>
                        {cat.isRolloverEnabled && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            Rollover
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rule Editor Modal */}
        <RuleEditorModal
          categories={categories}
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          onSuccess={fetchData}
        />

        {/* Add Category Dialog */}
        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Category</DialogTitle>
              <DialogDescription>
                Create a new category and assign it to a group.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category Name
                </label>
                <Input
                  placeholder="e.g. Pet Care, Hobbies, Freelance"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category Group
                </label>
                <select
                  value={newCatGroupId}
                  onChange={(e) => setNewCatGroupId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-rollover"
                  checked={newCatRollover}
                  onChange={(e) => setNewCatRollover(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="cat-rollover"
                  className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Enable Monthly Budget Rollover
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="monarch" onClick={handleCreateCategory}>
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
