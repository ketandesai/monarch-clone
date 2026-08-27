import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET() {
  try {
    const recurring = store.getRecurring();
    return NextResponse.json({ recurring });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch recurring items";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = store.addRecurring(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create recurring item";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
