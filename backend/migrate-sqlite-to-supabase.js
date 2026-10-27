import 'dotenv/config';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = path.resolve(
  process.env.SQLITE_DATABASE_PATH || path.join(scriptDirectory, 'attendance.db')
);
const replacementAdminPassword = process.env.MIGRATION_ADMIN_PASSWORD;
const adminUsername = process.env.MIGRATION_ADMIN_USERNAME || 'admin';
const source = new Database(sqlitePath, { readonly: true });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const tables = ['people', 'events', 'attendance', 'users'];
const batchSize = 500;

try {
  source.pragma('foreign_keys = ON');

  const orphanedAttendance = source.prepare(`
    SELECT COUNT(*) AS count
    FROM attendance a
    LEFT JOIN people p ON p.id = a.person_id
    LEFT JOIN events e ON e.id = a.event_id
    WHERE p.id IS NULL OR e.id IS NULL
  `).get().count;

  if (orphanedAttendance > 0) {
    throw new Error(
      `SQLite contains ${orphanedAttendance} attendance row(s) without a matching person or event`
    );
  }

  for (const table of tables) {
    const rows = source.prepare(`SELECT * FROM ${table}`).all();

    if (table === 'users' && replacementAdminPassword) {
      if (replacementAdminPassword.length < 12) {
        throw new Error('MIGRATION_ADMIN_PASSWORD must be at least 12 characters');
      }

      const admin = rows.find((user) => user.username === adminUsername);
      if (!admin) {
        throw new Error(`Could not find the migration admin account "${adminUsername}"`);
      }
      admin.password_hash = await bcrypt.hash(replacementAdminPassword, 12);
    }

    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const { error } = await supabase
        .from(table)
        .upsert(rows.slice(offset, offset + batchSize), { onConflict: 'id' });

      if (error) {
        throw new Error(`Failed importing ${table}: ${error.message}`);
      }
    }

    console.log(`Imported ${rows.length} ${table} row(s).`);
  }

  const { error } = await supabase.rpc('advance_id_sequences');
  if (error) {
    throw new Error(`Failed updating ID sequences: ${error.message}`);
  }

  console.log('SQLite data migration completed.');
} finally {
  source.close();
}
