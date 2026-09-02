import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import TeamGrid from '@/components/TeamGrid';

export const metadata: Metadata = {
  title: 'The Council & Leads • Artimas',
  description: 'The architects, developers, creative leads, and organizers behind Artimas.',
};

export default function TeamPage() {
  return (
    <SubpageLayout
      tag="THE ARCHITECTS"
      title="COUNCIL & LEADS"
      description="The organizers, developers, designers, and leads orchestrating the Artimas experience."
      showHeader={true}
      fullWidth={false}
      showFooter={true}
    >
      <TeamGrid />
    </SubpageLayout>
  );
}
