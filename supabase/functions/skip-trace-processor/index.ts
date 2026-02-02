// supabase/functions/skip-trace-processor/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const { record } = await req.json() // The lead record from the DB trigger

        // 1. Intelligence Check: Only process if status is 'skip-tracing'
        if (record.moltbot_status !== 'skip-tracing') {
            return new Response("Not a skip-trace event", { status: 200 })
        }

        console.log(`Swarm starting skip-trace for: ${record.property_address || 'Unknown Address'}`)

        // 2. Call the Skip-Trace API (Mocked for Demo)
        // In production, you would fetch from BatchData, SkipSherpa, etc.
        const mockPhoneNumber = `(614) 555-${Math.floor(1000 + Math.random() * 9000)}`;

        // 3. Update Supabase with the new phone numbers
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabase
            .from('leads')
            .update({
                owner_phone: mockPhoneNumber,
                moltbot_status: 'contacted'
            })
            .eq('id', record.id)

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            message: "Swarm found the number!",
            phone: mockPhoneNumber
        }), { status: 200 })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
