import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { store } from "@/lib/data-store";
import { AccountDto } from "@/types";

export async function POST(req: Request) {
  try {
    store.checkWriteAccess();
    const body = await req.json();
    const { public_token, institution_name, institution_id } = body;

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;

    if (!clientId || clientId === "mock_plaid_client_id" || !secret || secret === "mock_plaid_sandbox_secret") {
      // Create new connected demo account
      const instName = institution_name || "Capital One Bank";
      const newAccount = store.addAccount({
        userId: "user-admin",
        institutionName: instName,
        name: `${instName} 360 Checking`,
        officialName: `${instName} Performance Checking`,
        mask: String(Math.floor(1000 + Math.random() * 9000)),
        type: "DEPOSITORY",
        subtype: "checking",
        currentBalance: 5240.00,
        availableBalance: 5240.00,
        isoCurrencyCode: "USD",
        isHidden: false,
      });

      // Add a couple sample synced transactions
      store.addTransaction({
        userId: "user-admin",
        accountId: newAccount.id,
        categoryId: "cat-groceries",
        date: new Date().toISOString().split("T")[0],
        amount: 68.45,
        originalName: "TRADER JOE'S #541 SAN FRANCISCO CA",
        cleanName: "Trader Joe's",
        merchantName: "Trader Joe's",
        pending: false,
        tags: ["synced", "groceries"],
        isExcludedFromBudget: false,
        isSplit: false,
      });

      return NextResponse.json({
        success: true,
        isDemo: true,
        account: newAccount,
      });
    }

    // Exchange public token with live Plaid API
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Fetch accounts for the linked item
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const createdAccounts: AccountDto[] = [];
    for (const acc of accountsResponse.data.accounts) {
      let mappedType: AccountDto["type"] = "DEPOSITORY";
      if (acc.type === "credit") mappedType = "CREDIT";
      if (acc.type === "loan") mappedType = "LOAN";
      if (acc.type === "investment") mappedType = "INVESTMENT";

      const created = store.addAccount({
        userId: "user-admin",
        plaidItemId: itemId,
        plaidAccountId: acc.account_id,
        institutionName: institution_name || "Linked Institution",
        name: acc.name,
        officialName: acc.official_name,
        mask: acc.mask,
        type: mappedType,
        subtype: acc.subtype,
        currentBalance: acc.balances.current || 0,
        availableBalance: acc.balances.available,
        isoCurrencyCode: acc.balances.iso_currency_code || "USD",
        isHidden: false,
      });
      createdAccounts.push(created);
    }

    return NextResponse.json({
      success: true,
      item_id: itemId,
      accounts: createdAccounts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to exchange Plaid token";
    const status = message.includes("Permission Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
