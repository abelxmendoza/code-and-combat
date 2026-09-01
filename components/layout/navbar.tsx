'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/workshops', label: 'Workshops' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-cb-steel bg-cb-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo className="h-9 sm:h-10" priority onClick={() => setIsOpen(false)} />

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-cb-gray transition-colors hover:text-cb-bone"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/booking">Book a Session</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded p-2 text-cb-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-electric md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="border-t border-cb-steel bg-cb-black px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-2 py-3 text-base text-cb-gray transition-colors hover:bg-cb-charcoal hover:text-cb-bone"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="mt-3" onClick={() => setIsOpen(false)}>
              <Link href="/booking">Book a Session</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
