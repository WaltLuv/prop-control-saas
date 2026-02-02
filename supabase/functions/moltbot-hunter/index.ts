// Supabase Edge Function: moltbot-hunter
// Orchestrates automated outreach for high-equity leads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        const { record } = await req.json()

        // 1. Intelligence Check: Only process High Equity leads
        if (record.equity_level !== 'High') {
            return new Response(JSON.stringify({ skipped: true, reason: 'Equity not high enough' }), { status: 200 })
        }

        const message = `🔥 MOLTBOT ALERT: Hot Lead found!\nAddress: ${record.address}\nEquity: ${record.equity_level}\nDistress: ${record.distress_indicator}`

        console.log(message)

        // 2. Mock SMS Outreach (Integrate Twilio here)
        // const twilioResponse = await fetch(...)

        // 3. Update Database Status to 'Skip-Tracing'
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseClient
            .from('leads')
            .update({ moltbot_status: 'skip-tracing' })
            .eq('id', record.lead_id)

        return new Response(JSON.stringify({
            success: true,
            alert: "Sent",
            lead: record.address
        }), { status: 200 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
