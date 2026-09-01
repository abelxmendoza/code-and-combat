import Link from 'next/link';
import { requireUser } from '@/lib/auth/authorization';
import { signOut } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-cb-steel pb-6">
        <div>
          <h1 className="text-cb-bone">Client Portal</h1>
          <p className="text-sm text-cb-gray">Signed in as {session.user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-sm text-cb-bone hover:text-cb-electric">
            Bookings
          </Link>
          <Link href="/portal/profile" className="text-sm text-cb-bone hover:text-cb-electric">
            Profile
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
