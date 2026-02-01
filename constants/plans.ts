
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
        maxAssets: 1,
        maxTenants: 10,
        features: [
            '1 Property',
            '10 Tenants',
            'Basic Reporting',
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
        maxAssets: 10,
        maxTenants: 50,
        features: [
            '10 Properties',
            '50 Tenants',
            'Service SOW Generator',
            'Operations Audit',
            'Alex A.I. Assistant',
            'Priority Support'
        ],
        aiAccess: true, // Limited AI
        color: 'amber'
    },
    PRO: {
        name: 'Pro',
        price: '$49',
        priceId: 'price_1SuMnMKrduQQtKdTNtGJmhtq',
        priceIds: {
            monthly: 'price_1SuMnMKrduQQtKdTNtGJmhtq',
            annual: 'price_1SuMkWKrduQQtKdT51Fxui5e'
        },
        maxAssets: 9999,
        maxTenants: 9999,
        features: [
            'Unlimited Properties',
            'Unlimited Tenants',
            'Work Order Management',
            'Neural Predictor',
            'Visual SOW Generator',
            'Manual AI Inbox',
            'Operations Ledger',
            'Dedicated Account Manager'
        ],
        aiAccess: true,
        color: 'indigo'
    },
    PRO_MAX: {
        name: 'Pro Max',
        price: '$99',
        priceId: 'price_PRO_MAX_MONTHLY_PLACEHOLDER', // Placeholder
        priceIds: {
            monthly: 'price_PRO_MAX_MONTHLY_PLACEHOLDER',
            annual: 'price_PRO_MAX_ANNUAL_PLACEHOLDER'
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
