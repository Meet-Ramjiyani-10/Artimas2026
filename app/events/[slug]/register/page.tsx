import { notFound, redirect } from 'next/navigation';
import { getEventBySlug } from '@/lib/events';
import SubpageLayout from '@/components/SubpageLayout';
import EventRegistrationWizard from '@/components/EventRegistrationWizard';

interface RegisterPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  // If hackmatrix, redirect to external registration link
  if (slug === 'hackmatrix' || slug === 'hack-matrix') {
    redirect('https://hackmatrix.gfgpccoe.in');
  }

  return (
    <SubpageLayout showHeader={false} fullWidth={true}>
      <EventRegistrationWizard event={event} />
    </SubpageLayout>
  );
}
