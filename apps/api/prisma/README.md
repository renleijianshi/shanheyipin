# Prisma migration runbook

## Rules

- MySQL 8 is the source of truth; Redis is never the final order or inventory store.
- Each business module owns its models and adds one focused migration.
- Prefer additive expand → migrate → contract changes.
- Never edit an applied migration. Add a new forward migration instead.
- Production uses `npm run db:migrate:deploy`; `migrate dev` is local only.
- Back up and verify production data before destructive or long-locking changes.

## Local workflow

1. Set a local `DATABASE_URL` in `.env`.
2. Run `npm run db:validate`.
3. Run `npm run db:migrate:dev -- --name <module_change>`.
4. Inspect generated SQL and run the module tests.

## Verification

- `npm run db:validate`
- `npm run db:generate`
- Run migrations against an isolated MySQL database before any shared environment.
- Confirm expected tables, indexes, constraints, row counts, and orphan checks.

## Rollback

M02 is additive and creates no business table. If an empty environment must be reset,
drop only that isolated development database and re-run migrations. Production rollback
must use a reviewed forward migration; never delete migration history by hand.
