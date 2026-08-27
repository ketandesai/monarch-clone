import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET() {
  try {
    const rules = store.getRules();
    return NextResponse.json({ rules });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch rules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rule = store.addRule(body);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create rule";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    store.deleteRule(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete rule";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
