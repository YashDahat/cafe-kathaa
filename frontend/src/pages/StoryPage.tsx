import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import Reveal from '@/components/kathaa/Reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useStory } from '@/hooks/kathaaHooks';
import { CAFE } from '@/lib/kathaa';

/** Our Story: a book spine that fills with ink as you read down the timeline. */
export default function StoryPage() {
  const { data: chapters, isLoading } = useStory();
  const listRef = useRef<HTMLOListElement | null>(null);
  const [fill, setFill] = useState(1);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = listRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const progress = (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height);
        setFill(Math.min(1, Math.max(0, progress)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [chapters]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-12">
      <ChapterHeading number="00" accent="आमची कथा" title="Our story, so far"
        intro="Kathaa means story. Ours is still being written — by everyone who has read a page here." />

      <figure className="mt-10">
        <img src={CAFE.photo} alt="The Cafe Kathaa bungalow off FC Road" loading="lazy" width={426} height={240}
          className="aspect-[21/9] w-full rounded-sm border border-border object-cover" />
      </figure>

      <ol ref={listRef} className="relative mt-14 space-y-14 pl-12 sm:pl-20">
        <span aria-hidden className="absolute bottom-0 left-4 top-0 w-1 rounded-full bg-border sm:left-8" />
        <span aria-hidden className="absolute left-4 top-0 h-full w-1 origin-top rounded-full bg-accent transition-transform duration-300 sm:left-8"
          style={{ transform: `scaleY(${fill})` }} />
        {isLoading && Array.from({ length: 4 }).map((_, i) => <li key={i}><Skeleton className="h-28" /></li>)}
        {chapters?.map((c, i) => (
          <li key={c.id} className="relative">
            <span aria-hidden className="absolute -left-[2.15rem] top-2 h-4 w-4 rounded-full border-2 border-accent bg-background sm:-left-[3.15rem]" />
            <Reveal>
              <p className="kt-mono text-xs uppercase tracking-[0.2em] text-accent">{c.marker}</p>
              <h2 className="kt-display mt-1 text-3xl sm:text-4xl">{c.title}</h2>
              {c.body && <p className="mt-3 max-w-2xl text-lg leading-relaxed">{c.body}</p>}
              {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="mt-4 max-h-72 rounded-sm border border-border object-cover" />}
              <p className="kt-mono mt-2 text-xs text-muted-foreground">p. {String(i + 1).padStart(2, '0')}</p>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-16 border-t border-border pt-8">
        <p className="text-lg">The next page is yours.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="kt-tap"><Link to="/book">Book a table</Link></Button>
          <Button asChild variant="outline" className="kt-tap"><Link to="/shelf">Browse the shelf</Link></Button>
        </div>
      </div>
    </div>
  );
}
