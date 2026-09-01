import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-cb-steel bg-cb-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo className="h-12" />
            <p className="mt-4 text-sm text-cb-gray">Build sharper. Move stronger.</p>
          </div>
          <div>
            <h4 className="label-caps mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services#development" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Software &amp; App Development
                </Link>
              </li>
              <li>
                <Link href="/services#development" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Personal &amp; Business Websites
                </Link>
              </li>
              <li>
                <Link href="/services?category=code" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Coding Tutoring
                </Link>
              </li>
              <li>
                <Link href="/services?category=combat" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Martial Arts
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="label-caps mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-cb-gray transition-colors hover:text-cb-bone">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/portal" className="text-cb-gray transition-colors hover:text-cb-bone">
                  Client Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="label-caps mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-cb-gray">
              <li>hello@codeandcombat.example (placeholder)</li>
              <li>Instagram — @codeandcombat (placeholder)</li>
              <li>GitHub — @abelmendoza (placeholder)</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-cb-steel pt-8">
          <p className="text-center text-sm text-cb-muted">© {currentYear} Abel Mendoza. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
