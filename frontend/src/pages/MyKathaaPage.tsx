import { Link } from 'react-router-dom';
import { RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import Stamp from '@/components/kathaa/Stamp';
import Reveal from '@/components/kathaa/Reveal';
import DishCard from '@/components/kathaa/DishCard';
import { useChapters, useFavourites, useMyReservations } from '@/hooks/kathaaHooks';
import { useCancelOrder, useMyOrders } from '@/hooks/orderHooks';
import { useCart } from '@/cart';
import { withToast } from '@/lib/apiToast';
import { prettySlot, rupees, TABLE_STAGES, TAKEAWAY_STAGES, whatsappShare } from '@/lib/kathaa';
import { cn } from '@/lib/utils';

function StageTrack({ stages, current }: { stages: { code: string; label: string }[]; current: string | null }) {
  const idx = stages.findIndex((s) => s.code === current);
  if (current === 'CANCELLED') return <p className="kt-mono text-sm text-destructive">Cancelled</p>;
  return (
    <ol className="mt-3 flex items-center gap-2" aria-label="Progress">
      {stages.map((s, i) => (
        <li key={s.code} className="flex flex-1 items-center gap-2">
          <span className={cn('h-2 flex-1 rounded-full transition-colors duration-500', i <= idx ? 'bg-accent' : 'bg-border')} aria-hidden />
          <span className={cn('kt-mono text-[0.7rem] uppercase', i === idx ? 'text-foreground' : 'text-muted-foreground')}
            aria-current={i === idx ? 'step' : undefined}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** My Kathaa: the Chapters stamp card, live booking/takeaway tracking, bookmarks and one-tap reorder. */
export default function MyKathaaPage() {
  const { data: chapters, isLoading: loadingChapters } = useChapters();
  const { data: reservations, isLoading: loadingRes } = useMyReservations();
  const { data: orders } = useMyOrders();
  const { data: favourites } = useFavourites();
  const cancel = useCancelOrder();
  const { addItem } = useCart();

  const upcoming = (reservations ?? []).filter((r) => r.stageCode !== 'CANCELLED' && r.stageCode !== 'FINISHED');
  const takeaways = (orders ?? []).filter((o) => o.workflowCode === 'kathaa-takeaway');
  const liveTakeaways = takeaways.filter((o) => !['COLLECTED', 'CANCELLED'].includes(o.currentStageCode ?? ''));
  const lastDone = takeaways.find((o) => o.currentStageCode === 'COLLECTED') ?? takeaways[0];

  const reorder = () => {
    if (!lastDone) return;
    lastDone.items.forEach((it) =>
      addItem({ id: `${it.itemType}:${it.itemId}`, name: it.name, unitPrice: Number(it.unitPrice), imageUrl: it.imageUrl ?? null,
        metadata: { itemType: it.itemType, itemId: it.itemId } }, it.quantity));
    void withToast(Promise.resolve(), 'Your usual is back in the takeaway bag');
  };

  const per = chapters?.stampsPerChapter ?? 8;
  const filled = chapters?.stampsInCurrentChapter ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-12">
      <ChapterHeading number="✎" accent="माझी कथा" title="My Kathaa"
        intro="Your library card: stamps for every visit and takeaway, your bookings, and the dishes you bookmarked." />

      {/* Chapters stamp card */}
      <section aria-labelledby="stamps" className="mt-10">
        <div className="kt-card relative px-5 pb-12 pl-14 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="stamps" className="kt-display text-3xl">Chapter {(chapters?.chaptersCompleted ?? 0) + 1}</h2>
            <p className="kt-mono text-sm text-muted-foreground">{chapters?.totalStamps ?? 0} stamps all-time</p>
          </div>
          {loadingChapters ? <Skeleton className="mt-4 h-20" /> : (
            <>
              <ol className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8" aria-label={`${filled} of ${per} stamps this chapter`}>
                {Array.from({ length: per }).map((_, i) => (
                  <li key={i} className="flex aspect-square items-center justify-center rounded-full border border-dashed border-border">
                    {i < filled ? (
                      <Reveal variant="stamp" delay={i * 90}>
                        <Stamp round className="h-12 w-12 text-[0.55rem]">
                          {chapters?.recentStamps[i]?.kind === 'TAKEAWAY' ? 'To go' : 'Read'}
                        </Stamp>
                      </Reveal>
                    ) : <span className="kt-mono text-xs text-muted-foreground">{i + 1}</span>}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-lg">
                {chapters?.enabled
                  ? <>{chapters.stampsToNextReward} more to finish this chapter — reward: <strong>{chapters.rewardText}</strong>. Show this card at the counter.</>
                  : 'The stamp card is resting for now.'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">A stamp lands when staff mark your visit finished or your takeaway collected.</p>
            </>
          )}
          <span className="kt-hole" aria-hidden />
        </div>
      </section>

      {/* Bookings */}
      <section aria-labelledby="bookings" className="mt-14">
        <h2 id="bookings" className="kt-display text-3xl">Your tables</h2>
        {loadingRes && <Skeleton className="mt-4 h-24" />}
        {!loadingRes && upcoming.length === 0 && (
          <p className="mt-3 text-muted-foreground">No tables saved. <Link to="/book" className="kt-link">Book one</Link> — it’s free.</p>
        )}
        <ul className="mt-4 space-y-4">
          {upcoming.map((r) => (
            <li key={r.orderId} className="kt-card-plain p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="kt-mono text-xs text-muted-foreground">Ticket {r.orderNumber}</p>
                  <p className="text-xl font-semibold">{r.zoneName}</p>
                  <p className="text-base">{prettySlot(r.slotKey)} · {r.guests} {r.guests === 1 ? 'guest' : 'guests'}{r.withPet ? ` + ${r.petName ?? 'dog'}` : ''}</p>
                  {r.bookTitle && <p className="text-base text-muted-foreground">Book waiting: <em>{r.bookTitle}</em></p>}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="kt-tap">
                    <a href={whatsappShare(`Join me at Cafe Kathaa — ${r.zoneName}, ${prettySlot(r.slotKey)}.`)} target="_blank" rel="noreferrer">
                      <Share2 size={16} className="mr-1" />Invite</a>
                  </Button>
                  {r.cancellable && (
                    <Button variant="ghost" size="sm" className="kt-tap text-destructive" disabled={cancel.isPending}
                      onClick={() => cancel.mutate({ id: r.orderId, reason: 'Guest cancelled from My Kathaa' })}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              <StageTrack stages={TABLE_STAGES} current={r.stageCode} />
            </li>
          ))}
        </ul>
      </section>

      {/* Takeaway */}
      <section aria-labelledby="takeaway" className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="takeaway" className="kt-display text-3xl">Takeaway</h2>
          {lastDone && (
            <Button onClick={reorder} className="kt-tap"><RotateCcw size={18} className="mr-1" /> Order my usual again</Button>
          )}
        </div>
        {liveTakeaways.length === 0 && <p className="mt-3 text-muted-foreground">Nothing cooking right now. <Link to="/menu" className="kt-link">Open the menu</Link>.</p>}
        <ul className="mt-4 space-y-4">
          {liveTakeaways.map((o) => (
            <li key={o.id} className="kt-card-plain p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <Link to={`/orders/${o.id}`} className="kt-link text-lg font-semibold">Order {o.orderNumber}</Link>
                <span className="kt-mono">{rupees(o.total)}</span>
              </div>
              <p className="text-base text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
              <StageTrack stages={TAKEAWAY_STAGES} current={o.currentStageCode ?? null} />
            </li>
          ))}
        </ul>
      </section>

      {/* Bookmarks */}
      {favourites && favourites.length > 0 && (
        <section aria-labelledby="bookmarks" className="mt-14">
          <h2 id="bookmarks" className="kt-display text-3xl">Bookmarked dishes</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favourites.map((d, i) => <DishCard key={d.id} dish={d} index={i} />)}
          </div>
        </section>
      )}

      {/* Refer */}
      <section aria-labelledby="refer" className="mt-14 border-t border-border pt-8">
        <h2 id="refer" className="kt-display text-3xl">Lend Kathaa to a friend</h2>
        <p className="mt-2 text-lg">Send them the shelf — the best stories are passed along.</p>
        <Button asChild variant="outline" className="kt-tap mt-4">
          <a href={whatsappShare(`My favourite book café in Pune: Cafe Kathaa, off FC Road. Browse the shelf and save a table: ${window.location.origin}/shelf`)}
            target="_blank" rel="noreferrer"><Share2 size={18} className="mr-1" /> Share on WhatsApp</a>
        </Button>
      </section>
    </div>
  );
}
