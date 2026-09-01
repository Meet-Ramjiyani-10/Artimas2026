import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';

export const metadata: Metadata = {
  title: 'Honored Sponsors & Partners • Artimas',
  description: 'Meet the visionary patrons, industry leaders, and tech partners empowering Artimas.',
};

const SPONSORS = [
  {
    title: 'Cosmic Title Patron',
    badge: 'Titan Tier',
    desc: 'Leading technological vanguard empowering Artimas with grand compute, ecosystem grants, and visionary keynote mentorship.',
  },
  {
    title: 'Golden Chakra Partners',
    badge: 'Cloud Infrastructure',
    desc: 'Powering high-concurrency event hosting, live platform streams, developer cloud credits, and developer tooling packages.',
  },
  {
    title: 'Celestial Hardware Guilds',
    badge: 'Hardware & Kits',
    desc: 'Providing high-performance workstations, edge compute microcontrollers, IoT devkits, and specialized robotics components.',
  },
  {
    title: 'Guild Ecosystem Partners',
    badge: 'Community Network',
    desc: 'Global developer networks, startup incubators, campus ambassadors, and student innovation chapters expanding our cosmic reach.',
  },
];

export default function SponsorsPage() {
  return (
    <SubpageLayout
      tag="Artimas • Revered Patrons"
      title="Honored Sponsors"
      description="Our festival is fueled by industry leaders and technological pioneers dedicated to accelerating the next generation of engineers and creators."
    >
      <div className="island-content-grid">
        {SPONSORS.map(sponsor => (
          <div key={sponsor.title} className="island-card-item">
            <div className="island-card-title">{sponsor.title}</div>
            <div className="island-card-desc">{sponsor.desc}</div>
            <span className="island-card-badge">{sponsor.badge}</span>
          </div>
        ))}
      </div>
    </SubpageLayout>
  );
}
