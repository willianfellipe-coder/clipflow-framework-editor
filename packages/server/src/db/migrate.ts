import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import * as schema from './schema.js';
import { PATHS } from '../config.js';

/**
 * GAP-008: Run Drizzle migrations from the ./migrations folder.
 *
 * Usage:
 *   pnpm --filter @clip/server db:migrate
 *
 * How it works:
 *   1. drizzle-kit generate  → writes SQL files to src/db/migrations/
 *   2. This script           → applies those SQL files to the real DB in order
 *
 * The migrations table (_drizzle_migrations) is auto-created by Drizzle to
 * track which migrations have already run — safe to call on every deploy.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log(`[migrate] Database path: ${PATHS.db}`);
  console.log(`[migrate] Migrations folder: ${migrationsFolder}`);

  const sqlite = new Database(PATHS.db);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  try {
    console.log('[migrate] Applying pending migrations...');
    migrate(db, { migrationsFolder });
    console.log('[migrate] ✅ All migrations applied successfully.');
  } catch (err) {
    console.error('[migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

runMigrations();
