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
        const { address, radius, daysOld, propertyType, beds, baths, mode } = await req.json()

        // mode: 'sale' | 'rent' (defaults to 'sale')
        // radius: miles (default 1)
        // daysOld: sold/listed within X days (default 180)

        // 1a. Authenticate User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { status: 401, headers: corsHeaders })
        }

        // 1b. Generate Cache Key (Hash of all search params)
        const searchParams = { address, radius, daysOld, propertyType, beds, baths, mode }
        const paramString = JSON.stringify(searchParams)

        const encoder = new TextEncoder()
        const data = encoder.encode(paramString)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const searchHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // 2. Check Cache
        const { data: cacheHit } = await supabase
            .from('property_comps_cache')
            .select('*')
            .eq('search_hash', searchHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (cacheHit) {
            return new Response(JSON.stringify(cacheHit.payload), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Fetch from RentCast
        if (!RENTCAST_API_KEY) throw new Error('RentCast API Key missing')

        // Choose endpoint based on mode
        const endpoint = mode === 'rent'
            ? 'https://api.rentcast.io/v1/avm/rent/long-term' // Use AVM for rent comps as it returns a good set
            : 'https://api.rentcast.io/v1/avm/value'          // Use AVM for sale comps (Market Value)

        // Alternatively, use the /comps endpoints for stricter control, but AVM endpoints are often better for "quick" context
        // Let's use the specific /listings/sale or /listings/rent endpoints for "Explorer" mode to get raw listings if needed
        // But the prompt guidelines suggested using the AVM endpoints as the primary data source for simplicity and cost mapping.
        // Let's stick to the AVM endpoints which return `comparables`. 
        // If we need more flexibility, we'd use /listings/sale with radius/daysOld.

        // "Goal: ...manual search/filter... radius... date range"
        // The AVM endpoint returns a fixed set. The /listings endpoint allows filtering.
        // Let's use /listings/sale or /listings/long-term-rent for true "Explorer" functionality.

        let urlStr = mode === 'rent'
            ? 'https://api.rentcast.io/v1/listings/rental/long-term'
            : 'https://api.rentcast.io/v1/listings/sale'

        const url = new URL(urlStr)
        url.searchParams.append('address', address) // Center point
        url.searchParams.append('radius', (radius || 1).toString())
        url.searchParams.append('daysOld', (daysOld || 180).toString())

        if (propertyType) url.searchParams.append('propertyType', propertyType)
        if (beds) {
            url.searchParams.append('bedrooms', beds.toString())
        }

        const res = await fetch(url.toString(), {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' }
        })

        if (!res.ok) throw new Error(`RentCast Search failed: ${res.statusText}`)
        const listings = await res.json()

        // 4. Cache Results
        const payload = {
            results: listings, // Array of listings
            count: listings.length,
            fetchedAt: new Date().toISOString()
        }

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 Day cache for searches

        await supabase.from('property_comps_cache').insert({
            search_hash: searchHash,
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
