import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Dog, Minus, Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import Stamp from '@/components/kathaa/Stamp';
import Reveal from '@/components/kathaa/Reveal';
import { useAuth } from '@/context/AuthContext';
import { useAvailability, useBookAvailability, useBookTable, useSeating, useShelf } from '@/hooks/kathaaHooks';
import { isoDay, prettyDay, prettySlot, prettyTime, whatsappShare } from '@/lib/kathaa';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/types/kathaa';

const OCCASIONS = ['Just because', 'Birthday', 'Date', 'Work session', 'Reading club', 'Catching up'];
const NONE = 'none';

/** Book a table, a writing desk — and optionally a book to be waiting at it. Free; runs on the kathaa-table workflow. */
export default function BookPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: zones } = useSeating();
  const { data: shelf } = useShelf();
  const book = useBookTable();

  const [date, setDate] = useState(params.get('date') ?? isoDay(0));
  const [zoneSlug, setZoneSlug] = useState<string | null>(params.get('zone'));
  const [time, setTime] = useState<string | null>(params.get('time'));
  const [guests, setGuests] = useState(Number(params.get('guests') ?? 2));
  const [bookId, setBookId] = useState<string>(params.get('bookId') ?? NONE);
  const [withPet, setWithPet] = useState(params.get('pet') === '1');
  const [petName, setPetName] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<Reservation | null>(null);

  const { data: availability, isLoading: loadingSlots } = useAvailability(date);
  const zone = zones?.find((z) => z.slug === zoneSlug) ?? null;
  const zoneSlots = availability?.find((a) => a.zoneId === zone?.id)?.slots ?? [];
  const slot = zoneSlots.find((s) => s.time === time) ?? null;
  const bookAvail = useBookAvailability(bookId === NONE ? null : Number(bookId), date);

  // Keep shareable state in the URL (also survives the login round-trip).
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('date', date);
    if (zoneSlug) next.set('zone', zoneSlug);
    if (time) next.set('time', time);
    next.set('guests', String(guests));
    if (bookId !== NONE) next.set('bookId', bookId);
    if (withPet) next.set('pet', '1');
    setParams(next, { replace: true });
  }, [date, zoneSlug, time, guests, bookId, withPet, setParams]);

  useEffect(() => { if (zone && guests > zone.maxParty) setGuests(zone.maxParty); }, [zone, guests]);
  useEffect(() => { if (zone && !zone.petFriendly) setWithPet(false); }, [zone]);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => isoDay(i)), []);

  const errors: string[] = [];
  if (!zone) errors.push('Choose where you’d like to sit.');
  if (zone && !time) errors.push('Pick a time.');
  if (slot && guests > slot.seatsLeft) errors.push(`Only ${slot.seatsLeft} seats are left at ${prettyTime(slot.time)}.`);
  if (bookId !== NONE && bookAvail.data && bookAvail.data.copiesFree <= 0) errors.push('That book is already promised to another table that day.');
  if (petName.length > 40) errors.push('Pet name is too long.');
  if (note.length > 280) errors.push('Keep the note under 280 characters.');
  const canSave = errors.length === 0 && !!slot?.bookable;
  const step = !zone ? 1 : !time ? 2 : 3;

  const submit = async () => {
    if (!zone || !time || !canSave) return;
    const res = await book.mutateAsync({
      zoneId: zone.id, date, time, guests, bookId: bookId === NONE ? null : Number(bookId),
      withPet, petName: withPet ? petName : null, occasion, note,
    });
    setDone(res);
  };

  if (done) {
    const text = `I’ve saved a table at Cafe Kathaa (${done.zoneName}) — ${prettySlot(done.slotKey)}. Join me? ${window.location.origin}/book`;
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="kt-card relative px-6 pb-14 pl-14 pt-8" role="status">
          <div className="absolute right-4 top-4"><Reveal variant="stamp"><Stamp round label="Confirmed">Saved<br />✓</Stamp></Reveal></div>
          <p className="kt-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Ticket {done.orderNumber}</p>
          <h1 className="kt-display mt-2 text-4xl">See you soon</h1>
          <dl className="mt-6 space-y-2 text-lg">
            <div><dt className="sr-only">Where</dt><dd>{done.zoneName}</dd></div>
            <div><dt className="sr-only">When</dt><dd>{prettySlot(done.slotKey)}</dd></div>
            <div><dt className="sr-only">Guests</dt><dd>{done.guests} {done.guests === 1 ? 'guest' : 'guests'}{done.withPet ? ` + ${done.petName ?? 'a good dog'}` : ''}</dd></div>
            {done.bookTitle && <div><dt className="sr-only">Book</dt><dd>Waiting at your table: <em>{done.bookTitle}</em></dd></div>}
          </dl>
          <span className="kt-hole" aria-hidden />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="kt-tap"><Link to="/my-kathaa">Track it in My Kathaa</Link></Button>
          <Button asChild variant="outline" className="kt-tap">
            <a href={whatsappShare(text)} target="_blank" rel="noreferrer"><Share2 size={18} className="mr-1" /> Invite on WhatsApp</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-12">
      <ChapterHeading number="B" accent="आरक्षण" title="Borrow a table"
        intro="Free to book. Choose a day, a corner of the bungalow and a time — add a book to be waiting for you." />
      <div className="mt-8">
        <Progress value={(step / 3) * 100} aria-label={`Step ${step} of 3`} className="h-1.5" />
        <p className="kt-mono mt-2 text-xs text-muted-foreground">Step {step} of 3</p>
      </div>

      {/* 1. Day */}
      <section aria-labelledby="pick-day" className="mt-10">
        <h2 id="pick-day" className="text-xl font-semibold">1 · Which day?</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="radiogroup" aria-label="Day">
          {days.map((d, i) => (
            <button key={d} type="button" role="radio" aria-checked={date === d}
              onClick={() => { setDate(d); setTime(null); }}
              className={cn('kt-tap shrink-0 rounded-sm border px-3 py-2 text-left',
                date === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')}>
              <span className="kt-mono block text-[0.7rem] uppercase opacity-80">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : prettyDay(d, { weekday: 'short' })}</span>
              <span className="block text-base">{prettyDay(d, { day: 'numeric', month: 'short' })}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Where */}
      <section aria-labelledby="pick-zone" className="mt-10">
        <h2 id="pick-zone" className="text-xl font-semibold">2 · Where in the bungalow?</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Seating area">
          {!zones && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          {zones?.map((z) => (
            <button key={z.id} type="button" role="radio" aria-checked={zoneSlug === z.slug}
              onClick={() => { setZoneSlug(z.slug); setTime(null); }}
              className={cn('kt-card-plain kt-pageturn p-5 text-left',
                zoneSlug === z.slug && 'outline outline-2 outline-offset-2 outline-accent')}>
              <span className="kt-mono block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{z.tagline}</span>
              <span className="kt-display mt-1 block text-2xl">{z.name}</span>
              <span className="mt-2 block text-base text-muted-foreground">{z.description}</span>
              <span className="kt-mono mt-3 block text-xs">Up to {z.maxParty} · {z.slotMinutes} min</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Time + details */}
      {zone && (
        <section aria-labelledby="pick-time" className="mt-10">
          <h2 id="pick-time" className="text-xl font-semibold">3 · What time, and who’s coming?</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Time">
            {loadingSlots && <Skeleton className="h-11 w-full" />}
            {zoneSlots.map((s) => (
              <button key={s.slotKey} type="button" role="radio" aria-checked={time === s.time} disabled={!s.bookable}
                onClick={() => setTime(s.time)}
                className={cn('kt-tap rounded-sm border px-3 text-base',
                  time === s.time ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card hover:border-accent',
                  !s.bookable && 'cursor-not-allowed opacity-45 line-through')}>
                {prettyTime(s.time)}
                {s.bookable && s.seatsLeft <= 6 && <span className="kt-mono ml-1 text-xs">· {s.seatsLeft} left</span>}
              </button>
            ))}
            {!loadingSlots && zoneSlots.length > 0 && zoneSlots.every((s) => !s.bookable) && (
              <p className="text-muted-foreground">No free slots left that day — try another day or corner.</p>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-base">Guests</Label>
              <div className="mt-2 flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="kt-tap" aria-label="One fewer guest"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}><Minus size={18} /></Button>
                <span className="kt-mono w-8 text-center text-xl" aria-live="polite">{guests}</span>
                <Button type="button" variant="outline" size="icon" className="kt-tap" aria-label="One more guest"
                  onClick={() => setGuests((g) => Math.min(zone.maxParty, g + 1))}><Plus size={18} /></Button>
                <span className="text-sm text-muted-foreground">max {zone.maxParty}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="occasion" className="text-base">Occasion</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger id="occasion" className="mt-2 h-11 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>{OCCASIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="book" className="text-base">A book waiting at your table <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger id="book" className={cn('mt-2 h-11 text-base', bookAvail.data?.copiesFree === 0 && 'border-destructive focus-visible:ring-destructive')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No book, thanks</SelectItem>
                  {shelf?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.title} — {b.author}</SelectItem>)}
                </SelectContent>
              </Select>
              {bookAvail.data && bookAvail.data.copiesFree > 0 && <p className="mt-1 text-sm text-muted-foreground">On the shelf that day.</p>}
            </div>
            {zone.petFriendly && (
              <div>
                <div className="flex items-center gap-3">
                  <Switch id="pet" checked={withPet} onCheckedChange={setWithPet} />
                  <Label htmlFor="pet" className="text-base"><Dog className="mr-1 inline" size={18} aria-hidden />Bringing a dog?</Label>
                </div>
                {withPet && (
                  <Input aria-label="Your dog’s name" placeholder="Their name (we’ll have water ready)" value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className={cn('mt-3 h-11 text-base', petName.length > 40 && 'border-destructive focus-visible:ring-destructive')} />
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <Label htmlFor="note" className="text-base">Anything we should know? <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                className={cn('mt-2 text-base', note.length > 280 && 'border-destructive focus-visible:ring-destructive')}
                placeholder="Window seat, a plug point, a birthday candle…" />
              <p className="kt-mono mt-1 text-right text-xs text-muted-foreground">{note.length}/280</p>
            </div>
          </div>
        </section>
      )}

      {/* Confirm */}
      <section aria-label="Confirm booking" className="mt-10 border-t border-border pt-6">
        {errors.length > 0 && zone && (
          <div role="alert" className="mb-4 rounded-sm border border-destructive/50 bg-destructive/5 p-3 text-base text-destructive">
            {errors.map((e) => <p key={e}>{e}</p>)}
          </div>
        )}
        {zone && slot && (
          <p className="mb-4 text-lg">{zone.name} · {prettySlot(slot.slotKey)} · {guests} {guests === 1 ? 'guest' : 'guests'}</p>
        )}
        {isAuthenticated ? (
          <Button size="lg" className="kt-tap bg-accent text-accent-foreground hover:bg-accent/90" disabled={!canSave || book.isPending} onClick={submit}>
            {book.isPending ? 'Saving…' : 'Confirm — it’s free'}
          </Button>
        ) : (
          <Button asChild size="lg" className="kt-tap">
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>Log in to confirm</Link>
          </Button>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Cancel any time before you’re seated from <Link to="/my-kathaa" className="kt-link">My Kathaa</Link>. No cover charge.
        </p>
      </section>
    </div>
  );
}
