export const twilioConfigs: Record<string, { from: string; accountSid: string; authToken: string }> = {
  barberiaA: {
    from: process.env.TWILIO_WHATSAPP_FROM_A || 'whatsapp:+14155238886',
    accountSid: process.env.TWILIO_SID_A || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_TOKEN_A || process.env.TWILIO_AUTH_TOKEN || ''
  },
  barberiaB: {
    from: process.env.TWILIO_WHATSAPP_FROM_B || 'whatsapp:+14155238886',
    accountSid: process.env.TWILIO_SID_B || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_TOKEN_B || process.env.TWILIO_AUTH_TOKEN || ''
  },
  barberiaC: {
    from: process.env.TWILIO_WHATSAPP_FROM_C || 'whatsapp:+14155238886',
    accountSid: process.env.TWILIO_SID_C || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_TOKEN_C || process.env.TWILIO_AUTH_TOKEN || ''
  }
};
