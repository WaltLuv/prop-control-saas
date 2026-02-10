
import { supabase } from './supabase';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

/**
 * Extracts the real error message from a Supabase Edge Function error.
 * The generic "non-2xx" message is useless — the real error is in error.context.
 */
const extractEdgeFunctionError = async (error: any): Promise<string> => {
    if (error instanceof FunctionsHttpError) {
        try {
            const errorBody = await error.context.json();
            return errorBody?.error || errorBody?.message || error.message;
        } catch {
            return error.message;
        }
    }
    if (error instanceof FunctionsRelayError) {
        return `Relay error: ${error.message}`;
    }
    if (error instanceof FunctionsFetchError) {
        return `Network error: ${error.message}`;
    }
    return error?.message || "Unknown error";
};

/**
 * Creates a Stripe Checkout Session via Supabase Edge Function.
 */
export const createCheckoutSession = async (priceId: string, plan?: string) => {
    console.log("Invoking create-checkout Edge Function...", { priceId, plan });

    const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, plan }
    });

    if (error) {
        const realMessage = await extractEdgeFunctionError(error);
        console.error("Edge Function Error:", realMessage, { error, data });
        throw new Error(realMessage);
    }

    if (!data?.url) {
        console.error("Unexpected response from create-checkout:", data);
        throw new Error(data?.error || "No checkout URL returned from backend");
    }

    window.location.href = data.url;
};

export const redirectToCustomerPortal = async () => {
    try {
        const { data, error } = await supabase.functions.invoke('customer-portal');

        if (error) {
            const realMessage = await extractEdgeFunctionError(error);
            console.error("Customer Portal Error:", realMessage, { error, data });
            throw new Error(realMessage);
        }

        if (data?.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data?.error || "Could not get portal URL");
        }
    } catch (error) {
        console.error('Error redirecting to portal:', error);
        alert(error instanceof Error ? error.message : 'Error accessing billing portal');
    }
};
