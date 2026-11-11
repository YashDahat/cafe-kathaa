import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Quiet, book-like reveal: a chapter settles into view once (transform/opacity only). Content is visible by
 * default; the pre-reveal state is applied only after JS confirms motion is welcome, so nothing ever waits on JS
 * and reduced-motion visitors get everything static.
 */
export default function Reveal({
  children, as: Tag = 'div', className, variant = 'settle', delay = 0,
}: {
  children: ReactNode; as?: ElementType; className?: string;
  variant?: 'settle' | 'stamp' | 'slide-card'; delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'static' | 'waiting' | 'in'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !('IntersectionObserver' in window)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && variant !== 'slide-card' && variant !== 'stamp') return; // already on screen: stay static
    setState('waiting');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => setState('in')));
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  return (
    <Tag
      ref={ref}
      className={cn(className, state !== 'static' && `kt-v-${variant}`, state === 'in' && 'is-in')}
      style={delay ? { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
