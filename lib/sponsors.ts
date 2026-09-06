import { MEDIA } from './media';

export interface SponsorItem {
  id: string;
  name: string;
  category: string;
  tagline?: string;
  logo: string;
  alt: string;
  websiteUrl?: string;
  isDarkLogo?: boolean;
}

export interface SponsorTier {
  id: string;
  tierTag: string;
  title: string;
  description: string;
  sponsors: SponsorItem[];
}

export const MUNCHING_PARTNERS: SponsorItem[] = [
  {
    id: 'smoked-taxi',
    name: 'Smoked BBQ Taxi',
    category: 'Munching Partner',
    tagline: 'Smoked BBQ & Gourmet Grill',
    logo: MEDIA.images.sponsors.munching.smokedTaxi,
    alt: 'Smoked Taxi BBQ Logo',
    isDarkLogo: true,
  },
  {
    id: 'froyo-land',
    name: 'My Froyo Land',
    category: 'Munching Partner',
    tagline: 'Artisanal Handcrafted Frozen Yogurt',
    logo: MEDIA.images.sponsors.munching.froyoLand,
    alt: 'My Froyo Land Logo',
    isDarkLogo: false,
  },
  {
    id: 'balaji',
    name: 'Balaji Wafers',
    category: 'Munching Partner',
    tagline: 'Authentic Indian Namkeen & Savories',
    logo: MEDIA.images.sponsors.munching.balaji,
    alt: 'Balaji Namkeen & Wafers Logo',
    isDarkLogo: false,
  },
  {
    id: 'budhani',
    name: 'Budhani Bros',
    category: 'Munching Partner',
    tagline: 'Legendary Handcrafted Potato Wafers',
    logo: MEDIA.images.sponsors.munching.budhani,
    alt: 'Budhani Bros Waferwala Logo',
    isDarkLogo: false,
  },
];

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    id: 'munching-partners',
    tierTag: 'OFFICIAL REFRESHMENT & TASTE',
    title: 'MUNCHING PARTNERS',
    description: 'Fueling minds and spirits throughout the cosmic epochs of Artimas.',
    sponsors: MUNCHING_PARTNERS,
  },
];
