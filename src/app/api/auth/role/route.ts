import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";
import { Role } from "@/types";

export async function GET() {
  const profile = store.getUserProfile();
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = body.role as Role;
    if (role !== "ADMIN" && role !== "GUEST") {
      return NextResponse.json({ error: "Invalid role. Must be ADMIN or GUEST." }, { status: 400 });
    }
    store.setRole(role);
    return NextResponse.json({ profile: store.getUserProfile() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
