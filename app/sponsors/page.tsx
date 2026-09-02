import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import SponsorsGrid from '@/components/SponsorsGrid';

export const metadata: Metadata = {
  title: 'Honored Sponsors & Partners • Artimas',
  description: 'Meet the visionary patrons, industry leaders, and tech partners empowering Artimas.',
};

export default function SponsorsPage() {
  return (
    <SubpageLayout
      tag="PATRONS & PARTNERS"
      title="HONORED SPONSORS"
      description="The visionary organizations and industry leaders empowering the festival of cosmic epochs."
      showHeader={true}
      fullWidth={false}
      showFooter={true}
    >
      <SponsorsGrid />
    </SubpageLayout>
  );
}
