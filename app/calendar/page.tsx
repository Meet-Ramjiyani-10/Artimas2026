import type { Metadata } from 'next';
import SubpageLayout from '@/components/SubpageLayout';

export const metadata: Metadata = {
  title: 'Festival Schedule & Timeline • Artimas',
  description: 'Chronicles of Time — The day-by-day event schedule and timeline for Artimas.',
};

const SCHEDULE_DAYS = [
  {
    day: 'Day 1 • Inception & Genesis',
    yuga: 'Satya & Treta Yuga',
    date: '18 - 19 OCTOBER 2026',
    badge: 'Genesis & Trials',
    desc: 'The inaugural epochs of Artimas. Guild assembly, ceremonial opening keynotes, and the commencement of foundational artificial intelligence & design trials.',
    milestones: [
      { time: '09:30 AM', title: 'Grand Opening Keynote & Guild Assembly' },
      { time: '11:00 AM', title: 'Datathon — The Cosmic Data Odyssey' },
      { time: '02:00 PM', title: 'Prompt Relay — Generative AI Duel' },
      { time: '04:30 PM', title: 'Brandathon — Brand Genesis Sprint' },
      { time: '07:00 PM', title: 'Surprise Event Revelation & Lightning Tech Talks' },
    ],
  },
  {
    day: 'Day 2 • Duels & Ascendance',
    yuga: 'Dwapara & Kali Yuga',
    date: '20 OCTOBER 2026',
    badge: 'Arena & Grand Finale',
    desc: 'The battleground and transformative finale. High-octane tactical challenges, cyber warfare, escape room enigmas, 24-hour hackathons, and closing celebrations.',
    milestones: [
      { time: '09:00 AM', title: 'Capture the Flag (CTF) — Cyber Warfare Arena' },
      { time: '11:30 AM', title: 'Houdini Heist — The Enigma of Escape Room' },
      { time: '02:00 PM', title: 'Among Us — Cosmic Social Deduction Tournament' },
      { time: '04:30 PM', title: 'HackMatrix — Final Prototype Demos & Judging' },
      { time: '07:00 PM', title: 'Grand Finale, Cash Prize Ceremony & Cultural Gala' },
    ],
  },
];

export default function CalendarPage() {
  return (
    <SubpageLayout
      tag="Artimas • Chronicles of Time"
      title="Festival Schedule"
      description="The timeline across both grand festival days. Mark your calendar for keynotes, hacking sprints, battle duels, and closing celebrations."
    >
      <div className="calendar-dual-grid">
        {SCHEDULE_DAYS.map(day => (
          <div key={day.day} className="calendar-panel">
            {/* Ornamental Decree Corner Brackets */}
            <div className="decree-corner top-left" aria-hidden="true" />
            <div className="decree-corner top-right" aria-hidden="true" />
            <div className="decree-corner bottom-left" aria-hidden="true" />
            <div className="decree-corner bottom-right" aria-hidden="true" />

            <div className="calendar-panel-header">
              <div>
                <h2 className="calendar-panel-title">{day.day}</h2>
                <div className="calendar-panel-yuga">❖ {day.yuga} · {day.date}</div>
              </div>
              <span className="calendar-panel-badge">{day.badge}</span>
            </div>

            <p className="calendar-panel-desc">{day.desc}</p>

            <div className="calendar-milestones-box">
              <div className="calendar-milestones-heading">
                <span>✦</span> Key Schedule &amp; Milestones
              </div>
              <ul className="calendar-milestones-list">
                {day.milestones.map((m) => (
                  <li key={m.title} className="calendar-milestone-item">
                    <span className="calendar-milestone-dot">◆</span>
                    <span className="calendar-milestone-time">{m.time}</span>
                    <span className="calendar-milestone-name">{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </SubpageLayout>
  );
}
