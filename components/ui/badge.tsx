import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-mono uppercase tracking-wider',
  {
    variants: {
      variant: {
        neutral: 'border-cb-steel text-cb-gray',
        code: 'border-cb-electric/40 text-cb-electric',
        combat: 'border-cb-crimson/40 text-cb-crimson',
        success: 'border-cb-electric/40 text-cb-electric',
        warning: 'border-cb-amber/40 text-cb-amber',
        danger: 'border-cb-crimson text-cb-crimson',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
