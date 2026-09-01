import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-cb-steel bg-cb-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-bold text-cb-crimson">Code & Combat</h3>
            <p className="text-sm text-cb-gray">
              Build sharper. Move stronger.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-cb-bone">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services?category=code" className="text-cb-gray hover:text-cb-bone">
                  Coding Tutoring
                </Link>
              </li>
              <li>
                <Link href="/services?category=combat" className="text-cb-gray hover:text-cb-bone">
                  Martial Arts
                </Link>
              </li>
              <li>
                <Link href="/workshops" className="text-cb-gray hover:text-cb-bone">
                  Workshops
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-cb-bone">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-cb-gray hover:text-cb-bone">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-cb-gray hover:text-cb-bone">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/portal" className="text-cb-gray hover:text-cb-bone">
                  Client Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-cb-bone">Connect</h4>
            <ul className="space-y-2 text-sm text-cb-gray">
              <li>hello@codeandcombat.example (placeholder)</li>
              <li>Instagram — @codeandcombat (placeholder)</li>
              <li>GitHub — @abelmendoza (placeholder)</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-cb-steel pt-8">
          <p className="text-center text-sm text-cb-gray">
            © {currentYear} Code & Combat by Abel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
