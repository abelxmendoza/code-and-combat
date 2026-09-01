import 'server-only';

/**
 * Google Calendar sync abstraction. Not implemented in the MVP — booking
 * still works fully without it (clients get an .ics download instead). Wire
 * up a real adapter by implementing CalendarSyncAdapter and returning it
 * from getCalendarSyncAdapter() once GOOGLE_CALENDAR_CLIENT_ID /
 * GOOGLE_CALENDAR_CLIENT_SECRET are set (see .env.example).
 */

export interface CalendarSyncEvent {
  externalId: string; // our appointment id or event id
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
}

export interface CalendarSyncAdapter {
  createEvent(event: CalendarSyncEvent): Promise<{ synced: boolean; providerEventId?: string }>;
  deleteEvent(externalId: string): Promise<{ synced: boolean }>;
}

class NoopCalendarSyncAdapter implements CalendarSyncAdapter {
  async createEvent(): Promise<{ synced: boolean }> {
    return { synced: false };
  }
  async deleteEvent(): Promise<{ synced: boolean }> {
    return { synced: false };
  }
}

export function getCalendarSyncAdapter(): CalendarSyncAdapter {
  if (process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
    // Future: return new GoogleCalendarAdapter(...);
  }
  return new NoopCalendarSyncAdapter();
}
