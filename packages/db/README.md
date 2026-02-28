# Database Package

This package contains the database migrations and seeds for the In the Black application.

## Development

The database schema is managed using `knex`. The following commands are available for development:

### Creating Migrations

To create a new migration file, run the following command from the root of the monorepo:

```bash
pnpm --filter @in-the-black/db run db:migrate:make <migration_name>
```

Replace `<migration_name>` with a descriptive name for your migration (e.g., `create_accounts_table`).

### Running Migrations

When running the development environment with `tilt up`, migrations are automatically applied.

To manually run the latest migrations, you can use the following command:

```bash
pnpm --filter @in-the-black/db run db:migrate
```

### Seeding the Database

To populate the database with seed data, run:

```bash
pnpm --filter @in-the-black/db run db:seed
