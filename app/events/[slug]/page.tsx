import { redirect } from 'next/navigation';

interface EventSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventSlugPage({ params }: EventSlugPageProps) {
  const { slug } = await params;
  redirect(`/events/${slug}/register`);
}
