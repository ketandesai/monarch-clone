"use client";

import React from "react";
import { Role } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: Role;
  onToggleRole?: () => void;
}

export function RoleBadge({ role, onToggleRole }: RoleBadgeProps) {
  return (
    <button
      onClick={onToggleRole}
      className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium shadow-xs transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 cursor-pointer"
      title="Click to switch role between Admin (Read/Write) and Guest (Read-Only)"
    >
      {role === "ADMIN" ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Admin Mode</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">(Read / Write)</span>
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-amber-700 dark:text-amber-300">Guest Mode</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">(Read-Only)</span>
        </>
      )}
    </button>
  );
}
