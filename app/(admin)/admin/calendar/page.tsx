import { getCalendarAppointments } from '@/lib/db/admin-calendar';
import { AppointmentsCalendar } from '@/components/admin/appointments-calendar';

export default async function AdminCalendarPage() {
  const events = await getCalendarAppointments();

  return (
    <div>
      <h1 className="mb-2 text-cb-bone">Calendar</h1>
      <p className="mb-6 text-cb-gray">Drag a session to reschedule it — conflicts and availability are re-validated automatically.</p>
      <AppointmentsCalendar events={events} />
    </div>
  );
}
