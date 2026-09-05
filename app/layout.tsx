import type { Metadata } from 'next';
import { Cinzel_Decorative, Cormorant_Garamond } from 'next/font/google';
import PageTransitionLoader from '@/components/PageTransitionLoader';
import { MEDIA } from '@/lib/media';
import './globals.css';

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-title',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Artimas',
  description: 'Artimas — Immersive parallax depth and cosmic Yugas experience.',
  icons: {
    icon: [
      { url: MEDIA.images.kalchakra, type: 'image/webp' },
      { url: '/favicon.webp', type: 'image/webp' },
      { url: '/favicon.ico' },
    ],
    shortcut: MEDIA.images.kalchakra,
    apple: MEDIA.images.kalchakra,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cinzelDecorative.variable} ${cormorantGaramond.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="icon" type="image/webp" href={MEDIA.images.kalchakra} />
        <link rel="apple-touch-icon" href={MEDIA.images.kalchakra} />
      </head>
      <body>
        <PageTransitionLoader />
        {children}
      </body>
    </html>
  );
}
