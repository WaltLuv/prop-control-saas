import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get user from auth header (since we need to save with user_id)
        // Get user from auth header (since we need to save with user_id)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) throw new Error('Unauthorized')

        const { propertyId, name, filterCriteria, selectedCompIds, arvSnapshot } = await req.json()

        if (!propertyId || !selectedCompIds) throw new Error('Missing required fields')

        // Save to DB
        const { data, error } = await supabase
            .from('property_comp_sets')
            .insert({
                property_id: propertyId,
                user_id: user.id,
                name: name || 'Custom Comp Set',
                filter_criteria: filterCriteria || {},
                selected_comp_ids: selectedCompIds, // JSON array
                arv_result_snapshot: arvSnapshot || null
            })
            .select()
            .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
