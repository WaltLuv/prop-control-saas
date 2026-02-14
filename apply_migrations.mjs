import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM5NDU1OCwiZXhwIjoyMDg0OTcwNTU4fQ.-IscFMdjG7sBAw_WcKk7S7H0LRVU5_5-sHYqRqh7kvE';

const migrationsDir = './supabase/migrations';
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files\n`);

// Split SQL into individual statements and execute them
async function executeSQL(sql) {
  // Split by semicolons but be careful with function definitions
  const statements = sql
    .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/) // Split on ; but not inside strings
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const results = [];
  
  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      // Use the Management API for DDL operations
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/sql',
          'Accept': 'application/json'
        },
        body: statement
      });

      const text = await response.text();
      results.push({ ok: response.ok, status: response.status, statement: statement.substring(0, 50) + '...', response: text });
    } catch (err) {
      results.push({ ok: false, error: err.message, statement: statement.substring(0, 50) + '...' });
    }
  }
  
  return results;
}

for (const file of files) {
  console.log(`\n📄 Applying: ${file}`);
  const sql = readFileSync(join(migrationsDir, file), 'utf-8');
  
  try {
    const results = await executeSQL(sql);
    let hasError = false;
    
    for (const result of results) {
      if (!result.ok && result.status !== 201) {
        hasError = true;
        console.log(`  ✗ ${result.statement}`);
        if (result.error) console.log(`    Error: ${result.error}`);
        if (result.response) console.log(`    Response: ${result.response}`);
      }
    }
    
    if (!hasError) {
      console.log(`  ✅ ${file} - Applied successfully (${results.length} statements)`);
    }
  } catch (err) {
    console.error(`  ✗ ${file} - Fatal error:`, err.message);
  }
}

console.log('\n✅ Migration process complete!');
