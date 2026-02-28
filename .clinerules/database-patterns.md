# Database Patterns

Critical database conventions for the In The Black application.

## Core Principles

- **Primary keys**: UUID for all user-modifiable data
- **Timestamps**: All tables have `created_at` and `updated_at`
- **Soft deletes**: Use `deleted_at` field where appropriate
- **Monetary values**: DECIMAL type for precision (not MONEY)
- **Foreign keys**: Enforced for data integrity
- **Column naming**: snake_case (`user_id`, `created_at`, `transaction_date`)

## Double-Entry Accounting

**CRITICAL**: All transactions must balance to zero.

The application uses a split model:
- `transactions` table: Parent record with date, payee, status
- `transaction_splits` table: Individual debit/credit entries
- **Sum of all splits for a transaction must equal zero**

Example:
```sql
-- Purchase at store (£50)
-- Split 1: Debit to Groceries expense account (+£50)
-- Split 2: Credit from Bank account (-£50)
-- Total: £50 + (-£50) = £0 ✓
```

## Database Structure

### User Ownership
- All user data links back to `users` table
- `users.kratos_id` connects to Ory Kratos identity system
- Use `user_id` foreign key in all user-owned tables

### Account Types
Fundamental bookkeeping types (lookup table):
- Asset
- Liability
- Income
- Expense
- Equity

### Key Tables
- `accounts`: User's bank accounts, credit cards, cash
- `budgets`: Top-level financial plans
- `pots`: Hierarchical budget categories (self-referencing `parent_id`)
- `transactions`: Parent records for financial events
- `transaction_splits`: Individual debits/credits (must balance)
- `currencies`: ISO 4217 codes with formatting rules
- `payees`: Other parties in transactions
- `labels`: Flexible key:value tagging system

## Common Patterns

### Timestamps
```sql
created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
deleted_at TIMESTAMP NULL  -- for soft deletes
```

### Monetary Values
```sql
balance DECIMAL NOT NULL DEFAULT 0
amount DECIMAL NOT NULL
```

### Foreign Keys
```sql
user_id UUID NOT NULL REFERENCES users(id)
account_id UUID NOT NULL REFERENCES accounts(id)
```

### Hierarchical Structure (Pots)
```sql
parent_id UUID NULL REFERENCES pots(id)
-- NULL = top-level
-- UUID = nested under parent
```

## Migrations

- Use Knex.js for migrations
- Located in `packages/db/migrations/`
- Run with: `pnpm --filter @in-the-black/db db:migrate`
- Seeds in `packages/db/seeds/`

## Reference

See `packages/db/DB_DESIGN.md` for complete schema documentation.
See `packages/db/knexfile.ts` for database configuration.