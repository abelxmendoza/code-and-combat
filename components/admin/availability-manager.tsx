'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  upsertAvailabilityRule,
  deleteAvailabilityRule,
  createCalendarBlock,
  deleteCalendarBlock,
} from '@/lib/actions/admin-availability';
import { toast } from '@/hooks/use-toast';
import type { AvailabilityRule, CalendarBlock } from '@/types/domain';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityManager({ rules, blocks }: { rules: AvailabilityRule[]; blocks: CalendarBlock[] }) {
  return (
    <div className="space-y-12">
      <RulesSection rules={rules} />
      <BlocksSection blocks={blocks} />
    </div>
  );
}

function RulesSection({ rules }: { rules: AvailabilityRule[] }) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('21:00');
  const [category, setCategory] = useState<'code' | 'combat' | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    setIsSaving(true);
    const result = await upsertAvailabilityRule({
      dayOfWeek,
      startTime,
      endTime,
      category: category || null,
      active: true,
    });
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Could not add rule', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Rule added', variant: 'success' });
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteAvailabilityRule(id);
    if (!result.success) {
      toast({ title: 'Could not delete rule', description: result.error, variant: 'destructive' });
      return;
    }
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-cb-bone">Recurring weekly availability</h2>
      <div className="mb-6 space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="card flex flex-wrap items-center justify-between gap-3">
            <p className="text-cb-bone">
              {DAYS[rule.day_of_week]} · {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
              {rule.category ? ` · ${rule.category}` : ' · both'}
            </p>
            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
              Remove
            </Button>
          </div>
        ))}
        {rules.length === 0 && <p className="text-cb-gray">No recurring availability configured yet.</p>}
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="dayOfWeek">Day</Label>
          <select id="dayOfWeek" className="input-field" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="startTime">Start</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endTime">End</Label>
          <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" className="input-field" value={category} onChange={(e) => setCategory(e.target.value as 'code' | 'combat' | '')}>
            <option value="">Both</option>
            <option value="code">Code</option>
            <option value="combat">Combat</option>
          </select>
        </div>
        <Button type="button" onClick={handleAdd} disabled={isSaving}>
          Add rule
        </Button>
      </div>
    </section>
  );
}

function BlocksSection({ blocks }: { blocks: CalendarBlock[] }) {
  const router = useRouter();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('Unavailable');
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    if (!start || !end) return;
    setIsSaving(true);
    const result = await createCalendarBlock({
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      reason,
    });
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Could not add block', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Block added', variant: 'success' });
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteCalendarBlock(id);
    if (!result.success) {
      toast({ title: 'Could not delete block', description: result.error, variant: 'destructive' });
      return;
    }
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-cb-bone">Blocked dates &amp; time ranges</h2>
      <div className="mb-6 space-y-2">
        {blocks.map((block) => (
          <div key={block.id} className="card flex flex-wrap items-center justify-between gap-3">
            <p className="text-cb-bone">
              {new Date(block.start_time).toLocaleString()} → {new Date(block.end_time).toLocaleString()}
              {block.reason ? ` · ${block.reason}` : ''}
            </p>
            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(block.id)}>
              Remove
            </Button>
          </div>
        ))}
        {blocks.length === 0 && <p className="text-cb-gray">No blocks scheduled.</p>}
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="blockStart">Start</Label>
          <Input id="blockStart" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="blockEnd">End</Label>
          <Input id="blockEnd" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button type="button" onClick={handleAdd} disabled={isSaving || !start || !end}>
          Add block
        </Button>
      </div>
    </section>
  );
}
