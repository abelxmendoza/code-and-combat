'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/workshops', label: 'Workshops' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-cb-steel bg-cb-charcoal">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold text-cb-crimson sm:text-xl" onClick={() => setIsOpen(false)}>
          Code &amp; Combat
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-cb-bone transition hover:text-cb-crimson">
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/booking">Book a Session</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded p-2 text-cb-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-crimson md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="border-t border-cb-steel bg-cb-charcoal px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-cb-bone transition hover:text-cb-crimson"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link href="/booking">Book a Session</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
