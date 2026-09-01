'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cancelEventRegistration } from '@/lib/actions/events';
import { toast } from '@/hooks/use-toast';
import { formatTimeInTimezone, getClientTimezone } from '@/lib/timezone';
import type { ManageableEventRegistration } from '@/lib/actions/events';

export function ManageRegistrationClient({
  registration,
  token,
}: {
  registration: ManageableEventRegistration;
  token: string;
}) {
  const [current, setCurrent] = useState(registration);
  const [isCancelling, setIsCancelling] = useState(false);
  const timezone = getClientTimezone();

  async function handleCancel() {
    setIsCancelling(true);
    const result = await cancelEventRegistration(current.id, token);
    setIsCancelling(false);
    if (!result.success) {
      toast({ title: 'Could not cancel', description: result.error, variant: 'destructive' });
      return;
    }
    setCurrent((prev) => ({ ...prev, status: 'cancelled' }));
    toast({ title: 'Registration cancelled', variant: 'success' });
  }

  const isActive = current.status === 'confirmed' || current.status === 'waitlisted';

  return (
    <div className="mt-8 space-y-6">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-cb-bone">{current.eventTitle}</h2>
          <Badge variant={current.status === 'confirmed' ? 'success' : current.status === 'cancelled' ? 'danger' : 'warning'}>
            {current.status}
          </Badge>
        </div>
        <p className="text-mono text-sm text-cb-gray">
          {current.eventStartTime && formatTimeInTimezone(new Date(current.eventStartTime), timezone, 'EEEE, MMM d · h:mm a zzz')}
        </p>
        <p className="mt-2 text-cb-gray">Registered as {current.clientName}</p>
      </div>

      {isActive ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              Cancel registration
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this registration?</AlertDialogTitle>
              <AlertDialogDescription>
                If you were confirmed, your spot may open up for someone on the waitlist.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep registration</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? 'Cancelling…' : 'Yes, cancel it'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <p className="text-cb-gray">This registration is {current.status}.</p>
      )}
    </div>
  );
}
