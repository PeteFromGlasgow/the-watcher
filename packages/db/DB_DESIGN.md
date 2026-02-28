# In the Black - Database Design

This document outlines the database schema for the "In the Black" application.

## Guiding Principles

- All user-modifiable data will use `UUID` primary keys.
- All tables will have `createdAt` and `updatedAt` timestamps.
- Soft deletes will be implemented using a `deletedAt` field where appropriate.
- Foreign key constraints will be used to maintain data integrity.
- Relationships are defined to link back to a central `Users` table, which in turn links to the Ory Kratos identity system.
- Monetary values are stored using the `DECIMAL` data type for precision and accuracy, which is generally preferred over `MONEY` for financial applications.

---

## Table of Contents

1.  [Users](#1-users)
2.  [Account Types](#2-account-types)
3.  [Accounts](#3-accounts)
4.  [Budgets](#4-budgets)
5.  [Pots](#5-pots)
6.  [Payees](#6-payees)
7.  [Currencies](#7-currencies)
8.  [Labels](#8-labels)
9.  [Transactions](#9-transactions)
10. [Transaction Splits](#10-transaction-splits)
11. [Transaction Labels](#11-transaction-labels)

---

## 1. Users

Stores the link between the application's internal user ID and the identity managed by Ory Kratos. This is the root table for all user-owned data.

-   **Table Name**: `users`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Internal unique identifier for the user. |
| `kratos_id` | `UUID` | Not Null, Unique | Foreign key to the `id` in Ory Kratos's `identities` table. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 2. Account Types

A lookup table that defines the fundamental types of accounts used in double-entry bookkeeping.

-   **Table Name**: `account_types`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the account type. |
| `name` | `VARCHAR` | Not Null, Unique | The name of the type (e.g., "Asset", "Liability", "Income", "Expense", "Equity"). |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |

## 3. Accounts

Represents a user's real-world accounts, such as bank accounts, credit cards, or cash.

-   **Table Name**: `accounts`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the account. |
| `user_id` | `UUID` | Not Null, FK to `users.id` | The user who owns this account. |
| `account_type_id` | `UUID` | Not Null, FK to `account_types.id` | The type of this account. |
| `name` | `VARCHAR` | Not Null | The user-defined name for the account (e.g., "HSBC Current Account"). |
| `balance` | `DECIMAL` | Not Null, Default 0 | The current balance of the account. |
| `currency_id` | `UUID` | Not Null, FK to `currencies.id` | The default currency for this account. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 4. Budgets

The top-level container for a user's financial plan. A user can have multiple budgets.

-   **Table Name**: `budgets`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the budget. |
| `user_id` | `UUID` | Not Null, FK to `users.id` | The user who owns this budget. |
| `name` | `VARCHAR` | Not Null | The name of the budget (e.g., "Personal Budget 2025"). |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 5. Pots

The nested categories for budgeting, forming a hierarchical structure under a budget.

-   **Table Name**: `pots`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the pot. |
| `budget_id` | `UUID` | Not Null, FK to `budgets.id` | The budget this pot belongs to. |
| `parent_id` | `UUID` | Nullable, FK to `pots.id` | The parent pot, for creating nested structures. `NULL` for top-level pots. |
| `name` | `VARCHAR` | Not Null | The name of the pot (e.g., "Groceries"). |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 6. Payees

Represents the other party in a transaction (e.g., a store, a person, a company).

-   **Table Name**: `payees`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the payee. |
| `user_id` | `UUID` | Not Null, FK to `users.id` | The user who created this payee. |
| `name` | `VARCHAR` | Not Null | The name of the payee (e.g., "Tesco"). |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 7. Currencies

A lookup table for ISO 4217 currency codes and their formatting rules.

-   **Table Name**: `currencies`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the currency. |
| `code` | `VARCHAR(3)` | Not Null, Unique | The 3-letter ISO 4217 currency code (e.g., "GBP", "USD"). |
| `name` | `VARCHAR` | Not Null | The full name of the currency (e.g., "British Pound"). |
| `symbol` | `VARCHAR(5)` | Not Null | The currency symbol (e.g., "£", "$"). |
| `decimal_digits` | `SMALLINT` | Not Null, Default 2 | Number of digits after the decimal separator. |
| `symbol_position` | `VARCHAR` | Not Null, Default 'before' | Position of the symbol relative to the amount (e.g., `before`, `after`). |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |

## 8. Labels

Stores the unique `key:value` pairs for the flexible tagging system.

-   **Table Name**: `labels`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the label. |
| `user_id` | `UUID` | Not Null, FK to `users.id` | The user who created this label. |
| `key` | `VARCHAR` | Not Null | The key part of the label (e.g., "trip"). |
| `value` | `VARCHAR` | Nullable | The value part of the label (e.g., "paris-2025"). `NULL` for key-only tags. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |

_Constraint: A unique constraint should exist on the combination of `user_id`, `key`, and `value` where `value` is not `NULL`._

## 9. Transactions

The parent record for a financial event, such as a purchase or a transfer.

-   **Table Name**: `transactions`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the transaction. |
| `user_id` | `UUID` | Not Null, FK to `users.id` | The user who owns this transaction. |
| `payee_id` | `UUID` | Nullable, FK to `payees.id` | The payee associated with this transaction. |
| `transaction_date` | `DATE` | Not Null | The date the transaction occurred. |
| `description` | `TEXT` | Nullable | A user-provided description or note. |
| `status` | `VARCHAR` | Not Null, Default 'pending' | The status of the transaction (e.g., `pending`, `cleared`). |
| `source` | `VARCHAR` | Not Null, Default 'manual' | The source of the transaction (e.g., `manual`, `import`). |
| `exchange_rate` | `DECIMAL` | Not Null, Default 1 | The exchange rate applied if this was a foreign currency transaction. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |
| `deleted_at` | `TIMESTAMP` | Nullable | Timestamp for soft deletes. |

## 10. Transaction Splits

The individual debit/credit entries that make up a transaction, enabling double-entry accounting. The `amount` is always stored in the base currency of the associated `account_id`.

-   **Table Name**: `transaction_splits`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the split. |
| `transaction_id` | `UUID` | Not Null, FK to `transactions.id` | The parent transaction for this split. |
| `account_id` | `UUID` | Not Null, FK to `accounts.id` | The account this split affects. |
| `amount` | `DECIMAL` | Not Null | The amount of the split in the account's base currency. |
| `foreign_currency_id` | `UUID` | Nullable, FK to `currencies.id` | The original currency of this split, if different from the account's currency. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Not Null | Timestamp of last update. |

_Constraint: For any given `transaction_id`, the sum of `amount` (converted to a common currency) across all its splits must be zero._

## 11. Transaction Labels

A join table to create a many-to-many relationship between transactions and labels.

-   **Table Name**: `transaction_labels`

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | `UUID` | Not Null, FK to `transactions.id` | The transaction being labeled. |
| `label_id` | `UUID` | Not Null, FK to `labels.id` | The label being applied. |
| `created_at` | `TIMESTAMP` | Not Null | Timestamp of creation. |

_Constraint: The combination of `transaction_id` and `label_id` must be unique._
