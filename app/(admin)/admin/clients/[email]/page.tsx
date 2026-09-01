import Link from 'next/link';
import { getClientBookingHistory, getClientNotes } from '@/lib/db/admin-clients';
import { Badge } from '@/components/ui/badge';
import { AddClientNoteForm } from '@/components/admin/add-client-note-form';
import { formatTimeInTimezone } from '@/lib/timezone';

export default async function AdminClientDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail);
  const [history, notes] = await Promise.all([getClientBookingHistory(email), getClientNotes(email)]);

  return (
    <div>
      <Link href="/admin/clients" className="mb-4 inline-block text-sm text-cb-gray hover:text-cb-bone">
        ← Back to clients
      </Link>
      <h1 className="mb-8 text-cb-bone">{email}</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-cb-bone">Booking history</h2>
        {history.length === 0 ? (
          <p className="text-cb-gray">No bookings found.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.bookingReference} className="card flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-cb-bone">{h.serviceName}</p>
                  <p className="text-mono text-xs text-cb-gray">{formatTimeInTimezone(new Date(h.startTime), 'America/Los_Angeles', 'MMM d, yyyy h:mm a')}</p>
                </div>
                <Badge variant={h.status === 'confirmed' ? 'success' : h.status.startsWith('cancelled') ? 'danger' : 'neutral'}>
                  {h.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-cb-bone">Private notes</h2>
        <div className="mb-4 space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="card">
              <p className="text-cb-bone">{n.note}</p>
              <p className="mt-1 text-mono text-xs text-cb-gray">{formatTimeInTimezone(new Date(n.createdAt), 'America/Los_Angeles', 'MMM d, yyyy h:mm a')}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-cb-gray">No notes yet.</p>}
        </div>
        <AddClientNoteForm clientEmail={email} />
      </section>
    </div>
  );
}
