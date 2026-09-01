import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea className={cn('input-field w-full min-h-[120px] resize-y', className)} ref={ref} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
