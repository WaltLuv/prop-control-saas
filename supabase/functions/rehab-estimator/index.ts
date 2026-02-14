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
        const { propertyId, imageUrls, sqft } = await req.json();

        if (!imageUrls || imageUrls.length === 0) {
            throw new Error("No images provided for analysis.");
        }

        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // FULL VISUAL SOW COST DATABASE (Synced with geminiService.ts)
        const LOCAL_COST_DB = {
            // CONTRACTOR HOURLY RATES
            "labor-handyman": { low: 85, mid: 85, high: 100, unit: "per hour" },
            "labor-general-contractor": { low: 100, mid: 100, high: 150, unit: "per hour" },
            "labor-electrician": { low: 125, mid: 125, high: 175, unit: "per hour" },
            "labor-plumber": { low: 125, mid: 125, high: 175, unit: "per hour" },
            "labor-hvac-tech": { low: 150, mid: 150, high: 200, unit: "per hour" },
            "labor-roofer": { low: 200, mid: 200, high: 250, unit: "per hour" },
            "labor-engineer": { low: 200, mid: 200, high: 300, unit: "per hour" },
            "labor-appliance-tech": { low: 75, mid: 75, high: 100, unit: "per hour" },
            "labor-irrigation": { low: 75, mid: 75, high: 100, unit: "per hour" },
            "labor-pool-specialist": { low: 100, mid: 100, high: 150, unit: "per hour" },

            // STRUCTURAL
            "foundation-exposed-footing": { low: 10, mid: 12, high: 15, unit: "per lin ft" },
            "foundation-corner-pop": { low: 300, mid: 400, high: 500, unit: "per corner" },
            "foundation-slab-pier": { low: 600, mid: 700, high: 800, unit: "per pier" },
            "foundation-underpin": { low: 300, mid: 400, high: 600, unit: "per lin ft" },
            "foundation-underpin-corner": { low: 5000, mid: 7000, high: 10000, unit: "per corner" },
            "foundation-crack-repair": { low: 400, mid: 600, high: 800, unit: "per crack" },
            "foundation-parge-coat": { low: 3, mid: 3.50, high: 4, unit: "per sqft" },
            "foundation-pier-beam-repair": { low: 1300, mid: 1400, high: 1500, unit: "per pier" },
            "foundation-pier-bracing": { low: 200, mid: 300, high: 400, unit: "per pier" },
            "foundation-sill-plate": { low: 60, mid: 80, high: 120, unit: "per lin ft" },
            "crawlspace-vent": { low: 300, mid: 550, high: 800, unit: "per vent" },
            "crawlspace-encapsulation": { low: 3, mid: 4, high: 5, unit: "per sqft" },
            "grading-site-work": { low: 1000, mid: 2000, high: 4000, unit: "per project" },
            "french-drain": { low: 20, mid: 22, high: 25, unit: "per lin ft" },
            "sod-topsoil": { low: 1, mid: 1.50, high: 2, unit: "per sqft" },
            "gutter-aluminum-install": { low: 5, mid: 7, high: 10, unit: "per lin ft" },
            "gutter-copper-install": { low: 15, mid: 20, high: 25, unit: "per lin ft" },
            "downspout-replacement": { low: 100, mid: 125, high: 150, unit: "each" },
            "downspout-extension": { low: 15, mid: 20, high: 25, unit: "each" },
            "gutter-cleaning": { low: 150, mid: 225, high: 300, unit: "per home" },
            "rafter-ridge-repair": { low: 300, mid: 2000, high: 4500, unit: "per repair" },
            "collar-ties-install": { low: 30, mid: 40, high: 50, unit: "each" },
            "purlin-bracing": { low: 150, mid: 225, high: 300, unit: "per repair" },
            "soffit-repair": { low: 20, mid: 25, high: 30, unit: "per lin ft" },
            "fascia-repair": { low: 15, mid: 20, high: 25, unit: "per lin ft" },
            "insulation-blown-attic": { low: 2, mid: 2.75, high: 3.50, unit: "per sqft" },
            "insulation-wall-cavity": { low: 2, mid: 2.75, high: 3.50, unit: "per sqft" },
            "insulation-knee-wall": { low: 4, mid: 4.50, high: 5, unit: "per ft" },
            "insulation-spray-foam": { low: 1.25, mid: 1.60, high: 2, unit: "per sqft" },
            "insulation-rigid-exterior": { low: 1, mid: 1.50, high: 2, unit: "per sqft" },
            "soffit-vent-improve": { low: 40, mid: 45, high: 50, unit: "per vent" },
            "roof-vent-static": { low: 300, mid: 475, high: 650, unit: "each" },
            "ridge-vent": { low: 2, mid: 2.50, high: 3, unit: "per lin ft" },

            // ROOFING
            "roof-tune-up": { low: 800, mid: 1300, high: 1800, unit: "per roof" },
            "roof-3tab-shingle": { low: 3, mid: 4, high: 5, unit: "per sqft" },
            "roof-composition-shingle": { low: 5, mid: 7.50, high: 10, unit: "per sqft" },
            "roof-metal": { low: 3, mid: 4, high: 5, unit: "per sqft" },
            "roof-rolled": { low: 1, mid: 1.50, high: 2, unit: "per sqft" },
            "roof-single-membrane": { low: 5, mid: 6.50, high: 8, unit: "per sqft" },
            "roof-built-up-gravel": { low: 4, mid: 5, high: 6, unit: "per sqft" },
            "roof-wood-shakes": { low: 6, mid: 8, high: 10, unit: "per sqft" },
            "roof-clay-tile": { low: 10, mid: 14, high: 18, unit: "per sqft" },
            "roof-slate-tile": { low: 10, mid: 12, high: 15, unit: "per sqft" },
            "flashing-valley": { low: 20, mid: 25, high: 30, unit: "per lin ft" },
            "flashing-kickout": { low: 150, mid: 175, high: 200, unit: "each" },
            "flashing-step": { low: 500, mid: 625, high: 750, unit: "per repair" },
            "flashing-chimney-skylight": { low: 300, mid: 400, high: 500, unit: "each" },

            // EXTERIOR
            "brick-repoint-cracks": { low: 4, mid: 6, high: 8, unit: "per lin ft" },
            "brick-replace-loose": { low: 10, mid: 13, high: 16, unit: "per sqft" },
            "brick-replace-deteriorated": { low: 20, mid: 25, high: 30, unit: "per sqft" },
            "brick-chemical-wash": { low: 3, mid: 4.50, high: 6, unit: "per sqft" },
            "siding-cement-board": { low: 10, mid: 12, high: 15, unit: "per sqft" },
            "siding-vinyl": { low: 4, mid: 5.50, high: 7, unit: "per sqft" },
            "siding-wood": { low: 8, mid: 10, high: 12, unit: "per sqft" },
            "seal-penetrations": { low: 300, mid: 350, high: 400, unit: "per home" },
            "exterior-caulk-paint": { low: 50, mid: 100, high: 150, unit: "per 100 sqft" },
            "exterior-trim-paint": { low: 1500, mid: 2000, high: 2500, unit: "per home" },
            "exterior-trim-walls-paint": { low: 3000, mid: 4000, high: 6000, unit: "per home" },
            "window-glass-pack-standard": { low: 150, mid: 275, high: 400, unit: "each" },
            "window-glass-pack-special": { low: 600, mid: 900, high: 1200, unit: "each" },
            "window-install-standard": { low: 30, mid: 40, high: 50, unit: "per sqft" },
            "window-caulk": { low: 25, mid: 37, high: 50, unit: "per window" },

            // INTERIOR
            "drywall-install": { low: 1.50, mid: 2, high: 2.50, unit: "per sqft" },
            "drywall-tape-texture": { low: 1.50, mid: 2, high: 2.50, unit: "per sqft" },
            "ceiling-water-stain-repair": { low: 300, mid: 400, high: 500, unit: "per repair" },
            "ceiling-popcorn-remove": { low: 4, mid: 4.50, high: 5, unit: "per sqft" },
            "interior-paint-general": { low: 1.50, mid: 2.50, high: 3.50, unit: "per sqft" },
            "interior-paint-walls-trim": { low: 3000, mid: 4000, high: 6000, unit: "per 2000 sqft house" },
            "interior-paint-trim-only": { low: 1500, mid: 2000, high: 2500, unit: "per 2000 sqft house" },
            "flooring-hardwood-refinish": { low: 2, mid: 3, high: 4, unit: "per sqft" },
            "flooring-hardwood-install": { low: 9, mid: 12, high: 15, unit: "per sqft" },
            "flooring-tile-install": { low: 15, mid: 17, high: 20, unit: "per sqft" },
            "flooring-vinyl-install": { low: 3, mid: 4, high: 5, unit: "per sqft" },
            "flooring-carpet-synthetic": { low: 15, mid: 17, high: 20, unit: "per sqyd" },
            "flooring-carpet-wool": { low: 40, mid: 50, high: 60, unit: "per sqyd" },

            // DOORS
            "door-casing-repair": { low: 150, mid: 175, high: 200, unit: "each" },
            "door-exterior-metal": { low: 300, mid: 400, high: 500, unit: "each" },
            "door-exterior-solid-wood": { low: 600, mid: 900, high: 1200, unit: "each" },
            "door-exterior-lock-hardware": { low: 150, mid: 200, high: 250, unit: "each" },
            "door-sliding-glass-replace": { low: 1000, mid: 1400, high: 1800, unit: "each" },
            "door-sliding-glass-install": { low: 2000, mid: 2500, high: 3000, unit: "each" },
            "garage-door-header": { low: 2500, mid: 2750, high: 3000, unit: "each" },
            "garage-door-panel": { low: 250, mid: 500, high: 750, unit: "each" },
            "garage-door-single-sectional": { low: 750, mid: 875, high: 1000, unit: "each" },
            "garage-door-double-sectional": { low: 1200, mid: 1350, high: 1500, unit: "each" },
            "garage-door-track-hardware": { low: 200, mid: 250, high: 300, unit: "per repair" },
            "garage-door-tension-spring": { low: 175, mid: 200, high: 225, unit: "each" },
            "garage-door-operator": { low: 250, mid: 350, high: 450, unit: "each" },
            "garage-door-control-panel": { low: 75, mid: 112, high: 150, unit: "each" },
            "door-interior-hollow-core": { low: 150, mid: 200, high: 250, unit: "each" },
            "door-interior-custom-wood": { low: 400, mid: 500, high: 600, unit: "each" },
            "door-french-install": { low: 700, mid: 850, high: 1000, unit: "each" },
            "skylight-replace": { low: 1000, mid: 2000, high: 3000, unit: "each" },

            // FIREPLACE
            "chimney-sweep": { low: 200, mid: 225, high: 250, unit: "each" },
            "firebox-crack-repair": { low: 300, mid: 1000, high: 1800, unit: "per repair" },
            "firebox-refractory-panel": { low: 180, mid: 215, high: 250, unit: "per panel" },
            "fireplace-glass-door": { low: 300, mid: 400, high: 500, unit: "each" },
            "fireplace-damper-repair": { low: 150, mid: 225, high: 300, unit: "each" },
            "chimney-cricket-install": { low: 300, mid: 400, high: 500, unit: "each" },
            "chimney-rebuild-above-roof": { low: 200, mid: 250, high: 300, unit: "per lin ft" },
            "chimney-repoint-brick": { low: 20, mid: 25, high: 30, unit: "per row" },
            "chimney-mortar-crown": { low: 800, mid: 1400, high: 2000, unit: "each" },
            "chimney-cap-install": { low: 150, mid: 175, high: 200, unit: "each" },
            "fireplace-wood-to-gas": { low: 1000, mid: 1250, high: 1500, unit: "each" },

            // PEST CONTROL
            "termite-spot-treatment": { low: 300, mid: 550, high: 800, unit: "per treatment" },
            "termite-partial-treatment": { low: 1200, mid: 1850, high: 2500, unit: "per treatment" },
            "pest-one-time-treatment": { low: 200, mid: 250, high: 300, unit: "per treatment" },
            "rodent-exclusion": { low: 250, mid: 375, high: 500, unit: "per home" },

            // DECKS / PATIOS
            "concrete-pour": { low: 8, mid: 10, high: 12, unit: "per sqft" },
            "paver-interlocking": { low: 5, mid: 6.50, high: 8, unit: "per sqft" },
            "flagstone-fieldstone": { low: 10, mid: 15, high: 20, unit: "per sqft" },
            "asphalt-resurface-seal": { low: 2, mid: 3, high: 4, unit: "per sqft" },
            "porch-wood-flooring": { low: 4, mid: 5, high: 6, unit: "per sqft" },
            "porch-wood-skirting": { low: 10, mid: 12, high: 15, unit: "per lin ft" },
            "step-railing-replace": { low: 150, mid: 175, high: 200, unit: "each" },
            "deck-install-repair": { low: 15, mid: 20, high: 25, unit: "per sqft" },
            "deck-guard-handrail": { low: 12, mid: 16, high: 20, unit: "per lin ft" },
            "retaining-wall-wood-stone": { low: 20, mid: 22, high: 25, unit: "per sqft" },
            "retaining-wall-concrete": { low: 30, mid: 35, high: 40, unit: "per sqft" },
            "fence-wood-install": { low: 12, mid: 18, high: 25, unit: "per lin ft" },
            "fence-wrought-iron": { low: 25, mid: 27, high: 30, unit: "per lin ft" },
            "fence-chain-link": { low: 7, mid: 11, high: 15, unit: "per lin ft" },
            "gate-repair": { low: 200, mid: 250, high: 300, unit: "each" },

            // ELECTRICAL
            "electrical-overhead-service": { low: 3000, mid: 3750, high: 4500, unit: "per service" },
            "electrical-upgrade-100amp": { low: 1200, mid: 1500, high: 1800, unit: "per panel" },
            "electrical-upgrade-200amp": { low: 1500, mid: 1850, high: 2200, unit: "per panel" },
            "electrical-breaker-panel": { low: 500, mid: 650, high: 800, unit: "each" },
            "electrical-obsolete-panel": { low: 1200, mid: 1500, high: 1800, unit: "each" },
            "electrical-240v-circuit": { low: 250, mid: 300, high: 350, unit: "each" },
            "electrical-120v-circuit": { low: 150, mid: 200, high: 250, unit: "each" },
            "electrical-ground-neutral-sep": { low: 200, mid: 250, high: 300, unit: "per panel" },
            "electrical-gas-bonding": { low: 200, mid: 250, high: 300, unit: "per home" },
            "electrical-ground-rod": { low: 300, mid: 350, high: 400, unit: "each" },
            "outlet-exterior-weatherproof": { low: 200, mid: 250, high: 300, unit: "each" },
            "outlet-conventional-add": { low: 75, mid: 112, high: 150, unit: "each" },
            "outlet-gfci-upgrade": { low: 75, mid: 87, high: 100, unit: "each" },
            "outlet-open-ground-fix": { low: 25, mid: 37, high: 50, unit: "each" },
            "switch-replace": { low: 15, mid: 20, high: 25, unit: "each" },
            "junction-box-install": { low: 150, mid: 225, high: 300, unit: "each" },
            "electrical-conduit": { low: 5, mid: 6.50, high: 8, unit: "per lin ft" },
            "light-fixture-install": { low: 100, mid: 150, high: 200, unit: "each" },
            "ceiling-fan-install": { low: 200, mid: 250, high: 300, unit: "each" },
            "outlet-aluminum-compatible": { low: 60, mid: 90, high: 120, unit: "each" },
            "rewire-room": { low: 1000, mid: 1250, high: 1500, unit: "per room" },
            "rewire-entire-house": { low: 5000, mid: 7500, high: 12000, unit: "per home" },
            "smoke-detector-battery": { low: 50, mid: 62, high: 75, unit: "each" },
            "smoke-detector-hardwired": { low: 75, mid: 87, high: 100, unit: "each" },
            "smoke-detector-combo": { low: 100, mid: 125, high: 150, unit: "each" },
            "co-detector-battery": { low: 50, mid: 62, high: 75, unit: "each" },

            // HVAC
            "hvac-further-evaluation": { low: 150, mid: 150, high: 200, unit: "per visit" },
            "hvac-seasonal-service": { low: 120, mid: 150, high: 180, unit: "per visit" },
            "hvac-clean-condenser-handler": { low: 300, mid: 400, high: 500, unit: "per system" },
            "hvac-comb-condenser-fins": { low: 200, mid: 300, high: 400, unit: "per unit" },
            "hvac-additional-repairs": { low: 300, mid: 400, high: 500, unit: "per repair" },
            "furnace-mid-efficiency": { low: 1800, mid: 2400, high: 3000, unit: "each" },
            "furnace-high-efficiency": { low: 2500, mid: 3750, high: 5000, unit: "each" },
            "baseboard-heater-electric": { low: 150, mid: 200, high: 250, unit: "each" },
            "hvac-blower-motor": { low: 300, mid: 400, high: 500, unit: "each" },
            "ac-condenser-replace": { low: 800, mid: 1100, high: 1400, unit: "each" },
            "ac-complete-system": { low: 1500, mid: 1750, high: 2000, unit: "per ton" },
            "heat-pump-add": { low: 3000, mid: 3500, high: 4000, unit: "per system" },
            "thermostat-programmable": { low: 150, mid: 225, high: 300, unit: "each" },
            "hvac-air-filter": { low: 25, mid: 37, high: 50, unit: "each" },
            "duct-cleaning": { low: 25, mid: 30, high: 35, unit: "per vent" },
            "duct-replacement": { low: 35, mid: 45, high: 55, unit: "per foot" },
            "air-filter-electric": { low: 500, mid: 650, high: 800, unit: "each" },
            "humidifier-install": { low: 200, mid: 300, high: 400, unit: "each" },

            // PLUMBING
            "plumbing-main-supply-line": { low: 100, mid: 150, high: 200, unit: "per lin ft" },
            "plumbing-main-shutoff": { low: 150, mid: 225, high: 300, unit: "each" },
            "plumbing-pex-piping": { low: 2, mid: 2.75, high: 3.50, unit: "per lin ft" },
            "faucet-repair-leaking": { low: 175, mid: 287, high: 400, unit: "each" },
            "faucet-kitchen-replace": { low: 300, mid: 550, high: 800, unit: "each" },
            "faucet-bathroom-replace": { low: 250, mid: 375, high: 500, unit: "each" },
            "faucet-exterior-replace": { low: 150, mid: 225, high: 300, unit: "each" },
            "toilet-flush-mechanism": { low: 75, mid: 112, high: 150, unit: "each" },
            "toilet-reset": { low: 150, mid: 175, high: 200, unit: "each" },
            "toilet-replace": { low: 250, mid: 300, high: 350, unit: "each" },
            "sink-kitchen-basin": { low: 300, mid: 450, high: 600, unit: "each" },
            "sink-bathroom-basin": { low: 200, mid: 350, high: 500, unit: "each" },
            "laundry-tub-replace": { low: 400, mid: 600, high: 800, unit: "each" },
            "laundry-hookup-install": { low: 900, mid: 1200, high: 1800, unit: "each" },
            "shower-tub-faucet-set": { low: 250, mid: 375, high: 500, unit: "each" },
            "shower-regrout": { low: 300, mid: 650, high: 1000, unit: "per enclosure" },
            "shower-retile": { low: 1000, mid: 1500, high: 2000, unit: "per enclosure" },
            "bathtub-replace-with-tile": { low: 2500, mid: 3500, high: 4500, unit: "each" },
            "shower-pan-replace": { low: 1000, mid: 1500, high: 2000, unit: "each" },
            "shower-stall-fiberglass": { low: 600, mid: 1300, high: 2000, unit: "each" },
            "shower-stall-tile-rebuild": { low: 2500, mid: 4000, high: 5500, unit: "each" },
            "drain-main-line-clear": { low: 250, mid: 275, high: 300, unit: "each" },
            "sewer-line-collapsed": { low: 1000, mid: 2500, high: 5000, unit: "per repair" },
            "sewer-line-replace-full": { low: 3000, mid: 5000, high: 7000, unit: "per home" },
            "drain-unclog": { low: 150, mid: 200, high: 250, unit: "each" },
            "sewer-vent-through-roof": { low: 300, mid: 450, high: 600, unit: "each" },
            "water-heater-tpr-valve": { low: 150, mid: 175, high: 200, unit: "each" },
            "water-heater-flue-vent": { low: 150, mid: 225, high: 300, unit: "each" },
            "water-heater-drain-pan": { low: 200, mid: 250, high: 300, unit: "each" },
            "water-heater-drain-exterior": { low: 200, mid: 250, high: 300, unit: "each" },
            "water-heater-expansion-tank": { low: 250, mid: 325, high: 400, unit: "each" },
            "water-heater-tank-install": { low: 800, mid: 1000, high: 1200, unit: "each" },
            "water-heater-tankless-install": { low: 3000, mid: 3500, high: 4000, unit: "each" },

            // APPLIANCES
            "appliance-dishwasher": { low: 400, mid: 600, high: 800, unit: "each" },
            "appliance-garbage-disposal": { low: 200, mid: 250, high: 300, unit: "each" },
            "appliance-cooktop-gas": { low: 650, mid: 825, high: 1000, unit: "each" },
            "appliance-cooktop-electric": { low: 400, mid: 500, high: 600, unit: "each" },
            "appliance-oven-builtin": { low: 600, mid: 2000, high: 10000, unit: "each" },
            "appliance-range-freestanding": { low: 400, mid: 1100, high: 1800, unit: "each" },
            "appliance-microwave-builtin": { low: 400, mid: 575, high: 750, unit: "each" },
            "appliance-refrigerator": { low: 400, mid: 800, high: 1200, unit: "each" },
            "appliance-trash-compactor": { low: 600, mid: 800, high: 1000, unit: "each" },
            "exhaust-bathroom-fan": { low: 300, mid: 400, high: 500, unit: "each" },
            "range-hood-recirculating": { low: 200, mid: 250, high: 300, unit: "each" },
            "range-hood-exterior": { low: 300, mid: 400, high: 500, unit: "each" },
            "dryer-exhaust-exterior": { low: 200, mid: 350, high: 500, unit: "each" },

            // RENOVATIONS
            "remodel-kitchen-standard": { low: 8000, mid: 15000, high: 25000, unit: "per kitchen" },
            "kitchen-cabinets-install": { low: 150, mid: 200, high: 250, unit: "per lin ft" },
            "kitchen-countertop-install": { low: 25, mid: 30, high: 35, unit: "per lin ft" },
            "remodel-bathroom-4piece": { low: 6000, mid: 10000, high: 18000, unit: "per bath" },
            "remodel-bathroom-hall": { low: 4000, mid: 7000, high: 12000, unit: "per bath" },
            "room-addition": { low: 125, mid: 187, high: 250, unit: "per sqft" },
            "additional-story": { low: 100, mid: 150, high: 200, unit: "per sqft" },
            "attic-finish-out": { low: 12000, mid: 21000, high: 30000, unit: "per project" },
            "wall-remove-load-bearing": { low: 2000, mid: 4000, high: 8000, unit: "each" },
            "wall-remove-partition": { low: 500, mid: 750, high: 1000, unit: "each" },
            "interior-door-opening": { low: 500, mid: 750, high: 1000, unit: "each" },

            // IRRIGATION / LANDSCAPE
            "irrigation-leak-repair": { low: 150, mid: 200, high: 250, unit: "each" },
            "irrigation-head-replace": { low: 10, mid: 15, high: 20, unit: "each" },
            "irrigation-zone-repair": { low: 20, mid: 30, high: 40, unit: "per zone" },
            "irrigation-control-panel": { low: 150, mid: 200, high: 250, unit: "each" },
            "irrigation-backflow-prevent": { low: 300, mid: 400, high: 500, unit: "each" },
            "irrigation-system-install": { low: 1000, mid: 2000, high: 4000, unit: "per system" },

            // POOLS & SPAS
            "pool-cleaning-onetime": { low: 200, mid: 300, high: 400, unit: "each" },
            "pool-monthly-service": { low: 150, mid: 200, high: 250, unit: "per month" },
            "pool-leak-detection": { low: 300, mid: 350, high: 400, unit: "each" },
            "pool-resurface-plaster": { low: 7000, mid: 7500, high: 8000, unit: "per 15x30 pool" },
            "pool-circulating-pump": { low: 200, mid: 500, high: 800, unit: "each" },
            "pool-filter-replace": { low: 600, mid: 800, high: 1000, unit: "each" },
            "pool-heater-replace": { low: 1500, mid: 2500, high: 3500, unit: "each" },
            "pool-gfci-install": { low: 150, mid: 175, high: 200, unit: "each" },
            "pool-light-replace": { low: 200, mid: 250, high: 300, unit: "each" },

            // SEPTIC SYSTEMS
            "septic-pump-tank": { low: 350, mid: 412, high: 475, unit: "per tank" },
            "septic-baffle-repair": { low: 300, mid: 400, high: 500, unit: "each" },
            "septic-fracture-repair": { low: 850, mid: 1175, high: 1500, unit: "each" },
            "septic-tank-replace": { low: 2500, mid: 3750, high: 5000, unit: "each" },
            "septic-drain-field-repair": { low: 500, mid: 2250, high: 4000, unit: "each" },
            "septic-new-system": { low: 3000, mid: 5500, high: 8000, unit: "per system" },

            // WATER WELLS
            "well-pump-shallow": { low: 1000, mid: 1250, high: 1500, unit: "each" },
            "well-pump-deep": { low: 2000, mid: 2500, high: 3000, unit: "each" },
            "well-bladder-tank": { low: 500, mid: 750, high: 1000, unit: "each" },
            "well-water-test": { low: 150, mid: 150, high: 200, unit: "per sample" },
            "well-shock-treatment": { low: 100, mid: 150, high: 200, unit: "each" },

            // SMALL ITEMS & HARDWARE
            "outlet-cover-plate": { low: 1, mid: 2, high: 5, unit: "each" },
            "switch-cover-plate": { low: 1, mid: 2, high: 5, unit: "each" },
            "electrical-cover-blank": { low: 1, mid: 2, high: 5, unit: "each" },
            "toilet-seat": { low: 15, mid: 30, high: 65, unit: "each" },
            "doorknob-interior": { low: 10, mid: 20, high: 45, unit: "each" },
            "deadbolt": { low: 20, mid: 40, high: 85, unit: "each" },
            "door-hinge": { low: 4, mid: 8, high: 15, unit: "each" },
            "door-stop": { low: 2, mid: 5, high: 10, unit: "each" },
            "cabinet-knob": { low: 2, mid: 5, high: 12, unit: "each" },
            "cabinet-pull": { low: 3, mid: 7, high: 15, unit: "each" },
            "towel-bar": { low: 10, mid: 20, high: 45, unit: "each" },
            "toilet-paper-holder": { low: 8, mid: 15, high: 35, unit: "each" },
            "shower-head": { low: 15, mid: 30, high: 80, unit: "each" },
            "shower-curtain-rod": { low: 10, mid: 20, high: 45, unit: "each" },
            "caulking-tub-shower": { low: 5, mid: 15, high: 30, unit: "per bath" },
            "caulking-sink": { low: 5, mid: 12, high: 25, unit: "each" },
            "window-blinds": { low: 10, mid: 25, high: 60, unit: "per window" },
            "window-screen": { low: 8, mid: 18, high: 40, unit: "each" },
            "closet-rod-shelf": { low: 12, mid: 25, high: 50, unit: "each" },
            "light-bulb": { low: 2, mid: 5, high: 12, unit: "each" },
            "weather-stripping": { low: 5, mid: 12, high: 25, unit: "per door" },
            "door-sweep": { low: 8, mid: 15, high: 30, unit: "each" },
            "house-numbers": { low: 5, mid: 12, high: 25, unit: "set" },
            "mailbox": { low: 15, mid: 35, high: 80, unit: "each" },
            "dryer-vent-hose": { low: 10, mid: 20, high: 40, unit: "each" },
            "range-drip-pans": { low: 8, mid: 15, high: 25, unit: "set of 4" },
            "toilet-flapper": { low: 5, mid: 10, high: 20, unit: "each" },
            "toilet-fill-valve": { low: 8, mid: 15, high: 30, unit: "each" },
            "faucet-aerator": { low: 3, mid: 8, high: 15, unit: "each" },
            "p-trap": { low: 250, mid: 300, high: 350, unit: "each" },
            "register-vent-cover": { low: 5, mid: 10, high: 25, unit: "each" },
            "threshold-transition-strip": { low: 8, mid: 15, high: 30, unit: "each" },
            "baseboard-trim-repair": { low: 3, mid: 6, high: 12, unit: "per lin ft" },
            "tile-grout-repair": { low: 300, mid: 650, high: 1000, unit: "per enclosure" },
            "mirror-bathroom": { low: 20, mid: 45, high: 100, unit: "each" },
            "curtain-rod": { low: 10, mid: 22, high: 50, unit: "each" },
            "shelf-bracket": { low: 3, mid: 8, high: 15, unit: "each" },

            // MISCELLANEOUS / SAFETY
            "fire-burglar-alarm": { low: 1000, mid: 1500, high: 2500, unit: "per system" },
            "outdoor-living-area": { low: 5000, mid: 10000, high: 20000, unit: "per project" },
            "demolish-remove-garage": { low: 2500, mid: 4000, high: 6000, unit: "per structure" }
        };

        const prompt = `
       You are an expert real estate general contractor and estimator using a strict "Service SOW" pricing structure.
       Analyze these property interior/exterior photos and generate a DETAILED rehab estimate.

       CRITICAL PRICING RULES:
       Reference this internal Cost Database for all line items. Use the 'mid' range as default unless the condition warrants 'high' (luxury) or 'low' (economy).
       ${JSON.stringify(LOCAL_COST_DB)}

       PROPERTY CONTEXT:
       ${sqft ? `Total Square Footage: ${sqft} sqft (Use this for all per-sqft calculations unless a specific room size is visually evident)` : `Total Square Footage: UNKNOWN (Estimate based on visual evidence)`}

       SCALING RULES FOR ACCURACY:
       1. IF TOTAL SQFT IS KNOWN (${sqft || 'unknown'}):
          - For holistic items like "Full Interior Paint", "Flooring Replacement", "Roofing", assume reasonable coverage based on typical home layouts if precise room dimensions aren't visible.
          - Example: If total sqft is 2000, assume ~80% requires flooring if replacing all.
       2. EXTERIOR PHOTOS:
          - If valid exterior photos are present, identify facade material (Brick, Vinyl, Wood) and roof type.
          - Suggest "Exterior Paint/Power Wash" or "Roof Tune-up" if needed.
       3. INTERIOR PHOTOS:
          - Identify specific room (Kitchen, Bath, Bed).
          - If "Kitchen" or "Bath" needs remodel, use the 'per kitchen' or 'per bath' line items if the scope is major.

       For each room/area visible:
       1. Identify defects and outdated items.
       2. RECOMMEND renovations to bring it to "Market Standard" (Flip grade).
       3. ASSIGN COSTS from the database. If an item isn't in the DB, estimate conservatively based on US National Averages for 2024.
       4. LIST ASSUMPTIONS: Explicitly state any estimates made due to lack of photo visibility (e.g. sqft assumptions).
       5. PROVIDE STRATEGY: Compare BRRRR (Buy, Rehab, Rent, Refinance, Repeat) vs FLIP suitability based on the renovation scope and typical returns for this finish level.
       6. DEFINE POSITIONING: How should this asset be positioned in the market? (e.g. "Entry-level luxury", "Workforce housing", etc.)
       7. MAP IMAGE INDEX: Which image index (0-based) from the provided list corresponds to this room?

       Return ONLY a JSON object with this structure:
       {
         "overall_difficulty": "1-5 scale",
         "total_estimated_cost": number,
         "assumptions_and_notes": [
            "Assumed 2,500 sqft based on visual estimation...",
            "Assuming existing plumbing is functional behind walls...",
            "Unknown: Foundation condition not visible in photos."
         ],
         "strategy_analysis": {
             "brrrr_strategy": "Keep and refinance. The high rental demand...",
             "flip_strategy": "Sell immediately. The margin is thin...",
             "recommendation": "BRRRR or FLIP",
             "market_positioning": "Target young professionals..."
         },
         "room_breakdowns": [
           { 
             "room": "Kitchen", 
             "source_image_index": 0,
             "observations": "Old oak cabinets, laminate counters...", 
             "recommended_action": "Paint cabinets, replace counters...", 
             "line_items": [
                { "item": "Cabinet Painting", "cost": 1200, "unit": "lump sum" },
                { "item": "Quartz Countertops", "cost": 3500, "unit": "40 sqft" }
             ],
             "room_total": 4700 
           }
         ],
         "hidden_damage_warnings": ["Potential plumbing issues..."],
         "summary_description": "Brief professional summary of the project scope."
       }
     `;

        // Process images
        const imageParts = await Promise.all(imageUrls.map(async (url: string) => {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Chunk-safe base64 conversion
            let binary = '';
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64 = btoa(binary);

            return { inlineData: { data: base64, mimeType: "image/jpeg" } };
        }));

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();
        console.log("Gemini Response:", responseText);

        const analysis = JSON.parse(responseText);

        // Save back to PropControl Database if propertyId is provided (it might not be if running from standalone page without a saved lead yet)
        if (propertyId) {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const { error } = await supabase
                .from('leads')
                .update({ detailed_rehab_budget: analysis })
                .eq('id', propertyId);

            if (error) console.error("Error saving to DB:", error);
        }

        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
