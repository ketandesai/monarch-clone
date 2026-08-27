"use client";

import React, { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "outline" | "monarch";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function PlaidLinkButton({
  onSuccess,
  variant = "monarch",
  size = "sm",
  className,
}: PlaidLinkButtonProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedDemoBank, setSelectedDemoBank] = useState("Chase");
  const [connectingDemo, setConnectingDemo] = useState(false);

  useEffect(() => {
    // Pre-fetch link token
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.link_token) {
          setToken(data.link_token);
        }
      })
      .catch(() => {});
  }, []);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (public_token, metadata) => {
      setLoading(true);
      try {
        await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name,
            institution_id: metadata.institution?.institution_id,
          }),
        });
        if (onSuccess) onSuccess();
      } catch {
        alert("Failed to link bank account.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClick = () => {
    if (token && token.startsWith("demo-link-token")) {
      // Open demo bank picker modal
      setIsDemoModalOpen(true);
    } else if (ready) {
      open();
    } else {
      setIsDemoModalOpen(true);
    }
  };

  const handleConnectDemo = async () => {
    setConnectingDemo(true);
    try {
      const res = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token: `demo-public-${Date.now()}`,
          institution_name: selectedDemoBank,
          institution_id: `ins_${selectedDemoBank.toLowerCase().replace(/\s+/g, "_")}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to link bank account");
      } else {
        setIsDemoModalOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch {
      alert("Failed to link account");
    } finally {
      setConnectingDemo(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Building2 className="h-4 w-4" />
        )}
        <span>Connect Bank Account</span>
      </Button>

      {/* Demo / Sandbox Bank Connect Modal */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Link Financial Institution
            </DialogTitle>
            <DialogDescription>
              Connect a live institution with Plaid, or select a sandbox institution below to test balance syncing and transaction ingestion.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2.5 py-4">
            {[
              { name: "Chase", desc: "Checking & Sapphire Card" },
              { name: "Bank of America", desc: "Advantage Banking & Rewards" },
              { name: "Wells Fargo", desc: "Active Cash & Mortgage" },
              { name: "Capital One", desc: "Venture X & 360 Savings" },
              { name: "Vanguard", desc: "Brokerage & Index Funds" },
              { name: "Fidelity", desc: "Retirement 401(k) & IRA" },
            ].map((bank) => (
              <button
                key={bank.name}
                type="button"
                onClick={() => setSelectedDemoBank(bank.name)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  selectedDemoBank === bank.name
                    ? "border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40 font-medium"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60"
                }`}
              >
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {bank.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {bank.desc}
                </span>
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDemoModalOpen(false)}
              disabled={connectingDemo}
            >
              Cancel
            </Button>
            <Button
              variant="monarch"
              onClick={handleConnectDemo}
              disabled={connectingDemo}
            >
              {connectingDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                `Link ${selectedDemoBank} Account`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
