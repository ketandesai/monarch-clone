import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET() {
  try {
    const accounts = store.getAccounts();
    return NextResponse.json({ accounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const account = store.addAccount(body);
    return NextResponse.json({ account }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create account";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
    const account = store.updateAccount(id, updates);
    return NextResponse.json({ account });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update account";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
    store.deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
