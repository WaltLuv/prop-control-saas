import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY')
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
        const { address, propertyId, beds, baths, sqft, propertyType } = await req.json()

        if (!address || !propertyId) throw new Error('Missing required fields')

        // Normalization & Hashing
        const normalizedAddress = address.toLowerCase().replace(/[^a-z0-9]/g, '')
        const encoder = new TextEncoder()
        const data = encoder.encode(normalizedAddress)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const addressHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Check Cache
        const { data: cacheHit } = await supabase
            .from('property_appraisal_cache')
            .select('*')
            .eq('address_hash', addressHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (cacheHit) {
            return new Response(JSON.stringify(cacheHit.payload), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch AVM (Value)
        if (!RENTCAST_API_KEY) throw new Error('RentCast API Key missing')

        const url = new URL('https://api.rentcast.io/v1/avm/value')
        url.searchParams.append('address', address)
        if (propertyType) url.searchParams.append('propertyType', propertyType) // Helps AVM accuracy

        // Note: We don't verify beds/baths/sqft params for AVM as strictly, but good to pass if likely accurate
        if (beds) url.searchParams.append('bedrooms', beds.toString())

        const res = await fetch(url.toString(), {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' }
        })

        if (!res.ok) throw new Error(`RentCast AVM failed: ${res.statusText}`)
        const avmData = await res.json()

        // Additional: Fetch Sale Comps explicitly if not fully included in AVM response (RentCast AVM usually includes some)
        // For this bundle, we rely on the AVM endpoint's "comparables" array.

        const payload = {
            valuation: {
                price: avmData.price,
                rangeLow: avmData.priceRangeLow,
                rangeHigh: avmData.priceRangeHigh,
            },
            comparables: avmData.comparables || [],
            fetchedAt: new Date().toISOString()
        }

        // Save to Cache
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30 Day Cache

        await supabase.from('property_appraisal_cache').insert({
            property_id: propertyId,
            address_hash: addressHash,
            payload: payload,
            expires_at: expiresAt.toISOString()
        })

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
