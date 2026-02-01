
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe with your Publishable Key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Creates a Stripe Checkout Session via Supabase Edge Function.
 * This is the secure, real-world implementation replacing the client-side mock.
 */
export const createCheckoutSession = async (priceId: string) => {
    console.log("Invoking create-checkout Edge Function...");

    const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Failed to create checkout session");
    }

    if (!data?.url) {
        throw new Error("No checkout URL returned from backend");
    }

    // Redirect to the Stripe hosted checkout page
    window.location.href = data.url;
};

export const redirectToCustomerPortal = async () => {
    try {
        const { data, error } = await supabase.functions.invoke('customer-portal');

        if (error) throw error;
        if (data?.url) {
            window.location.href = data.url;
        } else {
            throw new Error('Could not get portal URL');
        }
    } catch (error) {
        console.error('Error redirecting to portal:', error);
        alert(error instanceof Error ? error.message : 'Error accessing billing portal');
    }
};

export default stripePromise;
