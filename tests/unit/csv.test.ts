import { describe, it, expect } from 'vitest';
import { toCsv } from '@/lib/domain/csv';

describe('toCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });

  it('writes a header row followed by data rows', () => {
    const csv = toCsv([
      { name: 'Jane', email: 'jane@example.com' },
      { name: 'Sam', email: 'sam@example.com' },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('name,email');
    expect(lines[1]).toBe('Jane,jane@example.com');
    expect(lines[2]).toBe('Sam,sam@example.com');
  });

  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    const csv = toCsv([{ note: 'Says "hi", then leaves\nnext line' }]);
    expect(csv).toBe('note\r\n"Says ""hi"", then leaves\nnext line"');
  });

  it('renders null values as empty strings', () => {
    const csv = toCsv([{ phone: null }]);
    expect(csv).toBe('phone\r\n');
  });
});
