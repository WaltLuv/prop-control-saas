import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM5NDU1OCwiZXhwIjoyMDg0OTcwNTU4fQ.-IscFMdjG7sBAw_WcKk7S7H0LRVU5_5-sHYqRqh7kvE';

const migrationsDir = './supabase/migrations';
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files\n`);

async function runSQLQuery(sql) {
  // Use Supabase's SQL query endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

for (const file of files) {
  console.log(`Applying: ${file}`);
  const sql = readFileSync(join(migrationsDir, file), 'utf-8');
  
  try {
    const response = await runSQLQuery(sql);
    const text = await response.text();
    
    if (!response.ok) {
      console.error(`✗ ${file} - Status ${response.status}: ${text}`);
    } else {
      console.log(`✓ ${file} - Applied successfully`);
    }
  } catch (err) {
    console.error(`✗ ${file} - Error:`, err.message);
  }
}

console.log('\n✅ All migrations processed!');
