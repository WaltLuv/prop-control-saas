import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const sql = postgres('postgresql://postgres:Newvintage17!@db.khvxsailqhupcsrqwzvj.supabase.co:5432/postgres', {
  ssl: 'require'
});

const migrationsDir = './supabase/migrations';
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files\n`);

for (const file of files) {
  console.log(`📄 Applying: ${file}`);
  const sqlContent = readFileSync(join(migrationsDir, file), 'utf-8');
  
  try {
    await sql.unsafe(sqlContent);
    console.log(`✅ ${file} - Applied successfully\n`);
  } catch (err) {
    console.error(`✗ ${file} - Error:`, err.message, '\n');
  }
}

console.log('✅ All migrations processed!');
await sql.end();
