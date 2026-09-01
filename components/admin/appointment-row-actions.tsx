'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateAppointmentStatus } from '@/lib/actions/admin-appointments';
import { toast } from '@/hooks/use-toast';
import type { AppointmentStatus } from '@/types/domain';

const STATUS_OPTIONS: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_admin',
  'no_show',
];

export function AppointmentRowActions({
  appointmentId,
  status,
  adminNotes,
}: {
  appointmentId: string;
  status: string;
  adminNotes: string | null;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [notes, setNotes] = useState(adminNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  async function handleStatusChange(newStatus: AppointmentStatus) {
    setIsSaving(true);
    const result = await updateAppointmentStatus(appointmentId, newStatus);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Could not update status', description: result.error, variant: 'destructive' });
      return;
    }
    setCurrentStatus(newStatus);
    toast({ title: 'Status updated', variant: 'success' });
  }

  async function handleSaveNotes() {
    setIsSaving(true);
    const result = await updateAppointmentStatus(appointmentId, currentStatus as AppointmentStatus, notes);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Could not save notes', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Notes saved', variant: 'success' });
    setShowNotes(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        className="input-field text-sm"
        value={currentStatus}
        disabled={isSaving}
        onChange={(e) => handleStatusChange(e.target.value as AppointmentStatus)}
        aria-label="Appointment status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" variant="ghost" onClick={() => setShowNotes((v) => !v)}>
        {showNotes ? 'Hide notes' : 'Admin notes'}
      </Button>
      {showNotes && (
        <div className="space-y-2">
          <textarea
            className="input-field w-full text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes — not visible to the client"
          />
          <Button type="button" size="sm" onClick={handleSaveNotes} disabled={isSaving}>
            Save notes
          </Button>
        </div>
      )}
    </div>
  );
}
