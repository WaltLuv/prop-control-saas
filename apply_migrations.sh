#!/bin/bash

SUPABASE_URL="https://khvxsailqhupcsrqwzvj.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTQ1NTgsImV4cCI6MjA4NDk3MDU1OH0.6MgcJlsvBIXjRBainZzt-yrqUoth1BWJ6fpiNs0ntkM"

echo "Applying migrations to Supabase..."

for migration in supabase/migrations/*.sql; do
    echo "Applying: $migration"
    
    # Read SQL file and execute via REST API
    SQL_CONTENT=$(cat "$migration")
    
    curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}"
    
    echo ""
done

echo "Migrations complete!"
