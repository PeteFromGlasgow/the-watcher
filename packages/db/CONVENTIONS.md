# Database Conventions

This document outlines the conventions and standards for the database schema of the In the Black application.

## 1. Naming Conventions

-   **Tables:** Table names should be `snake_case` and plural (e.g., `users`, `accounts`, `transactions`).
-   **Columns:** Column names should be `snake_case` (e.g., `first_name`, `created_at`).

## 2. Primary Keys

-   All tables must have a primary key column named `id`.
-   The `id` column must be of type `UUID`. We will use a database function to automatically generate the UUIDs.

## 3. Timestamps

-   All user-modifiable tables must include the following timestamp columns:
    -   `created_at`: A `timestamp with time zone`, defaulting to the current transaction time. This value should never be updated.
    -   `updated_at`: A `timestamp with time zone`, defaulting to the current transaction time. This value should be automatically updated to the current transaction time whenever the row is modified.

## 4. Soft Deletes

-   To preserve data integrity and history, records should not be permanently deleted.
-   Tables containing user-modifiable data should include a `deleted_at` column of type `timestamp with time zone`.
-   A `NULL` value in this column indicates the record is active. A timestamp value indicates when the record was "deleted".
-   All queries for active records must include the condition `WHERE deleted_at IS NULL`.

## 5. Foreign Keys

-   Foreign key columns should be named in the format `{singular_table_name}_id` (e.g., `user_id`, `account_id`).
-   Foreign key constraints should be explicitly named for easier management, following the format `fk_{table_name}_{column_name}`.

## 6. Views

-   Views should be used to simplify complex queries, especially for reporting or providing a stable data API to client applications.
-   Views can also be used as a security mechanism to expose only certain columns or rows to specific database roles.
-   View names should be prefixed with `v_` (e.g., `v_user_account_summary`).

## 7. Stored Procedures & Functions

-   Stored procedures and functions should be used for complex, multi-step transactions where performance and atomicity are critical.
-   They can also be used to encapsulate business logic at the database level.
-   Function names should be prefixed with `fn_` (e.g., `fn_calculate_account_balance`).
-   Trigger functions should be prefixed with `tg_` (e.g., `tg_update_updated_at_timestamp`).
