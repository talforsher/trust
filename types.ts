export interface TwilioWhatsAppWebhookBody {
  Body?: string; // The message content
  From: string; // The WhatsApp number in format 'whatsapp:+1234567890'
  To: string; // The Twilio WhatsApp number
  SmsMessageSid: string; // Unique identifier for the message
  NumMedia?: string; // Number of media attachments
  ProfileName?: string; // WhatsApp profile name of the sender
  SmsSid: string; // Same as SmsMessageSid
  WaId: string; // WhatsApp ID of the sender
  SmsStatus: string; // Status of the message
  AccountSid: string; // Your Twilio account SID
}
