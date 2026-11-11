// Cafe Kathaa site shell configuration (header + footer). Colours follow the theme tokens in index.css.
import type { SiteConfig } from '@/shell';

export const siteConfig: SiteConfig = {
  header: {
    brandName: 'Cafe Kathaa',
    logoUrl: null,
    navLinks: [
      { label: 'Menu', href: '/menu' },
      { label: 'The Shelf', href: '/shelf' },
      { label: 'Our Story', href: '/story' },
      { label: 'Events', href: '/events' },
      { label: 'Visit', href: '/visit' },
      { label: 'My Kathaa', href: '/my-kathaa' },
    ],
    ctaButton: { label: 'Book a table', href: '/book' },
    showAuth: true,
    showCart: true,
    hoverClass: 'hover:text-accent',
    ctaClass: 'bg-accent text-accent-foreground hover:bg-accent/90',
  },
  footer: {
    brandName: 'Cafe Kathaa · कथा',
    tagline: 'A book café in an old bungalow off FC Road. Kathaa means story — come in and add a page.',
    address: 'FC Road Lane, opposite Hotel Vaishali, next to the old British Library building, Ganeshwadi, Pune 411004',
    phone: '+91 91194 96767',
    email: null,
    openingHours: 'Mon–Thu 10 AM–10:30 PM · Fri–Sun 8 AM–10:30 PM',
    quickLinks: [
      { label: 'Book a table or desk', href: '/book' },
      { label: 'Takeaway menu', href: '/menu' },
      { label: 'The Shelf', href: '/shelf' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'My orders', href: '/orders' },
      { label: 'Help', href: '/support' },
    ],
    socialLinks: [
      { platform: 'instagram', url: 'https://www.instagram.com/cafekathaa/' },
      { platform: 'whatsapp', url: 'https://wa.me/919119496767' },
    ],
    accentClass: 'text-accent',
  },
};

export default siteConfig;
