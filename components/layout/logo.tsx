import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The master asset (public/logo.png) is a square icon+wordmark lockup —
 * the "ABEL MENDOZA" text is baked into the image, so this renders it as a
 * single unit rather than pairing it with a separate live-text wordmark.
 */
export function Logo({
  className,
  priority = false,
  onClick,
}: {
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href="/" className={cn('inline-flex shrink-0 items-center', className)} aria-label="Abel Mendoza — home" onClick={onClick}>
      <Image src="/logo.png" alt="Abel Mendoza" width={512} height={512} priority={priority} className="h-full w-auto" />
    </Link>
  );
}
