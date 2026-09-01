'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addClientNote } from '@/lib/actions/admin-clients';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function AddClientNoteForm({ clientEmail }: { clientEmail: string }) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const result = await addClientNote(clientEmail, note);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Could not save note', description: result.error, variant: 'destructive' });
      return;
    }
    setNote('');
    toast({ title: 'Note added', variant: 'success' });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note about this client" />
      <Button type="submit" size="sm" disabled={isSaving || !note.trim()}>
        {isSaving ? 'Saving…' : 'Add note'}
      </Button>
    </form>
  );
}
