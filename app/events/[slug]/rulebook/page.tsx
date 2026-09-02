import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/lib/events';
import { MEDIA } from '@/lib/media';
import SubpageLayout from '@/components/SubpageLayout';

interface RulebookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function RulebookPage({ params }: RulebookPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <SubpageLayout showHeader={false} fullWidth={true}>
      <div className="reg-stage-wrapper">
        <div className="reg-top-bar">
          <Link href="/events" className="reg-back-btn">
            ← BACK TO EVENTS
          </Link>
          <span className="reg-tag">{event.yuga} • {event.category}</span>
        </div>

        <div className="reg-card-stage">
          <div className="decree-card-panel decree-rulebook-panel">
            {/* Ornamental Decree Corner Brackets */}
            <div className="decree-corner top-left" aria-hidden="true" />
            <div className="decree-corner top-right" aria-hidden="true" />
            <div className="decree-corner bottom-left" aria-hidden="true" />
            <div className="decree-corner bottom-right" aria-hidden="true" />

            <div className="decree-inner-frame rulebook-inner-frame">
              {event.overheadTitle && (
                <span className="decree-overhead-title rulebook-overhead-title">{event.overheadTitle}</span>
              )}
              <h1 className="decree-title rulebook-main-title">{event.name}</h1>
              <p className="decree-trial-subtitle rulebook-subtitle">
                {event.ruleSubtitle || event.trialSubtitle || 'OFFICIAL RULES & GUIDELINES'}
              </p>

              <div className="decree-ornament-divider" aria-hidden="true">
                <span className="decree-divider-line" />
                <span className="decree-divider-gem">◆</span>
                <span className="decree-divider-line" />
              </div>

              <div className="rulebook-scroll-box">
                <section className="rulebook-sec">
                  <h3>I. OVERVIEW & DESCRIPTION</h3>
                  <p>{event.description}</p>
                </section>

                <section className="rulebook-sec">
                  <h3>II. TEAM COMPOSITION</h3>
                  <p>
                    {event.teamConfig.isCompulsoryFixed
                      ? `Compulsory ${event.teamConfig.minMembers} member(s) required per team.`
                      : `Teams can consist of ${event.teamConfig.minMembers} to ${event.teamConfig.maxMembers} member(s).`}
                  </p>
                </section>

                <section className="rulebook-sec">
                  <h3>III. GENERAL GUIDELINES</h3>
                  <ul>
                    <li>All participants must carry a valid College ID Card or PRN verification.</li>
                    <li>Any form of unfair means or plagiarism will lead to immediate disqualification.</li>
                    <li>Decisions of the jury and organizing committee will be final and binding.</li>
                  </ul>
                </section>
              </div>

              <div className="decree-btn-group rulebook-btn-row">
                <Link href={event.registerUrl} className="decree-btn register-action-btn">
                  ENTER THE TRIAL (₹{event.fee})
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubpageLayout>
  );
}
