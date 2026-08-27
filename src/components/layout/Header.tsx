"use client";

import React, { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { RoleBadge } from "./RoleBadge";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Building2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [role, setRole] = useState<Role>("ADMIN");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/role")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.role) setRole(data.profile.role);
      })
      .catch(() => {});
  }, []);

  const handleToggleRole = async () => {
    const nextRole: Role = role === "ADMIN" ? "GUEST" : "ADMIN";
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (data.profile?.role) {
        setRole(data.profile.role);
        router.refresh();
      }
    } catch {
      // Fallback local toggle
      setRole(nextRole);
    }
  };

  const handleSync = async () => {
    if (role === "GUEST") {
      alert("Guest mode is read-only. Switch to Admin mode to trigger bank sync.");
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage("Sync complete!");
        router.refresh();
      } else {
        setSyncMessage(data.error || "Sync failed");
      }
    } catch {
      setSyncMessage("Sync failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title || "Overview"}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {syncMessage && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            {syncMessage}
          </span>
        )}

        {/* Sync Now Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-9 gap-1.5 text-xs font-medium"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
              isSyncing ? "animate-spin text-blue-600" : ""
            }`}
          />
          <span>{isSyncing ? "Syncing..." : "Sync Banks"}</span>
        </Button>

        {/* Role Badge & Switcher */}
        <RoleBadge role={role} onToggleRole={handleToggleRole} />

        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
