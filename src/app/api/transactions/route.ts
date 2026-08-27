import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const tag = searchParams.get("tag");

    let txs = store.getTransactions();

    if (search) {
      txs = txs.filter(
        (t) =>
          t.merchantName?.toLowerCase().includes(search) ||
          t.cleanName?.toLowerCase().includes(search) ||
          t.originalName.toLowerCase().includes(search) ||
          t.notes?.toLowerCase().includes(search) ||
          t.tags.some((tg) => tg.toLowerCase().includes(search))
      );
    }

    if (accountId) {
      txs = txs.filter((t) => t.accountId === accountId);
    }

    if (categoryId) {
      txs = txs.filter((t) => t.categoryId === categoryId);
    }

    if (tag) {
      txs = txs.filter((t) => t.tags.includes(tag));
    }

    return NextResponse.json({ transactions: txs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transaction = store.addTransaction(body);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create transaction";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    const transaction = store.updateTransaction(id, updates);
    return NextResponse.json({ transaction });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update transaction";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    store.deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete transaction";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
