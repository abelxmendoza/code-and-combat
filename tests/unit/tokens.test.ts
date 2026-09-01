import { describe, it, expect } from 'vitest';
import { generateSecureLink, generateEventManageLink } from '@/lib/tokens';

describe('generateSecureLink', () => {
  it('builds a /manage/[id] URL with the token as a query param', () => {
    const url = generateSecureLink('https://example.com', 'appt-123', 'tok-abc');
    expect(url).toBe('https://example.com/manage/appt-123?token=tok-abc');
  });

  it('URL-encodes special characters in the token', () => {
    const url = generateSecureLink('https://example.com', 'appt-123', 'a b/c');
    expect(url).toContain('token=a+b%2Fc');
  });
});

describe('generateEventManageLink', () => {
  it('builds a /manage/event/[id] URL with the token as a query param', () => {
    const url = generateEventManageLink('https://example.com', 'reg-456', 'tok-xyz');
    expect(url).toBe('https://example.com/manage/event/reg-456?token=tok-xyz');
  });
});
