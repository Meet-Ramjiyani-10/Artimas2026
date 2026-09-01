import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import ScrollCarousel from '@/components/ScrollCarousel';

export const metadata: Metadata = {
  title: 'Events & Challenges • Artimas',
  description: 'Chronicles & Quests of Artimas.',
};

export default function EventsPage() {
  return (
    <SubpageLayout showHeader={false} fullWidth={true}>
      <ScrollCarousel />
    </SubpageLayout>
  );
}
