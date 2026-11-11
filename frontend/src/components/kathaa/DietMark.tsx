import type { Diet } from '@/types/kathaa';
import { cn } from '@/lib/utils';

const LABEL: Record<Diet, string> = { VEG: 'Vegetarian', EGG: 'Contains egg', NON_VEG: 'Non-vegetarian' };

/** The Indian FSSAI-style square-and-dot food marker. */
export default function DietMark({ diet, className }: { diet: Diet; className?: string }) {
  const color = diet === 'VEG' ? 'kt-veg' : diet === 'EGG' ? 'kt-egg' : 'kt-nonveg';
  return (
    <span className={cn('kt-diet', color, className)} role="img" aria-label={LABEL[diet]} title={LABEL[diet]}>
      <span />
    </span>
  );
}
