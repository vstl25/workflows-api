# Restore PostgreSQL Database in pgAdmin

This guide explains how to restore the `workflows` database in pgAdmin when your dump file is a custom/blob format rather than plain SQL.

> The dump file is stored in the repository at `workflows-api/db-dump/`.

## 1. Create the target database

1. Open pgAdmin and connect to your PostgreSQL server.
2. In the left sidebar, expand the server and right-click `Databases`.
3. Choose `Create` → `Database...`.
4. Set the database name to `workflows`.
5. Click `Save`.

## 2. Restore from a blob/custom dump file

1. Right-click the newly created `workflows` database.
2. Choose `Restore...`.
3. In the Restore dialog:
   - For `Format`, choose `Custom` or `Tar` if pgAdmin does not auto-detect the file type.
   - Select the backup file from disk.
4. Leave the default options unless your dump includes roles or tablespaces.
5. Click `Restore`.

## 3. Verification

After restore completes, expand the `workflows` database in pgAdmin and verify:

- `Schemas`
- `Tables`
- `Functions`
- `Data` in key tables

If you need, you can also run a simple query such as:

```sql
SELECT count(*) FROM users;
```
