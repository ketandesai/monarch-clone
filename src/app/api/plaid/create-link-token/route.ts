import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export async function POST() {
  try {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;

    if (!clientId || clientId === "mock_plaid_client_id" || !secret || secret === "mock_plaid_sandbox_secret") {
      // Return a demo sandbox link token
      return NextResponse.json({
        link_token: `demo-link-token-${Date.now()}`,
        expiration: new Date(Date.now() + 3600000).toISOString(),
        isDemoMode: true,
      });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: "user-admin" },
      client_name: "Monarch Clone",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create link token";
    return NextResponse.json(
      {
        link_token: `demo-link-token-${Date.now()}`,
        expiration: new Date(Date.now() + 3600000).toISOString(),
        isDemoMode: true,
        notice: message,
      },
      { status: 200 }
    );
  }
}
