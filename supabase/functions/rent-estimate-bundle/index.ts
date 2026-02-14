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
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Parse Input
        const { address, propertyId, beds, baths, sqft, propertyType } = await req.json()

        if (!address || !propertyId) {
            throw new Error('Missing required fields: address, propertyId')
        }

        // 2. Generate Cache Fingerprint (SHA-256 of normalized address)
        // Simple normalization: lowercase, remove non-alphanumeric
        const normalizedAddress = address.toLowerCase().replace(/[^a-z0-9]/g, '')
        const encoder = new TextEncoder()
        const data = encoder.encode(normalizedAddress)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const addressHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // 3. Check Cache
        const { data: cacheHit } = await supabase
            .from('property_rent_cache')
            .select('*')
            .eq('address_hash', addressHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (cacheHit) {
            console.log(`Cache hit for ${address}`)
            return new Response(JSON.stringify(cacheHit.payload), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Fetch from RentCast (if no cache)
        if (!RENTCAST_API_KEY) throw new Error('RentCast API Key not configured')

        const url = new URL('https://api.rentcast.io/v1/avm/rent/long-term')
        url.searchParams.append('address', address)
        if (beds) url.searchParams.append('bedrooms', beds.toString())
        if (baths) url.searchParams.append('bathrooms', baths.toString())
        if (sqft) url.searchParams.append('squareFootage', sqft.toString())
        if (propertyType) url.searchParams.append('propertyType', propertyType)

        const rentRes = await fetch(url.toString(), {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' }
        })

        if (!rentRes.ok) {
            const errText = await rentRes.text()
            console.error('RentCast Error:', errText)
            throw new Error(`RentCast API failed: ${rentRes.statusText}`)
        }

        const rentData = await rentRes.json()

        // 5. Structure the Bundle
        const payload = {
            estimate: rentData.rent,
            rangeLow: rentData.rentRangeLow,
            rangeHigh: rentData.rentRangeHigh,
            currency: rentData.currency,
            comparables: rentData.comparables || [], // 5-10 comps usually returned
            marketStats: {
                averageRent: rentData.comparables ? rentData.comparables.reduce((acc: any, c: any) => acc + c.price, 0) / rentData.comparables.length : 0,
                compCount: rentData.comparables ? rentData.comparables.length : 0
            },
            fetchedAt: new Date().toISOString()
        }

        // 6. Save to Cache (TTL 30 days)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await supabase.from('property_rent_cache').insert({
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
