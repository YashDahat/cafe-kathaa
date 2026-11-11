// Small helpers shared by the Cafe Kathaa pages.
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** ₹ with Indian digit grouping, e.g. ₹1,25,000. */
export const rupees = (n: number | null | undefined) => inr.format(Number(n ?? 0));

export const CAFE = {
  name: 'Cafe Kathaa',
  phoneDisplay: '+91 91194 96767',
  phoneTel: '+919119496767',
  whatsapp: '919119496767',
  instagram: 'https://www.instagram.com/cafekathaa/',
  maps: 'https://www.google.com/maps/dir/?api=1&destination=18.520764,73.8405691&destination_place_id=ChIJRecQlI6_wjsRdAd2NBK8S1c',
  mapsPlace: 'https://www.google.com/maps/place/?q=place_id:ChIJRecQlI6_wjsRdAd2NBK8S1c',
  address: 'FC Road Lane, opposite Hotel Vaishali, next to the old British Library building, Ganeshwadi, Pune 411004',
  hours: [
    { days: 'Mon – Thu', time: '10:00 AM – 10:30 PM' },
    { days: 'Fri – Sun', time: '8:00 AM – 10:30 PM' },
  ],
  rating: 4.2,
  reviews: '5,600+',
  // Real photo of the cafe from its Google listing.
  photo:
    'https://lh3.googleusercontent.com/grass-cs/AABkmLcYU5B6Fjh8cL6Krw1Cjj9gPGTiQppQFQ_3b9w9gSB1wQ2U0vexnNf8dWwaYXKgkEzuPbeQ-h-I_vkvshI3Bu1UMcVXHi6C8ysD_uoy7Q95TEEbN0Dzi9brNI4udwTPshjVtrmV=w426-h240-k-no',
};

export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const whatsappCafe = (text: string) => `https://wa.me/${CAFE.whatsapp}?text=${encodeURIComponent(text)}`;

/** Local YYYY-MM-DD for "today + n days" in the visitor's clock (the cafe is in IST; slots are validated server-side). */
export function isoDay(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function prettyDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts);
}

export function prettySlot(slotKey: string) {
  const [date, time] = slotKey.split('T');
  const [h, min] = time.split(':').map(Number);
  const t = new Date(2000, 0, 1, h, min).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${prettyDay(date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${t}`;
}

export function prettyTime(hhmm: string) {
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, min).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Library due-date style stamp text, e.g. "10 NOV". */
export const stampDate = (d = new Date()) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();

export const TABLE_STAGES = [
  { code: 'CONFIRMED', label: 'Confirmed' },
  { code: 'SEATED', label: 'Seated' },
  { code: 'FINISHED', label: 'Finished' },
];
export const TAKEAWAY_STAGES = [
  { code: 'ACCEPTED', label: 'Accepted' },
  { code: 'IN_KITCHEN', label: 'In the kitchen' },
  { code: 'READY', label: 'Ready' },
  { code: 'COLLECTED', label: 'Collected' },
];
