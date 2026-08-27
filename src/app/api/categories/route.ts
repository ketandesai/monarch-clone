import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET() {
  try {
    const groups = store.getCategoryGroups();
    const categories = store.getCategories();
    return NextResponse.json({ groups, categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const category = store.addCategory(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create category";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
