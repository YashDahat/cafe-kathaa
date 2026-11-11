import { cn } from '@/lib/utils';

/** A hanko / library date-stamp: vermilion ink, slightly rotated, double ring. Decorative unless labelled. */
export default function Stamp({
  children, className, round = false, label,
}: { children: React.ReactNode; className?: string; round?: boolean; label?: string }) {
  return (
    <span
      className={cn('kt-stamp', round && 'kt-stamp-round', className)}
      aria-label={label}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </span>
  );
}
