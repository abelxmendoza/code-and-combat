'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateContactMessageStatus } from '@/lib/actions/admin-messages';
import { toast } from '@/hooks/use-toast';
import { formatTimeInTimezone } from '@/lib/timezone';
import type { AdminContactMessage } from '@/lib/db/admin-messages';

const INQUIRY_LABELS: Record<string, string> = {
  general: 'General',
  development: 'Website / App Development',
  code: 'Code Tutoring',
  combat: 'Combat',
  workshop: 'Workshop',
};

export function ContactMessagesList({ messages }: { messages: AdminContactMessage[] }) {
  const router = useRouter();

  async function handleStatusChange(id: string, status: 'new' | 'read' | 'archived') {
    const result = await updateContactMessageStatus(id, status);
    if (!result.success) {
      toast({ title: 'Could not update', description: result.error, variant: 'destructive' });
      return;
    }
    router.refresh();
  }

  if (messages.length === 0) {
    return <p className="text-cb-gray">No messages here.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <MessageRow key={message.id} message={message} onStatusChange={handleStatusChange} />
      ))}
    </div>
  );
}

function MessageRow({
  message,
  onStatusChange,
}: {
  message: AdminContactMessage;
  onStatusChange: (id: string, status: 'new' | 'read' | 'archived') => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function change(status: 'new' | 'read' | 'archived') {
    setIsSaving(true);
    await onStatusChange(message.id, status);
    setIsSaving(false);
  }

  return (
    <div className="card">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-cb-bone">{message.name}</p>
            <Badge variant={message.status === 'new' ? 'success' : message.status === 'archived' ? 'neutral' : 'warning'}>
              {message.status}
            </Badge>
          </div>
          <p className="text-sm text-cb-gray">
            {message.email} · prefers {message.preferredContactMethod} · {INQUIRY_LABELS[message.inquiryType] ?? message.inquiryType}
          </p>
        </div>
        <p className="text-mono text-xs text-cb-gray">
          {formatTimeInTimezone(new Date(message.createdAt), 'America/Los_Angeles', 'MMM d, yyyy h:mm a')}
        </p>
      </div>
      <p className="mb-4 whitespace-pre-wrap text-cb-gray">{message.message}</p>
      <div className="flex gap-2">
        {message.status !== 'read' && (
          <Button type="button" size="sm" variant="secondary" disabled={isSaving} onClick={() => change('read')}>
            Mark read
          </Button>
        )}
        {message.status !== 'archived' && (
          <Button type="button" size="sm" variant="secondary" disabled={isSaving} onClick={() => change('archived')}>
            Archive
          </Button>
        )}
        {message.status === 'archived' && (
          <Button type="button" size="sm" variant="secondary" disabled={isSaving} onClick={() => change('new')}>
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}
