import { cn } from '@/lib/utils';
import type { WizardStep } from '@/store/bookingSlice';

export interface ProgressStep {
  key: WizardStep;
  label: string;
}

export function WizardProgress({ current, steps }: { current: WizardStep; steps: ProgressStep[] }) {
  if (current === 'confirmed') return null;
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <ol className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-3 text-mono" aria-label="Booking progress">
      {steps.map((step, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs',
                isCurrent && 'border-cb-purple bg-cb-purple text-cb-bone',
                isDone && 'border-cb-electric text-cb-electric',
                !isCurrent && !isDone && 'border-cb-steel text-cb-gray',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index + 1}
            </span>
            <span className={cn(isCurrent ? 'text-cb-bone' : 'text-cb-gray', 'hidden sm:inline')}>{step.label}</span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-cb-steel sm:mx-2" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
