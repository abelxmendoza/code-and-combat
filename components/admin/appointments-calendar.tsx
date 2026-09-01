'use client';

import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import withDragAndDrop, { type withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { adminRescheduleAppointment } from '@/lib/actions/admin-appointments';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCalendarView } from '@/store/adminSlice';
import type { CalendarEventDto } from '@/lib/db/admin-calendar';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  category: 'code' | 'combat';
}

const DnDCalendar = withDragAndDrop<CalEvent>(Calendar);

export function AppointmentsCalendar({ events }: { events: CalendarEventDto[] }) {
  const router = useRouter();
  // Calendar view mode is shared admin UI state (Redux), not per-component
  // local state — it's meant to persist as the admin navigates the
  // dashboard within a session. The current visible date is genuinely
  // ephemeral navigation state, so that stays local.
  const dispatch = useAppDispatch();
  const view = useAppSelector((s) => s.admin.calendarView) as View;
  const [date, setDate] = useState(new Date());

  const calEvents: CalEvent[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        status: e.status,
        category: e.category,
      })),
    [events],
  );

  const handleEventDrop: withDragAndDropProps<CalEvent>['onEventDrop'] = async ({ event, start }) => {
    const startDate = start instanceof Date ? start : new Date(start);
    const result = await adminRescheduleAppointment(event.id, startDate.toISOString());
    if (!result.success) {
      toast({ title: 'Could not reschedule', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Appointment rescheduled', variant: 'success' });
    router.refresh();
  };

  return (
    <div className="cb-calendar" style={{ height: 720 }}>
      <DnDCalendar
        localizer={localizer}
        events={calEvents}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={(nextView) => dispatch(setCalendarView(nextView as 'month' | 'week' | 'agenda'))}
        date={date}
        onNavigate={setDate}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventDrop}
        resizable
        draggableAccessor={(event) => event.status === 'pending' || event.status === 'confirmed'}
        eventPropGetter={(event) => ({
          className: event.category === 'combat' ? 'cb-event-combat' : 'cb-event-code',
        })}
      />
    </div>
  );
}
