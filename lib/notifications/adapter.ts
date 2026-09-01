import 'server-only';

/**
 * Notification adapter abstraction. The MVP ships only a no-op adapter that
 * logs intent to notification_log without actually sending anything — real
 * delivery (SendGrid for email, Twilio for SMS) is future work, gated
 * entirely behind env vars so nothing here needs credentials to run.
 *
 * To wire up a real provider later: implement NotificationAdapter (send()),
 * add it to the switch in getNotificationAdapter(), and set the matching
 * env var(s) from .env.example. No call site changes required.
 */

export interface NotificationPayload {
  channel: 'email' | 'sms';
  template: string;
  recipient: string;
  appointmentId?: string;
  eventRegistrationId?: string;
  data: Record<string, unknown>;
}

export interface NotificationResult {
  status: 'sent' | 'failed' | 'skipped';
  provider: string;
  errorMessage?: string;
}

export interface NotificationAdapter {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

class NoopNotificationAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // eslint-disable-next-line no-console
    console.warn(
      `[notifications] ${payload.channel}:${payload.template} -> ${payload.recipient} (no provider configured, not sent)`,
    );
    return { status: 'skipped', provider: 'none' };
  }
}

let cachedAdapter: NotificationAdapter | null = null;

export function getNotificationAdapter(channel: 'email' | 'sms'): NotificationAdapter {
  if (channel === 'email' && process.env.SENDGRID_API_KEY) {
    // Future: return new SendGridAdapter(process.env.SENDGRID_API_KEY);
  }
  if (channel === 'sms' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // Future: return new TwilioAdapter(...);
  }
  cachedAdapter ??= new NoopNotificationAdapter();
  return cachedAdapter;
}
