import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import SponsorsCarousel from '@/components/SponsorsCarousel';

export const metadata: Metadata = {
  title: 'Honored Sponsors & Partners • Artimas',
  description: 'Meet the visionary patrons, industry leaders, and tech partners empowering Artimas.',
};

export default function SponsorsPage() {
  return (
    <SubpageLayout showHeader={false} fullWidth={true}>
      <SponsorsCarousel />
    </SubpageLayout>
  );
}

