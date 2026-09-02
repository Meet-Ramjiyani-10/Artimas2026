import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import ScrollCarousel from '@/components/ScrollCarousel';

export const metadata: Metadata = {
  title: 'Events & Challenges • Artimas',
  description: 'Chronicles & Quests of Artimas.',
};

export default function EventsPage() {
  return (
    <SubpageLayout
      tag="CHRONICLES & TRIALS"
      title="EVENTS & CHALLENGES"
      description="Explore the trials, hackathons, cyber arenas, and creative duels across all four cosmic epochs."
      showHeader={true}
      fullWidth={false}
      showFooter={true}
    >
      <ScrollCarousel />
    </SubpageLayout>
  );
}
