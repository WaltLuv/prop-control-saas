// supabase/functions/swarm-skip-tracer/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const { record } = await req.json()
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

        console.log(`📡 Swarm Skip-Trace Unit: Researching ${record.property_address}`)

        // Simulation of a high-speed skip-trace
        const mockPhoneNumber = `(614) 555-${Math.floor(1000 + Math.random() * 9000)}`;

        await supabase
            .from('leads')
            .update({
                owner_phone: mockPhoneNumber,
                swarm_status: 'contacted'
            })
            .eq('id', record.id)

        return new Response(JSON.stringify({ success: true, phone: mockPhoneNumber }), { status: 200 })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
