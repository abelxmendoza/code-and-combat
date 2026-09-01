'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Wrench,
  Clock,
  Users,
  PartyPopper,
  Settings,
  Mail,
} from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/appointments', label: 'Appointments', icon: ListChecks },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
  { href: '/admin/services', label: 'Services', icon: Wrench },
  { href: '/admin/availability', label: 'Availability', icon: Clock },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/workshops', label: 'Workshops', icon: PartyPopper },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ unreadMessageCount = 0 }: { unreadMessageCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col border-r border-cb-steel bg-cb-charcoal p-4" aria-label="Admin navigation">
      <Link href="/admin" className="mb-8 px-2 text-lg font-bold text-cb-crimson">
        Admin
      </Link>
      <ul className="flex-1 space-y-1">
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm transition',
                  isActive ? 'bg-cb-crimson/10 text-cb-crimson' : 'text-cb-gray hover:bg-cb-dark hover:text-cb-bone',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
                {link.href === '/admin/messages' && unreadMessageCount > 0 && (
                  <span className="ml-auto rounded-full bg-cb-crimson px-2 py-0.5 text-xs font-semibold text-cb-black">
                    {unreadMessageCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={signOut}>
        <Button type="submit" variant="secondary" size="sm" className="w-full">
          Sign out
        </Button>
      </form>
    </nav>
  );
}
