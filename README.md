# Monarch Money Clone

A full-stack personal finance and budgeting suite inspired by Monarch Money.

---

## Features
- **Dashboard**: Real-time Net Worth, Monthly Savings Rate, Assets vs Debt breakdown, and recent transactions.
- **Accounts**: Cash, Investments (401k/Brokerage), Credit Cards, and Loans/Mortgages aggregation.
- **Plaid Bank Sync**: Plaid Link modal flow with support for both live bank connections and interactive sandbox simulation.
- **Transactions & Rules**: Filterable data table, multi-category **Split Transactions**, and automated **Rules Engine** (merchant renaming, category assignment, tags).
- **Flexible Budgeting**: Category group rollups (Income, Fixed, Variable, Non-Monthly), spending burn rates, and **Monthly Rollover carryforward**.
- **Cash Flow & Sankey**: Interactive D3-Sankey diagram visualizing income flows into expenses and savings.
- **Net Worth Tracking**: Interactive multi-timeframe chart (`1M`, `3M`, `6M`, `YTD`, `1Y`, `ALL`) with Line and Stacked Asset/Debt modes.
- **Role-Based Access**:
  - **Admin User**: Full read and write access.
  - **Guest User**: Read-only viewer with server-side 403 enforcement.

---

## Running with Docker & Docker Compose

### 1. Start Application and PostgreSQL
```bash
docker compose up --build
```

### 2. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Stop Containers
```bash
docker compose down
```

---

## Running Locally (Without Docker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
