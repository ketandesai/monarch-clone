import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function POST() {
  try {
    store.checkWriteAccess();

    // Trigger balance refresh and simulated sync transaction
    const accounts = store.getAccounts();
    if (accounts.length > 0) {
      // Simulate adding a newly synced coffee transaction to test live sync feedback
      store.addTransaction({
        userId: "user-admin",
        accountId: accounts[0].id,
        categoryId: "cat-coffee",
        date: new Date().toISOString().split("T")[0],
        amount: 5.25,
        originalName: "PHILZ COFFEE BERRY ST SAN FRANCISCO CA",
        cleanName: "Philz Coffee",
        merchantName: "Philz Coffee",
        pending: true,
        tags: ["synced", "pending"],
        isExcludedFromBudget: false,
        isSplit: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Synced with linked institutions successfully.",
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
