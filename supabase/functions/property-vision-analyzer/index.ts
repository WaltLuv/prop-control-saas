// supabase/functions/property-vision-analyzer/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai'

serve(async (req) => {
    try {
        const { record } = await req.json()

        // 1. Intelligence Check: Ensure we have an address
        if (!record.property_address) {
            return new Response("Missing address", { status: 400 })
        }

        const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

        // 2. Construct the Street View URL
        const googleKey = Deno.env.get('GOOGLE_MAPS_KEY') ?? Deno.env.get('STREET_VIEW_API_KEY');
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(record.property_address)}&key=${googleKey}`

        console.log(`Swarm Inspecting Property Visuals: ${record.property_address}`)

        // 3. Ask Swarm Vision to "Inspect" the property
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this property for real estate investment. Rate the condition of the Roof, Windows, and Lawn on a scale of 1-10 (1=Distressed/Broken, 10=New/Pristine). Mention if you see boards, tarps, or signs of vacancy. Return a JSON object with keys: roof, windows, lawn, summary."
                        },
                        {
                            type: "image_url",
                            image_url: { "url": streetViewUrl }
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        })

        const analysis = JSON.parse(response.choices[0].message.content ?? '{}')

        // 4. Update Supabase with the AI Insights
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const conditionScore = (analysis.roof + analysis.windows + analysis.lawn) / 3;

        await supabase
            .from('leads')
            .update({
                vision_analysis: analysis,
                condition_score: conditionScore.toFixed(1),
                moltbot_status: 'analyzed'
            })
            .eq('id', record.id)

        return new Response(JSON.stringify({
            success: true,
            analysis,
            score: conditionScore
        }), { status: 200 })

    } catch (err: any) {
        console.error("Vision Error:", err.message)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
