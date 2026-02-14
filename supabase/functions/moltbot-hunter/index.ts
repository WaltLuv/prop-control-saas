// Supabase Edge Function: moltbot-hunter
// Orchestrates automated outreach for high-equity leads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface LeadRecord {
    lead_id: string;
    address: string;
    equity_level: string;
    distress_indicator?: string;
    owner_phone?: string;
    owner_email?: string;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Environment Validation
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error(JSON.stringify({ event: 'MoltbotInitError', error: 'Missing Supabase Environment Variables' }));
            throw new Error('Server Configuration Error');
        }

        // 3. Payload Validation
        let record: LeadRecord;
        try {
            const body = await req.json();
            record = body.record;
            if (!record || !record.lead_id || !record.address) {
                throw new Error('Invalid Payload: Missing record or required fields');
            }
        } catch (e: any) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body', details: e.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(JSON.stringify({
            event: 'MoltbotHunterReceived',
            lead_id: record.lead_id,
            address: record.address,
            equity: record.equity_level
        }));

        // 4. Intelligence Check: Only process High Equity leads
        if (record.equity_level !== 'High') {
            console.log(JSON.stringify({ event: 'MoltbotSkipped', reason: 'Low Equity', lead_id: record.lead_id }));
            return new Response(JSON.stringify({ skipped: true, reason: 'Equity not high enough' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Mock SMS Outreach (Placeholder for Twilio/Bandwidth)
        // In a real scenario, we would make an API call here.
        const smsPayload = {
            to: record.owner_phone || 'Unknown',
            body: `🔥 Hot Lead: ${record.address}. Equity: ${record.equity_level}. Action Required.`
        };
        console.log(JSON.stringify({ event: 'MoltbotOutreachSimulated', payload: smsPayload }));

        // 6. Update Database Status to 'Skip-Tracing' or 'Contacting'
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { error: updateError } = await supabaseClient
            .from('leads')
            .update({ moltbot_status: 'skip-tracing' })
            .eq('id', record.lead_id);

        if (updateError) {
            console.error(JSON.stringify({ event: 'MoltbotUpdateError', error: updateError }));
            throw new Error('Failed to update lead status');
        }

        return new Response(JSON.stringify({
            success: true,
            alert: "Sent (Simulated)",
            lead: record.address,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error(JSON.stringify({ event: 'MoltbotFatalError', error: error.message, stack: error.stack }));
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
