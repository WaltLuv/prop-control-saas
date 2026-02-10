/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_KIMI_API_KEY: string
    readonly VITE_TWILIO_SID: string
    readonly VITE_TWILIO_AUTH_TOKEN: string
    readonly VITE_TWILIO_PHONE_NUMBER: string
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
