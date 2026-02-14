
import { PlanTier } from '../types';

export interface PlanFeature {
    id: string;
    name: string;
    priceId: string; // Stripe Price ID (Test Mode Mock)
    price: string;
    maxAssets: number;
    features: string[];
    aiAccess: boolean;
}

export const PLANS: Record<PlanTier, {
    name: string;
    price: string;
    priceId: string; // Default monthly
    priceIds: { monthly: string; annual: string };
    maxAssets: number;
    maxTenants: number;
    features: string[];
    aiAccess: boolean;
    color: string;
}> = {
    FREE: { // Maps to "Starter"
        name: 'Starter',
        price: '$0',
        priceId: '',
        priceIds: { monthly: '', annual: '' },
        maxAssets: 10,
        maxTenants: 50,
        features: [
            '10 Units',
            '50 Tenants',
            'Property Health Score',
            'Visual/Real-Time KPI Reporting',
            'Community Support'
        ],
        aiAccess: false,
        color: 'slate'
    },
    GROWTH: {
        name: 'Growth',
        price: '$19',
        priceId: 'price_1SuMfbKrduQQtKdTGgsHMMMa',
        priceIds: {
            monthly: 'price_1SuMfbKrduQQtKdTGgsHMMMa',
            annual: 'price_1SuMiwKrduQQtKdTeDYVadDY'
        },
        maxAssets: 100,
        maxTenants: 200,
        features: [
            '100 Units',
            '200 Tenants',
            'Manual Inbox & Work Orders',
            'Full Operations Suite',
            'Service SOW Generator',
            'Operations Audit',
            'Priority Support'
        ],
        aiAccess: true, // Limited AI
        color: 'amber'
    },
    PRO: {
        name: 'Pro',
        price: '$39', // Founder's Pricing (was $49)
        priceId: 'price_1T0DtYKrduQQtKdTEUIxM1cM',
        priceIds: {
            monthly: 'price_1T0DtYKrduQQtKdTEUIxM1cM',
            annual: 'price_1SuMkWKrduQQtKdT51Fxui5e' // TODO: Update annual if needed
        },
        maxAssets: 9999,
        maxTenants: 9999,
        features: [
            'Unlimited Units',
            'Unlimited Tenants',
            'Neural Predictor',
            'Visual SOW Generator (50/mo)', // Added usage cap note
            'AI Interior Design',
            'Operations Ledger',
            'Dedicated Account Manager'
        ],
        aiAccess: true,
        color: 'indigo'
    },
    PRO_MAX: {
        name: 'Pro Max',
        price: '$79', // Founder's Pricing (was $99)
        priceId: 'price_1T0DqzKrduQQtKdTkl1cgzAC',
        priceIds: {
            monthly: 'price_1T0DqzKrduQQtKdTkl1cgzAC',
            annual: '' // Add annual when available
        },
        maxAssets: 99999,
        maxTenants: 99999,
        features: [
            'Everything in Pro',
            'Investment Analysis Tab',
            'Market Intel',
            'JV Payout Engine',
            'Underwriting Suite',
            'Rehab Studio',
            'Loan Pitch Generator'
        ],
        aiAccess: true,
        color: 'emerald'
    }
};

