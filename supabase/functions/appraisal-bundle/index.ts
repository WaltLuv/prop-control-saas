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

        // 1. Check Appraisal Cache
        const { data: appCacheHit } = await supabase
            .from('property_appraisal_cache')
            .select('*')
            .eq('address_hash', addressHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        // 2. Check Rent Cache
        const { data: rentCacheHit } = await supabase
            .from('property_rent_cache')
            .select('*')
            .eq('address_hash', addressHash)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        // If both hit, return combined
        if (appCacheHit && rentCacheHit) {
            return new Response(JSON.stringify({
                ...appCacheHit.payload,
                rent: rentCacheHit.payload.estimate,
                rentRangeLow: rentCacheHit.payload.rangeLow,
                rentRangeHigh: rentCacheHit.payload.rangeHigh,
                rentComparables: rentCacheHit.payload.comparables
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (!RENTCAST_API_KEY) throw new Error('RentCast API Key missing')

        // 3. Fetch AVM (Value)
        const avmUrl = new URL('https://api.rentcast.io/v1/avm/value')
        avmUrl.searchParams.append('address', address)
        if (propertyType) avmUrl.searchParams.append('propertyType', propertyType)
        if (beds) avmUrl.searchParams.append('bedrooms', beds.toString())

        // 4. Fetch Rent (Long Term)
        const rentUrl = new URL('https://api.rentcast.io/v1/avm/rent/long-term')
        rentUrl.searchParams.append('address', address)
        if (propertyType) rentUrl.searchParams.append('propertyType', propertyType)
        if (beds) rentUrl.searchParams.append('bedrooms', beds.toString())
        if (baths) rentUrl.searchParams.append('bathrooms', baths.toString())
        if (sqft) rentUrl.searchParams.append('squareFootage', sqft.toString())

        const [avmRes, rentRes] = await Promise.all([
            fetch(avmUrl.toString(), { headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' } }),
            fetch(rentUrl.toString(), { headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' } })
        ])

        if (!avmRes.ok) throw new Error(`RentCast AVM (Value) failed: ${avmRes.statusText}`)
        if (!rentRes.ok) throw new Error(`RentCast AVM (Rent) failed: ${rentRes.statusText}`)

        const avmData = await avmRes.json()
        const rentData = await rentRes.json()

        const appraisalPayload = {
            valuation: {
                price: avmData.price,
                rangeLow: avmData.priceRangeLow,
                rangeHigh: avmData.priceRangeHigh,
            },
            comparables: avmData.comparables || [],
            fetchedAt: new Date().toISOString()
        }

        const rentPayload = {
            estimate: rentData.rent,
            rangeLow: rentData.rentRangeLow,
            rangeHigh: rentData.rentRangeHigh,
            currency: rentData.currency,
            comparables: rentData.comparables || [],
            marketStats: {
                averageRent: rentData.comparables ? rentData.comparables.reduce((acc: any, c: any) => acc + c.price, 0) / rentData.comparables.length : 0,
                compCount: rentData.comparables ? rentData.comparables.length : 0
            },
            fetchedAt: new Date().toISOString()
        }

        // 5. Save to Cache
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 14) // 14 Day Cache for Freshness

        await Promise.all([
            supabase.from('property_appraisal_cache').insert({
                property_id: propertyId,
                address_hash: addressHash,
                payload: appraisalPayload,
                expires_at: expiresAt.toISOString()
            }),
            supabase.from('property_rent_cache').insert({
                property_id: propertyId,
                address_hash: addressHash,
                payload: rentPayload,
                expires_at: expiresAt.toISOString()
            })
        ])

        return new Response(JSON.stringify({
            ...appraisalPayload,
            rent: rentPayload.estimate,
            rentRangeLow: rentPayload.rangeLow,
            rentRangeHigh: rentPayload.rangeHigh,
            rentComparables: rentPayload.comparables
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Appraisal Bundle Error:', error.message);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack,
            context: "appraisal-bundle"
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
