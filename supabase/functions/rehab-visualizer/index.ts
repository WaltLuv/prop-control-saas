import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            roomName,
            style,
            propertyId,
            imageUrls,
            // New Design Params
            wallColor,
            flooring,
            curtains,
            furnitureStyle,
            decorItems
        } = await req.json();

        // Helpers
        const paletteMap: Record<string, string> = {
            "Teal/Indigo": "a refined teal-to-indigo palette for headings, accents, and CTA",
            "Sky/Indigo": "a calm sky-to-indigo palette with modern contrast",
            "Indigo/Amber": "a premium indigo-to-amber palette with warm accents",
            "Teal/Rose": "a fresh teal-to-rose palette with contemporary energy",
            "Sky/Amber": "a friendly sky-to-amber palette for approachable spaces",
        };

        const isExterior = (r: string) => /exterior|backyard|patio|deck|porch|garden|curb_appeal|facade/i.test(r);

        const buildExteriorPrompt = ({
            roomType,
            style,
            wallColor,
            roofColor,
            featureColor
        }: any) => {
            return `
You are a senior exterior architectural visualizer and landscape designer.
Take the provided property photo and generate a photorealistic "after" renovation render.

CRITICAL INSTRUCTION: PRESERVE EXACT ARCHITECTURAL GEOMETRY.
- Do NOT add or remove windows, doors, or structural lines.
- Do NOT change the camera angle or perspective.
- Only change materials (siding, roof, landscaping) and lighting.

Tasks:
1) Update the architectural style to "${style}" for the "${roomType}".
2) Siding/Facade: Refresh with a clean, modern finish. Core color: "${wallColor || 'Clean White/Greige'}".
3) Landscaping: Manicured, high-end curb appeal. Fresh grass, trimmed hedges, modern pavers if applicable.
4) Lighting: Warm, inviting exterior lighting.
5) Roof/Trim: Complementary crisp trim (Black/Charcoal if modern, White if traditional).
6) Preserve the main structure's geometry and perspective. Do NOT turn an exterior into an interior.

Overall: High-end real estate photography, golden hour lighting, sharp details, magazine quality.
`;
        }

        const buildInteriorPrompt = ({
            roomType,
            furnitureStyle,
            wallColor,
            flooring,
            curtains,
            decorList,
            paletteDesc,
            observations,
            recommendedAction
        }: any) => {
            return `
You are a senior interior CGI artist and staging designer.
Take the provided room photo and generate a photorealistic "after" makeover render at high resolution.

CRITICAL CONTEXT FROM INSPECTION:
- Current Defects: "${observations || 'N/A'}"
- Required Upgrades: "${recommendedAction || 'General modernization'}"

CRITICAL INSTRUCTION: PRESERVE EXACT ROOM GEOMETRY.
- Do NOT move walls, windows, or doors.
- Do NOT change the ceiling height or perspective.
- Keep the exact same room layout.

Tasks:
1) EXECUTE THE REQUIRED UPGRADES: Prioritize the "Required Upgrades" list above. If it says "replace cabinets", replace them. If it says "refinish floors", make them look new.
2) Furniture: Swap to "${furnitureStyle || style}" style.
3) Walls: Paint "${wallColor || 'Warm White'}" (unless upgrades specify otherwise).
4) Flooring: install "${flooring || 'Light Wood'}" (unless upgrades specify otherwise).
5) Decor: Add ${decorList && decorList.length ? decorList.join(", ") : "minimal decor"}.
6) Lighting: Ensure bright, natural, welcoming light.

Color & Brand: Use "${paletteDesc || 'a refined teal-to-indigo palette'}" for accents.

Overall: ultra-clean, magazine-quality render that proves the renovation value.
`;
        }

        const propertyIdSafe = propertyId || 'temp';
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Fetch the original image if available
        let imagePart = null;
        if (imageUrls && imageUrls.length > 0) {
            try {
                // Use the first image (which should be the correct one thanks to previous fix)
                const imageUrl = imageUrls[0];
                const imageResp = await fetch(imageUrl);
                const imageType = imageResp.headers.get('content-type') || 'image/jpeg';
                const imageArrayBuffer = await imageResp.arrayBuffer();
                const imageBase64 = btoa(
                    new Uint8Array(imageArrayBuffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );

                imagePart = {
                    inlineData: {
                        data: imageBase64,
                        mimeType: imageType
                    }
                };
            } catch (fetchErr) {
                console.warn("Failed to fetch input image:", fetchErr);
            }
        }

        // Use the specialized image generation model (matching geminiService.ts)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: {
                // @ts-ignore
                responseModalities: ["TEXT", "IMAGE"]
            }
        });

        let promptText = "";
        if (imagePart) {
            if (isExterior(roomName)) {
                promptText = buildExteriorPrompt({
                    roomType: roomName,
                    style: furnitureStyle || style, // Reuse furniture style as general style
                    wallColor: wallColor,
                });
            } else {
                promptText = buildInteriorPrompt({
                    roomType: roomName,
                    furnitureStyle: furnitureStyle || style,
                    wallColor,
                    flooring,
                    curtains,
                    decorList: decorItems,
                    paletteDesc: paletteMap["Teal/Indigo"] // Default for now
                });
            }
        } else {
            promptText = `Create a photorealistic interior design render of a ${style} ${roomName}. Professional real estate photography, bright natural lighting, high resolution, 4k. Return ONLY the image.`;
        }

        const contentsParts: any[] = [{ text: promptText }];
        if (imagePart) contentsParts.push(imagePart);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: contentsParts }]
        });

        const response = result.response;

        // Extract Image matching geminiService parsing logic
        let imageBuffer: Uint8Array | null = null;
        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content.parts;
            for (const part of parts) {
                // Check for inline image data (Gemini)
                if (part.inlineData && part.inlineData.data) {
                    const binaryStr = atob(part.inlineData.data);
                    imageBuffer = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        imageBuffer[i] = binaryStr.charCodeAt(i);
                    }
                    break;
                }
            }
        }

        if (!imageBuffer) {
            throw new Error("AI did not return an image. Please try again.");
        }

        // 3. Upload to Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const fileName = `${propertyIdSafe}/${roomName.replace(/\s+/g, '_')}_${style.replace(/\s+/g, '_')}_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('prop-images')
            .upload(fileName, imageBuffer, { contentType: 'image/png' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
            .storage
            .from('prop-images')
            .getPublicUrl(fileName);

        return new Response(JSON.stringify({ success: true, imageUrl: publicUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message, details: "Real AI Generation Failed" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
