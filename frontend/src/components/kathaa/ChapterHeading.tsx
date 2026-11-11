import { cn } from '@/lib/utils';

/** Numbered chapter heading: mono chapter number on a thin rule, brush display title, optional Devanagari accent. */
export default function ChapterHeading({
  number, title, accent, intro, id, className,
}: { number: string; title: string; accent?: string; intro?: string; id?: string; className?: string }) {
  return (
    <header className={cn('max-w-2xl', className)}>
      <p className="kt-mono flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Ch. {number}</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
        {accent && <span lang="mr" className="kt-display text-base normal-case tracking-normal text-accent">{accent}</span>}
      </p>
      <h2 id={id} className="kt-display mt-3 text-4xl leading-tight text-foreground sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
    </header>
  );
}
