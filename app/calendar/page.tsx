import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';
import CalendarViewer from '@/components/CalendarViewer';

export const metadata: Metadata = {
  title: 'Official Festival Schedule & Timeline • Artimas 2026',
  description:
    'Chronicles of Time — The complete official multi-page schedule across Online Preliminary Rounds and the Grand Offline Arena Days (9th, 10th & 11th October).',
};

export default function CalendarPage() {
  return (
    <SubpageLayout
      tag="CHRONICLES OF TIME"
      title="FESTIVAL SCHEDULE"
      description="The definitive day-by-day and hour-by-hour timeline. Explore all 4 official schedule chronicles covering online qualifiers and the 3 grand offline arena days."
      showHeader={true}
      fullWidth={false}
      showFooter={true}
    >
      <CalendarViewer />
    </SubpageLayout>
  );
}

