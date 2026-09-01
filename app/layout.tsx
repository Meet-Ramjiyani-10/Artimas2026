import type { Metadata } from 'next';
import { Cinzel_Decorative, Cormorant_Garamond } from 'next/font/google';
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzelDecorative.variable} ${cormorantGaramond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
