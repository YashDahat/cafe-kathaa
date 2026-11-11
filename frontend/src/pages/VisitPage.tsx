import { Link } from 'react-router-dom';
import { Camera, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChapterHeading from '@/components/kathaa/ChapterHeading';
import Reveal from '@/components/kathaa/Reveal';
import { CAFE, whatsappCafe } from '@/lib/kathaa';

/** Contact & visit: hours, directions, call/WhatsApp, Instagram, an embedded map. */
export default function VisitPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <ChapterHeading number="V" accent="पत्ता" title="Find the bungalow"
        intro="In the lane off FC Road, opposite Hotel Vaishali, next to the old British Library building." />
      <div className="mt-10 grid gap-8 md:grid-cols-5">
        <Reveal className="md:col-span-2">
          <div className="kt-card px-5 py-6 pl-14">
            <p className="kt-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Address</p>
            <address className="mt-2 not-italic text-lg">{CAFE.address}</address>
            <p className="kt-mono mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Hours</p>
            <ul className="mt-2 space-y-1 text-lg">
              {CAFE.hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-3"><span>{h.days}</span><span className="kt-mono">{h.time}</span></li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">Weekends get packed — <Link to="/book" className="kt-link">save a table</Link>.</p>
            <div className="mt-6 grid gap-2">
              <Button asChild className="kt-tap justify-start"><a href={CAFE.maps} target="_blank" rel="noreferrer"><MapPin size={18} className="mr-2" />Get directions</a></Button>
              <Button asChild variant="outline" className="kt-tap justify-start"><a href={`tel:${CAFE.phoneTel}`}><Phone size={18} className="mr-2" />{CAFE.phoneDisplay}</a></Button>
              <Button asChild variant="outline" className="kt-tap justify-start"><a href={whatsappCafe('Hi Cafe Kathaa! ')} target="_blank" rel="noreferrer"><MessageCircle size={18} className="mr-2" />WhatsApp us</a></Button>
              <Button asChild variant="outline" className="kt-tap justify-start"><a href={CAFE.instagram} target="_blank" rel="noreferrer"><Camera size={18} className="mr-2" />@cafekathaa on Instagram</a></Button>
            </div>
          </div>
        </Reveal>
        <Reveal className="md:col-span-3" delay={120}>
          <iframe
            title="Map showing Cafe Kathaa off FC Road, Pune"
            src="https://www.google.com/maps?q=18.520764,73.8405691&z=17&output=embed"
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="h-[26rem] w-full rounded-sm border border-border"
          />
          <p className="mt-4 text-base text-muted-foreground">
            Pet-friendly · outdoor seating · wheelchair-accessible (per listing) · kids welcome · veg and non-veg.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
