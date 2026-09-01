import Link from 'next/link';
import { getContactMessages } from '@/lib/db/admin-messages';
import { ContactMessagesList } from '@/components/admin/contact-messages-list';

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const validStatus = status === 'new' || status === 'read' || status === 'archived' ? status : undefined;
  const messages = await getContactMessages(validStatus);

  return (
    <div>
      <h1 className="mb-6 text-cb-bone">Messages</h1>
      <div className="mb-6 flex gap-4 text-sm">
        <FilterLink label="All" active={!validStatus} href="/admin/messages" />
        <FilterLink label="New" active={validStatus === 'new'} href="/admin/messages?status=new" />
        <FilterLink label="Read" active={validStatus === 'read'} href="/admin/messages?status=read" />
        <FilterLink label="Archived" active={validStatus === 'archived'} href="/admin/messages?status=archived" />
      </div>
      <ContactMessagesList messages={messages} />
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link href={href} className={active ? 'text-cb-crimson' : 'text-cb-gray hover:text-cb-bone'}>
      {label}
    </Link>
  );
}
