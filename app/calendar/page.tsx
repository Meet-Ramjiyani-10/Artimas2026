import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';

export const metadata: Metadata = {
  title: 'Festival Schedule & Timeline • Artimas',
  description: 'Chronicles of Time — The day-by-day event schedule and timeline for Artimas.',
};

const SCHEDULE_DAYS = [
  {
    day: 'Day 1 • Inception',
    yuga: 'Satya Yuga',
    badge: 'Opening & Hacks',
    desc: 'Grand Opening Ceremony, Keynote Addresses, 36-Hour Hackathon Theme Reveal, Guild Assembly, and Workshop Tracks.',
    highlights: ['10:00 AM — Opening Keynote', '02:00 PM — Hackathon Kickoff', '06:00 PM — Lightning Talks'],
  },
  {
    day: 'Day 2 • The Duels',
    yuga: 'Treta Yuga',
    badge: 'Arena & CTF',
    desc: 'Hackathon mid-evaluations, Robotics Arena Qualifiers, Celestial Astra CTF Launch, and AI Developer Workshops.',
    highlights: ['09:00 AM — CTF Starts', '01:00 PM — Robotics Qualifiers', '08:00 PM — Midnight Gaming'],
  },
  {
    day: 'Day 3 • The Crucible',
    yuga: 'Dwapara Yuga',
    badge: 'Finals & Demos',
    desc: 'Final Project Submissions, Expo Showcase, Stage Demos, Elite Judging Rounds, and Robotics Finals.',
    highlights: ['11:00 AM — Code Freeze', '02:00 PM — Expo Judging', '05:00 PM — Robotics Finals'],
  },
  {
    day: 'Day 4 • Ascendance',
    yuga: 'Kali Yuga',
    badge: 'Gala & Finale',
    desc: 'Grand Finale, Winner Felicitations, Cash Prize Ceremony, Cultural Gala, Cosmic Laser Showcase, and Afterparty.',
    highlights: ['04:00 PM — Awards Ceremony', '07:00 PM — Cultural Gala', '09:00 PM — Afterparty'],
  },
];

export default function CalendarPage() {
  return (
    <SubpageLayout
      tag="Artimas • Chronicles of Time"
      title="Festival Schedule"
      description="The timeline across all four epochs of Artimas. Mark your calendar for keynotes, hacking sprints, battle rounds, and closing celebrations."
    >
      <div className="island-content-grid">
        {SCHEDULE_DAYS.map(day => (
          <div key={day.day} className="island-card-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div className="island-card-title">{day.day}</div>
                <div style={{ fontSize: '12px', color: 'var(--panel-highlight)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                  {day.yuga}
                </div>
              </div>
              <span className="island-card-badge">{day.badge}</span>
            </div>
            <div className="island-card-desc" style={{ marginTop: '10px' }}>
              {day.desc}
            </div>
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(118, 85, 47, 0.35)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--panel-highlight)', marginBottom: '4px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Key Milestones
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--heading-ivory)' }}>
                {day.highlights.map(h => (
                  <li key={h} style={{ marginBottom: '3px' }}>• {h}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </SubpageLayout>
  );
}
