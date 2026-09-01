'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from './admin-sidebar';

export function AdminShell({
  children,
  unreadMessageCount = 0,
}: {
  children: React.ReactNode;
  unreadMessageCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <AdminSidebar unreadMessageCount={unreadMessageCount} />
      </div>

      <div className="flex items-center justify-between border-b border-cb-steel bg-cb-charcoal p-4 md:hidden">
        <span className="font-bold text-cb-crimson">Admin</span>
        <button
          type="button"
          className="rounded p-2 text-cb-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden">
          <AdminSidebar unreadMessageCount={unreadMessageCount} />
        </div>
      )}

      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
