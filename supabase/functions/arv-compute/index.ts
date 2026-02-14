import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { comparables, subjectSqft, finishLevel, rehabScope } = await req.json()

        if (!comparables || !Array.isArray(comparables) || comparables.length === 0) {
            throw new Error("No comparables provided for ARV calculation")
        }

        // 1. Filter & Sort Comps
        // Heuristic: Recent sales only (last 12 months preferred), within distance
        // For now, we assume the client/AVM provided a relevant set.
        // We will calculate PPSF (Price Per Square Foot)

        const validComps = comparables.filter((c: any) => c.price && c.squareFootage && c.squareFootage > 0)

        if (validComps.length === 0) throw new Error("No valid comps with Price & SqFt found")

        const ppsfValues = validComps.map((c: any) => c.price / c.squareFootage)

        // Calculate Median PPSF
        ppsfValues.sort((a: number, b: number) => a - b)
        const mid = Math.floor(ppsfValues.length / 2)
        const medianPPSF = ppsfValues.length % 2 !== 0 ? ppsfValues[mid] : (ppsfValues[mid - 1] + ppsfValues[mid]) / 2

        // 2. Apply Renovation Adjustment Multipliers
        // Logic: A "High End" renovation should command a higher PPSF than the median of "As-Is" comps (usually).
        // Or if comps are mixed, we assume median is "Standard".

        let multiplier = 1.0

        // Heuristic Matrix
        // finishLevel: 'standard' | 'high-end' | 'luxury'
        // rehabScope: 'light' | 'medium' | 'heavy'

        if (finishLevel === 'high-end') multiplier += 0.05 // +5% premium
        if (finishLevel === 'luxury') multiplier += 0.10 // +10% premium

        if (rehabScope === 'heavy') multiplier += 0.02 // extensive rehab implies new systems, slight premium over just cosmetic

        const adjustedPPSF = medianPPSF * multiplier
        const arvEstimate = Math.round(adjustedPPSF * (subjectSqft || 1000)) // Fallback sqft if missing (shouldn't happen)

        const payload = {
            arvEstimate: arvEstimate,
            medianPPSF: Math.round(medianPPSF),
            adjustedPPSF: Math.round(adjustedPPSF),
            compCount: validComps.length,
            adjustmentFactor: multiplier
        }

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
