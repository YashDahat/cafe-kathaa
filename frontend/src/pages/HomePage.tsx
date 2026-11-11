import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Coffee, Dog, MapPin, MessageCircle, Phone, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Reveal from '@/components/kathaa/Reveal';
import Stamp from '@/components/kathaa/Stamp';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import DishCard from '@/components/kathaa/DishCard';
import { useMenu, useChapters } from '@/hooks/kathaaHooks';
import { useAuth } from '@/context/AuthContext';
import { CAFE, stampDate, whatsappCafe } from '@/lib/kathaa';
import { Skeleton } from '@/components/ui/skeleton';

/** Home: the cafe as a lending library. A catalogue card slides out of its pocket; four chapters follow. */
export default function HomePage() {
  const { data: menu, isLoading } = useMenu();
  const signatures = (menu ?? []).filter((d) => d.signature).slice(0, 4);
  const { isAuthenticated } = useAuth();
  const { data: chapters } = useChapters();

  return (
    <div className="overflow-x-clip">
      {/* ── Hero: a library index card in its pocket ── */}
      <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 md:grid-cols-[1fr_minmax(0,34rem)] md:pt-16">
        <div className="order-2 flex flex-col justify-end md:order-1">
          <p className="kt-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Book café · FC Road, Pune · since the bungalow days
          </p>
          <p className="mt-6 max-w-md text-xl leading-relaxed">
            An old bungalow off Fergusson College Road with a wall of books, Kindles on the tables, a garden where
            dogs are welcome — and a kitchen that puts apple crumble on a pizza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="kt-tap bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/book">Save a table <ArrowRight className="ml-1" size={18} /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="kt-tap">
              <Link to="/menu">Order takeaway</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            ★ {CAFE.rating} on Google from {CAFE.reviews} reviews · Veg & non-veg · UPI accepted
          </p>
        </div>

        <div className="relative order-1 md:order-2">
          {/* the card */}
          <Reveal variant="slide-card" className="relative z-10">
            <div className="kt-card flex min-h-[23rem] gap-4 px-4 pb-14 pt-6 sm:px-6">
              <p lang="mr" aria-hidden className="kt-display kt-spine select-none text-6xl leading-none text-accent sm:text-7xl">
                कथा
              </p>
              <div className="min-w-0 flex-1 pl-6">
                <p className="kt-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Call no. 411004 · FC Rd
                </p>
                <h1 id="hero-title" className="kt-display mt-2 text-5xl leading-[1.05] sm:text-6xl">
                  Cafe Kathaa
                </h1>
                <p className="mt-2 text-lg italic text-muted-foreground">Every table has a story. Borrow one.</p>
                <dl className="kt-mono mt-6 space-y-[0.55rem] text-sm">
                  {[
                    ['Borrow', 'a table', '/book', 'Library room or garden verandah'],
                    ['Borrow', 'a desk', '/book?zone=writing-desks', 'Wi-Fi · three quiet hours'],
                    ['Borrow', 'a book', '/shelf', 'We keep it at your table'],
                  ].map(([k, v, href, hint]) => (
                    <div key={href} className="grid grid-cols-[4.5rem_1fr] items-baseline gap-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>
                        <Link to={href} className="kt-link text-base font-semibold text-foreground">{v}</Link>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <span className="kt-hole" aria-hidden />
            </div>
          </Reveal>
          <div className="absolute -right-2 top-3 z-20 sm:right-4">
            <Reveal variant="stamp" delay={650}>
              <Stamp round label={`Open today, ${stampDate()}`}>Open<br />{stampDate()}</Stamp>
            </Reveal>
          </div>
          {/* the pocket */}
          <div aria-hidden className="kt-pocket relative z-20 -mt-10 h-24 rounded-b-sm">
            <p className="kt-mono pt-12 text-center text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
              Please return stories to the shelf
            </p>
          </div>
        </div>
      </section>

      {/* ── Ch. 01 Who we are ── */}
      <section aria-labelledby="ch1" className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <ChapterHeading id="ch1" number="01" accent="आम्ही" title="A bungalow that kept its verandah"
              intro="Kathaa lives in an old-school bungalow in a lane off FC Road — opposite Hotel Vaishali, beside the old British Library building. The verandah and garden stayed; the kitchen moved in; the books took the walls." />
            <Link to="/story" className="kt-link mt-6 inline-block text-lg">Read the whole story →</Link>
          </Reveal>
          <Reveal className="relative md:col-span-6 md:col-start-7" delay={120}>
            <figure className="relative">
              <img
                src={CAFE.photo} alt="Cafe Kathaa — the bungalow café off FC Road, Pune"
                loading="lazy" width={426} height={240}
                className="aspect-[16/10] w-full rounded-sm border border-border object-cover"
              />
              <figcaption className="kt-card-plain kt-mono absolute -bottom-6 left-4 max-w-[16rem] px-3 py-2 text-xs text-muted-foreground sm:left-[-1.5rem]">
                Plate I · The bungalow, Ganeshwadi
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ── Ch. 02 What we make ── */}
      <section aria-labelledby="ch2" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <ChapterHeading id="ch2" number="02" accent="पदार्थ" title="House picks, in order of argument"
            intro="Things regulars come back for — order them for pickup at the counter, pay by UPI." />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          {signatures.map((d, i) => (
            <Reveal key={d.id} variant="stamp" delay={i * 90} className="h-full">
              <DishCard dish={d} index={i} />
            </Reveal>
          ))}
        </div>
        {!isLoading && signatures.length === 0 && (
          <p className="mt-8 text-muted-foreground">The menu is being re-shelved. Try again in a moment.</p>
        )}
        <Link to="/menu" className="kt-link mt-8 inline-block text-lg">See the whole menu →</Link>
      </section>

      {/* ── Ch. 03 Why people return ── */}
      <section aria-labelledby="ch3" className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="kt-mono flex items-center gap-3 text-xs uppercase tracking-[0.2em] opacity-80">
              <span>Ch. 03</span><span className="h-px flex-1 bg-primary-foreground/30" aria-hidden />
            </p>
            <h2 id="ch3" className="kt-display mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">
              Why the same people keep coming back
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-sm bg-primary-foreground/20 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpen, t: 'A wall loaded with books', b: 'Fiction, non-fiction and Kindles on the tables. Read here, or ask us to keep one at your table.' },
              { icon: Dog, t: 'Bring the dog', b: 'Pet-friendly, with outdoor seating in the garden by the wall of potted plants.' },
              { icon: Wifi, t: 'Writers’ corner', b: 'Good Wi-Fi made it a haunt for writers, freelancers and every college nearby.' },
              { icon: Coffee, t: '“Extremely cozy”', b: 'Old-world charm is the phrase reviewers keep reaching for. Weekends fill up — save a seat.' },
            ].map(({ icon: Icon, t, b }, i) => (
              <li key={t} className="bg-primary p-6">
                <Reveal delay={i * 80}>
                  <span className="kt-mono text-xs opacity-70">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className="mt-3" size={26} aria-hidden />
                  <h3 className="mt-3 text-xl font-semibold">{t}</h3>
                  <p className="mt-2 opacity-90">{b}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Ch. 04 Visit / book ── */}
      <section aria-labelledby="ch4" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
        <Reveal>
          <ChapterHeading id="ch4" number="04" accent="भेट" title="Come in, or take a chapter home"
            intro="Tables and writing desks book free in under a minute. Takeaway is ready at the counter." />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="kt-tap"><Link to="/book">Book a table</Link></Button>
            <Button asChild size="lg" variant="outline" className="kt-tap"><Link to="/book?zone=writing-desks">Book a writing desk</Link></Button>
          </div>
          {isAuthenticated && chapters?.enabled && (
            <p className="mt-6 text-base">
              Your stamp card: <strong>{chapters.stampsInCurrentChapter}</strong> of {chapters.stampsPerChapter} stamps
              this chapter. <Link to="/my-kathaa" className="kt-link">Open My Kathaa</Link>
            </p>
          )}
        </Reveal>
        <Reveal delay={120}>
          <div className="kt-card px-6 py-6 pl-12">
            <p className="kt-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Hours</p>
            <ul className="mt-2 space-y-1 text-lg">
              {CAFE.hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-4"><span>{h.days}</span><span className="kt-mono">{h.time}</span></li>
              ))}
            </ul>
            <p className="kt-mono mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Find us</p>
            <p className="mt-2">{CAFE.address}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="kt-tap"><a href={CAFE.maps} target="_blank" rel="noreferrer"><MapPin size={18} className="mr-1" /> Directions</a></Button>
              <Button asChild variant="outline" className="kt-tap"><a href={`tel:${CAFE.phoneTel}`}><Phone size={18} className="mr-1" /> Call</a></Button>
              <Button asChild variant="outline" className="kt-tap"><a href={whatsappCafe('Hi Cafe Kathaa! ')} target="_blank" rel="noreferrer"><MessageCircle size={18} className="mr-1" /> WhatsApp</a></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
