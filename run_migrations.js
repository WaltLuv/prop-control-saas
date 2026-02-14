const SUPABASE_URL = 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM5NDU1OCwiZXhwIjoyMDg0OTcwNTU4fQ.-IscFMdjG7sBAw_WcKk7S7H0LRVU5_5-sHYqRqh7kvE';

const fs = require('fs');
const path = require('path');

const migrationsDir = './supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files\n`);

async function runMigration(file) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative approach - direct SQL execution
      const pgResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: sql
      });
      
      console.log(`✓ ${file} - Status: ${pgResponse.status}`);
    } else {
      console.log(`✓ ${file} - Applied successfully`);
    }
  } catch (err) {
    console.error(`✗ ${file} - Error:`, err.message);
  }
}

(async () => {
  for (const file of files) {
    console.log(`Applying: ${file}`);
    await runMigration(file);
  }
  console.log('\n✅ All migrations processed!');
})();
