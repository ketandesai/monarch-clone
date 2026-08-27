import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidEnv = process.env.PLAID_ENV || "sandbox";

const configuration = new Configuration({
  basePath:
    plaidEnv === "production"
      ? PlaidEnvironments.production
      : plaidEnv === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
