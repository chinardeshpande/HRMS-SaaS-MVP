# Production Migration Safety

Production deploys run database migrations automatically after the backend artifact is installed and before the backend process is restarted.

## Deploy Guarantees

- The deploy workflow creates a compressed PostgreSQL custom-format backup immediately before `npm run migrate`.
- Backups are stored on the production server under `/var/backups/hrms`.
- Backup filenames use the format `hrms_pre_migration_YYYYMMDDTHHMMSSZ.dump`.
- The workflow keeps the 10 newest pre-migration backups.
- If the backup command fails or produces an empty file, deployment stops before migrations run.

## Migration Rules

Migrations that run in the production deploy path must be backward-compatible with the previously deployed application version.

Allowed:

- Add nullable columns.
- Add columns with safe defaults.
- Add new tables.
- Add new indexes where locking impact is acceptable.
- Backfill data without deleting or rewriting user-entered production data.

Avoid in the automatic deploy path:

- Dropping columns or tables still used by the previous app version.
- Renaming columns without a compatibility window.
- Tightening `NOT NULL` constraints before all existing rows are valid.
- Changing enum values in a way that old code cannot read.
- Long blocking rewrites on large tables.

For destructive or non-backward-compatible schema changes, use a staged migration:

1. Deploy additive schema.
2. Deploy application code that reads/writes both old and new shape where needed.
3. Backfill and verify.
4. Remove old schema in a later deploy after rollback risk has passed.

## Restore Reference

If a production restore is required, use the matching dump file from `/var/backups/hrms` and restore with PostgreSQL 15 tooling.

Example shape:

```sh
pg_restore --clean --if-exists --no-owner --dbname "$DB_NAME" backup.dump
```

Before restoring, stop the backend process and take a fresh emergency backup of the current database state.
