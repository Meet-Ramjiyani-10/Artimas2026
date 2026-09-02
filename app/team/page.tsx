import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import TeamCarousel from '@/components/TeamCarousel';

export const metadata: Metadata = {
  title: 'The Council & Leads • Artimas',
  description: 'The architects, developers, creative leads, and organizers behind Artimas.',
};

export default function TeamPage() {
  return (
    <SubpageLayout showHeader={false} fullWidth={true} showFooter={true}>
      <TeamCarousel />
    </SubpageLayout>
  );
}
