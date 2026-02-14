
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

// ── Price ID → Plan mapping (mirrors create-checkout/index.ts) ──────────
const PRICE_TO_PLAN: Record<string, string> = {
    // GROWTH
    'price_1SuMfbKrduQQtKdTGgsHMMMa': 'GROWTH',  // monthly
    'price_1SuMiwKrduQQtKdTeDYVadDY': 'GROWTH',  // annual
    // PRO
    'price_1T0DtYKrduQQtKdTEUIxM1cM': 'PRO',     // monthly
    'price_1SuMkWKrduQQtKdT51Fxui5e': 'PRO',     // annual
    // PRO_MAX
    'price_1T0DqzKrduQQtKdTkl1cgzAC': 'PRO_MAX', // monthly
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── 1. Verify Configuration ────────────────────────────────────
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        if (!stripeKey) {
            console.error('Missing STRIPE_SECRET_KEY')
            return new Response('Server configuration error', { status: 500 })
        }
        if (!webhookSecret) {
            console.error('Missing STRIPE_WEBHOOK_SECRET')
            return new Response('Server configuration error', { status: 500 })
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // ── 2. Verify Webhook Signature ────────────────────────────────
        const body = await req.text()
        const signature = req.headers.get('stripe-signature')

        if (!signature) {
            console.error('Missing stripe-signature header')
            return new Response('Missing signature', { status: 400 })
        }

        let event: Stripe.Event
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message)
            return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        console.log(`Received event: ${event.type} (${event.id})`)

        // ── 3. Init Supabase Admin Client (bypasses RLS) ───────────────
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // ── 4. Handle Events ───────────────────────────────────────────
        switch (event.type) {

            // ─── Checkout completed → activate subscription ────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session

                if (session.mode !== 'subscription' || !session.subscription || !session.customer) {
                    console.log('Skipping non-subscription checkout session')
                    break
                }

                const customerId = typeof session.customer === 'string'
                    ? session.customer
                    : session.customer.id

                const subscriptionId = typeof session.subscription === 'string'
                    ? session.subscription
                    : session.subscription.id

                // Fetch full subscription to get price & period info
                const subscription = await stripe.subscriptions.retrieve(subscriptionId)
                const priceId = subscription.items.data[0]?.price?.id ?? ''
                const plan = PRICE_TO_PLAN[priceId] || 'FREE'

                console.log(`Checkout completed: customer=${customerId}, plan=${plan}, priceId=${priceId}`)

                // Find user by stripe_customer_id
                const { data: profile, error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profileError || !profile) {
                    console.error('Could not find profile for customer:', customerId, profileError)
                    break
                }

                // Update profile
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        plan,
                        subscription_status: 'active',
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq('id', profile.id)

                if (updateError) {
                    console.error('Failed to update profile:', updateError)
                }

                // Upsert subscription record
                await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        id: subscriptionId,
                        user_id: profile.id,
                        status: subscription.status,
                        price_id: priceId,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        created_at: new Date(subscription.created * 1000).toISOString(),
                    }, { onConflict: 'id' })

                console.log(`Profile ${profile.id} activated → ${plan}`)
                break
            }

            // ─── Subscription updated (upgrade/downgrade/renewal) ──────
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription

                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id

                const priceId = subscription.items.data[0]?.price?.id ?? ''
                const plan = PRICE_TO_PLAN[priceId] || 'FREE'

                console.log(`Subscription updated: customer=${customerId}, status=${subscription.status}, plan=${plan}`)

                const { data: profile, error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profileError || !profile) {
                    console.error('Could not find profile for customer:', customerId, profileError)
                    break
                }

                // Map Stripe status to our status
                let subscriptionStatus = subscription.status // active, past_due, canceled, etc.
                if (subscription.cancel_at_period_end) {
                    subscriptionStatus = 'canceling' // Will cancel at period end
                }

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        plan,
                        subscription_status: subscriptionStatus,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq('id', profile.id)

                // Sync subscriptions table
                await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        id: subscription.id,
                        user_id: profile.id,
                        status: subscriptionStatus,
                        price_id: priceId,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                    }, { onConflict: 'id' })

                console.log(`Profile ${profile.id} updated → ${plan} (${subscriptionStatus})`)
                break
            }

            // ─── Subscription deleted (fully canceled) ─────────────────
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id

                console.log(`Subscription deleted: customer=${customerId}`)

                const { data: profile, error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profileError || !profile) {
                    console.error('Could not find profile for customer:', customerId, profileError)
                    break
                }

                // Downgrade to FREE
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        plan: 'FREE',
                        subscription_status: 'canceled',
                        current_period_end: null,
                    })
                    .eq('id', profile.id)

                // Update subscriptions table
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        ended_at: new Date().toISOString(),
                    })
                    .eq('id', subscription.id)

                console.log(`Profile ${profile.id} downgraded → FREE (canceled)`)
                break
            }

            // ─── Payment failed ────────────────────────────────────────
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice

                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : (invoice.customer as any)?.id

                if (!customerId) {
                    console.error('No customer ID on failed invoice')
                    break
                }

                console.log(`Payment failed: customer=${customerId}`)

                const { data: profile, error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (profileError || !profile) {
                    console.error('Could not find profile for customer:', customerId, profileError)
                    break
                }

                await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_status: 'past_due' })
                    .eq('id', profile.id)

                console.log(`Profile ${profile.id} marked as past_due`)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        // ── 5. Always return 200 to acknowledge receipt ────────────────
        return new Response(
            JSON.stringify({ received: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error('Webhook handler error:', error)
        // Still return 200 to prevent Stripe from retrying and eventually
        // disabling the endpoint again. Log the error for debugging.
        return new Response(
            JSON.stringify({ received: true, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    }
})
