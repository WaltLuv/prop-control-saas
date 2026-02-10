
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLANS = {
    GROWTH: {
        stripePriceIds: {
            monthly: 'price_1SuMfbKrduQQtKdTGgsHMMMa',
            annual: 'price_1SuMiwKrduQQtKdTeDYVadDY',
        }
    },
    PRO: {
        stripePriceIds: {
            monthly: 'price_1SuMnMKrduQQtKdTNtGJmhtq',
            annual: 'price_1SuMkWKrduQQtKdT51Fxui5e',
        }
    },
    PRO_MAX: {
        stripePriceIds: {
            monthly: 'price_1SwVpQKrduQQtKdTtWPT4DSL',
            annual: '', // Add annual if available
        }
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Admin client for profile operations (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const { plan, priceId } = await req.json()

        // 1. Get or Create Customer
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let customerId = profile?.stripe_customer_id

        if (!customerId) {
            console.log("Creating new Stripe customer for", user.email);
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            });
            customerId = customer.id;

            // Save to Supabase (using admin to bypass RLS)
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: user.id,
                    stripe_customer_id: customerId,
                    email: user.email
                }, { onConflict: 'id' })
        }

        // 2. Determine Price ID
        // Use direct priceId if provided, otherwise look up by plan name
        let finalPriceId = priceId;

        if (!finalPriceId && plan) {
            const planKey = plan.toUpperCase();
            const planConfig = PLANS[planKey as keyof typeof PLANS];
            if (planConfig) {
                finalPriceId = planConfig.stripePriceIds.monthly;
            }
        }

        if (!finalPriceId) {
            throw new Error("Price ID is required. Please provide a priceId or a valid plan name (GROWTH, PRO, PRO_MAX).");
        }

        // 3. Create Checkout Session
        console.log("Creating checkout session for", customerId, finalPriceId);

        // Get Origin for redirect (default to localhost if not provided in headers, but typically Referer)
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
