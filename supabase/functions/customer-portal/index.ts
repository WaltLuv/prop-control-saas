
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify Configuration
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            console.error("Missing STRIPE_SECRET_KEY in Edge Function secrets.");
            throw new Error("Server configuration error: Missing Stripe Key");
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 2. Initialize Supabase Clients
        // User client for auth verification
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Admin client for profile lookup (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // 3. Authenticate User
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error("Auth Error:", authError);
            throw new Error('Unauthorized');
        }

        console.log(`Processing portal request for user: ${user.id}`);

        // 4. Get Customer ID from profiles (using admin client to bypass RLS)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error("Profile Fetch Error:", profileError);
            if (profileError.code !== 'PGRST116') {
                throw new Error(`Database error: ${profileError.message}`);
            }
        }

        const customerId = profile?.stripe_customer_id

        if (!customerId) {
            console.error("No Stripe customer ID found for user:", user.id);
            throw new Error('No subscription found. Please subscribe first.');
        }

        console.log(`Creating portal session for customer: ${customerId}`);

        // 5. Create Billing Portal Session
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/`,
        })

        if (!session?.url) {
            throw new Error("Failed to create portal session URL");
        }

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error("Edge Function Error:", error);

        // Return JSON error even for 500s/unexpected errors
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400, // Returning 400 ensures client 'invoke' sees the error body, whereas 500 might be opaque
            }
        )
    }
})
