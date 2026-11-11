import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import DishCard from '@/components/kathaa/DishCard';
import Reveal from '@/components/kathaa/Reveal';
import { useMenu, useFavourites } from '@/hooks/kathaaHooks';
import { useCart } from '@/cart';
import { rupees } from '@/lib/kathaa';
import { cn } from '@/lib/utils';

/** The menu as a catalogue drawer: filter by section, veg only, or search; add to a counter-pickup takeaway. */
export default function MenuPage() {
  const { data: menu, isLoading, isError, refetch } = useMenu();
  const { data: favourites } = useFavourites();
  const { cartCount, totals } = useCart();
  const [category, setCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [q, setQ] = useState('');

  const categories = useMemo(() => ['All', ...Array.from(new Set((menu ?? []).map((d) => d.category)))], [menu]);
  const shown = (menu ?? []).filter(
    (d) =>
      (category === 'All' || d.category === category) &&
      (!vegOnly || d.diet === 'VEG') &&
      (q.trim() === '' || `${d.name} ${d.description ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-12">
      <ChapterHeading number="M" accent="मेनू" title="The menu drawer"
        intro="Pull a card, add it to your takeaway and collect it at the counter. Pay online by UPI or at the counter." />

      {favourites && favourites.length > 0 && (
        <section aria-labelledby="favs" className="mt-10">
          <h2 id="favs" className="kt-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Your bookmarks</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.slice(0, 3).map((d, i) => <DishCard key={d.id} dish={d} index={i} />)}
          </div>
        </section>
      )}

      <div className="sticky top-[4.5rem] z-30 mt-10 border-y border-border bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Menu sections" className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
                className={cn('kt-tap rounded-sm border px-3 text-sm transition-colors',
                  category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="veg-only" checked={vegOnly} onCheckedChange={setVegOnly} />
              <Label htmlFor="veg-only" className="text-sm">Veg only</Label>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} aria-hidden />
              <Label htmlFor="menu-search" className="sr-only">Search the menu</Label>
              <Input id="menu-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes"
                className="h-11 w-52 pl-9 text-base" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        {shown.map((d, i) => (
          <Reveal key={d.id} className="h-full" delay={(i % 3) * 60}>
            <DishCard dish={d} index={i} />
          </Reveal>
        ))}
      </div>
      {isError && (
        <div className="mt-10 text-center">
          <p className="text-muted-foreground">We couldn’t open the menu drawer.</p>
          <Button variant="outline" className="kt-tap mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {!isLoading && !isError && shown.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">Nothing on this shelf matches — try another section.</p>
      )}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="text-base">
              <ShoppingBag className="mr-2 inline" size={18} aria-hidden />
              {cartCount} item{cartCount > 1 ? 's' : ''} · <span className="kt-mono font-semibold">{rupees(totals.total)}</span>
            </p>
            <Button asChild className="kt-tap bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/cart">Review takeaway</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
