// supabase/functions/swarm-vision-inspector/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai'

serve(async (req) => {
    try {
        const { record } = await req.json()
        const openai = new OpenAI({
            apiKey: Deno.env.get('KIMI_API_KEY') || Deno.env.get('OPENAI_API_KEY'),
            baseURL: Deno.env.get('KIMI_BASE_URL') || 'https://api.moonshot.ai/v1'
        })

        const googleKey = Deno.env.get('GOOGLE_MAPS_KEY');
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(record.property_address)}&key=${googleKey}`

        console.log(`👁️ Swarm Vision Unit Analyzing: ${record.property_address}`)

        const response = await openai.chat.completions.create({
            model: "kimi-k2.5", // Using Kimi 2.5 as requested
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze the property condition (Roof, Windows, Lawn). Scale 1-10. Return JSON: {roof, windows, lawn, summary}." },
                        { type: "image_url", image_url: { "url": streetViewUrl } },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        })

        const analysis = JSON.parse(response.choices[0].message.content ?? '{}')
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const score = (analysis.roof + analysis.windows + analysis.lawn) / 3;

        await supabase
            .from('leads')
            .update({
                vision_analysis: analysis,
                condition_score: score.toFixed(1),
                swarm_status: 'completed'
            })
            .eq('id', record.id)

        return new Response(JSON.stringify({ success: true, score }), { status: 200 })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
