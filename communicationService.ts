
/**
 * PropControl Communication Service
 * Handles real-world integration with Twilio (Voice & SMS) and Resend (Email)
 */

const TWILIO_SID = import.meta.env.VITE_TWILIO_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const FROM_EMAIL = 'onboarding@resend.dev';


/**
 * Places a real phone call using Twilio's Programmable Voice API.
 * FALLBACK: If credentials are missing, simulates the call for demo purposes.
 */
export async function placeActualPhoneCall(to: string, vendorName: string, script: string) {
  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
    console.warn(`[SIMULATION] Twilio credentials missing. Simulating call to ${to} (${vendorName}).`);
    console.log(`[SIMULATION] Script: "${script}"`);
    return {
      sid: `SIMULATED_CALL_${Date.now()}`,
      status: 'queued',
      simulation: true
    };
  }

  const auth = btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`);
  const twiml = `<Response><Say voice="Polly.Joey">${script}</Say><Pause length="1"/><Say>Thank you for your service. Goodbye.</Say></Response>`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', TWILIO_PHONE_NUMBER);
  params.append('Twiml', twiml);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Twilio API Error');
  return data;
}

/**
 * Sends a real SMS via Twilio's Messaging API.
 * FALLBACK: If credentials are missing, simulates the SMS for demo purposes.
 */
export async function sendActualSMS(to: string, message: string) {
  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
    console.warn(`[SIMULATION] Twilio credentials missing. Simulating SMS to ${to}.`);
    console.log(`[SIMULATION] Body: "${message}"`);
    return {
      sid: `SIMULATED_SMS_${Date.now()}`,
      status: 'queued',
      simulation: true
    };
  }

  const auth = btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`);
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', TWILIO_PHONE_NUMBER);
  params.append('Body', message);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Twilio SMS Error');
  return data;
}

/**
 * Sends a professional email via Resend's REST API.
 * FALLBACK: If credentials are missing, simulates the email for demo purposes.
 */
export async function sendActualEmail(to: string, subject: string, body: string) {
  if (!RESEND_API_KEY) {
    console.warn(`[SIMULATION] Resend API Key missing. Simulating email to ${to}.`);
    console.log(`[SIMULATION] Subject: "${subject}"`);
    return {
      id: `SIMULATED_EMAIL_${Date.now()}`,
      simulation: true
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: `PropControl AI <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155;">
          <h2 style="color: #4f46e5;">PropControl Dispatch Notification</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
            This is an automated operational message from the PropControl Platform.
          </p>
        </div>
      `
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Resend error ${response.status}`);
  return data;
}
