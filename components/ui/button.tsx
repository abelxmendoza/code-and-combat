import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cb-electric focus-visible:ring-offset-2 focus-visible:ring-offset-cb-black',
  {
    variants: {
      variant: {
        // Near-black with a thin ultraviolet edge, per brand direction —
        // not a solid-purple block.
        primary:
          'border border-cb-purple bg-cb-black text-cb-bone shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)] hover:border-cb-electric hover:shadow-cb-glow-sm',
        secondary: 'border border-cb-steel bg-transparent text-cb-bone hover:border-cb-electric/50 hover:bg-cb-charcoal',
        ghost: 'bg-transparent text-cb-bone hover:bg-cb-dark',
        destructive: 'bg-cb-danger/90 text-cb-bone hover:bg-cb-danger',
      },
      size: {
        default: 'h-11 px-6 text-sm',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
