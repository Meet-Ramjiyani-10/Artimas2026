'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventItem } from '@/lib/events';
import { getIsPageTransitionLoading, subscribeToPageTransition } from '@/lib/pageTransitionState';
import WhatsAppGroupCard from './WhatsAppGroupCard';
import EventContactButton from './EventContactButton';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '');

export interface MemberData {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
}

type MemberField = keyof MemberData;
type MemberErrors = Partial<Record<MemberField, string>>;
type MemberTouched = Partial<Record<MemberField, boolean>>;

interface RegistrationSuccessData {
  registrationId: string;
  eventName: string;
  passId: string;
  teamName: string;
  paymentRequired: boolean;
  payableAmount: number;
  payment?: {
    required: boolean;
    amount: number;
    status: string;
    transactionId?: string;
    screenshotUrl?: string;
  };
  eligibility: {
    allPccoeEligible: boolean;
    pccoeMemberCount: number;
    totalMemberCount: number;
  };
  status: string;
  submissionToken?: string;
}

interface EventRegistrationWizardProps {
  event: EventItem;
}

// ── Validation Utility Functions ──
const isValidEmailFormat = (email: string): boolean => {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email.trim());
};

const isValidIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const clean = String(phone).replace(/[\s\-()]/g, '');
  const regex = /^(?:(?:\+91|91|0))?[6-9]\d{9}$/;
  return regex.test(clean);
};

const isValidInternationalPhone = (phone: string): boolean => {
  if (!phone) return false;
  const clean = String(phone).replace(/[\s\-()]/g, '');
  return /^\+?\d{7,16}$/.test(clean);
};

// ── PCCOE Batch Extraction From Email (name.surname<max 4 digits>@pccoepune.org format) ──
export const extractPccoeBatch = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  // Format: 'name' . 'surname' <numbers max 4> @pccoepune.org
  const match = trimmed.match(/^[a-z]+(?:[-.][a-z]+)*\.([a-z-]+)(\d{1,4})@pccoepune\.org$/i);
  return match ? match[2] : null;
};

export const isMemberPccoeEligible = (member: MemberData): boolean => {
  if (!member || !member.email) return false;
  return extractPccoeBatch(member.email) !== null;
};

export interface EventScheduleDetail {
  name: string;
  date: string;
  time: string;
  venue: string;
  teamSize: string;
  rounds: string;
}

export const EVENT_SCHEDULE_DATA: Record<string, EventScheduleDetail> = {
  'pixel-perfect': {
    name: 'Surprise Event',
    date: '11th Oct, 2026',
    time: '10:00 AM – 05:00 PM',
    venue: 'PCCOE Campus Arena',
    teamSize: 'Individual participation only',
    rounds: '1 Round',
  },
  'surprise-event': {
    name: 'Surprise Event',
    date: '11th Oct, 2026',
    time: '10:00 AM – 05:00 PM',
    venue: 'PCCOE Campus Arena',
    teamSize: 'Individual participation only',
    rounds: '1 Round',
  },
  'hackmatrix': {
    name: 'HackMatrix',
    date: 'Oct 9–11, 2026',
    time: '30-Hour Build Sprint',
    venue: 'Architecture Hall, Block D',
    teamSize: '3–4 members',
    rounds: '2 Rounds',
  },
  'prompt-relay': {
    name: 'Prompt Relay',
    date: 'Oct 9–10, 2026',
    time: '02:30 PM – 05:30 PM',
    venue: 'Seminar Hall, Block A',
    teamSize: '3 members (mandatory)',
    rounds: '3 Rounds',
  },
  'brandathon': {
    name: 'Brandathon',
    date: 'Oct 9–11, 2026',
    time: '09:30 AM – 12:30 PM',
    venue: 'Old Reading Hall / Block C',
    teamSize: '2–4 members',
    rounds: '3 Rounds',
  },
  'datathon': {
    name: 'Datathon',
    date: 'Oct 9–10, 2026',
    time: '05:00 PM – 08:00 PM',
    venue: 'Data Analytics Lab, Block D',
    teamSize: '1–2 members',
    rounds: '2 Rounds',
  },
  'capture-the-flag': {
    name: 'Capture the Flag',
    date: 'Oct 10–11, 2026',
    time: '01:30 PM – 04:30 PM',
    venue: 'Seminar Hall, 5th Floor Mech Building',
    teamSize: '2–4 members',
    rounds: '2 Rounds',
  },
  'houdini-heist': {
    name: 'Houdini Heist',
    date: 'Oct 10–11, 2026',
    time: '10:00 AM – 02:00 PM',
    venue: 'Auditorium / Rooms 6517–6519',
    teamSize: '3 members (exactly)',
    rounds: '3 Rounds',
  },
  'among-us': {
    name: 'Among Us',
    date: 'Oct 9–11, 2026',
    time: '03:00 PM – 07:00 PM',
    venue: 'Main Stage / Open Air Theatre',
    teamSize: 'Individual participation only',
    rounds: '3 Rounds',
  },
};

export function getEventSchedule(event: EventItem): EventScheduleDetail {
  const slugKey = event.slug.toLowerCase().trim();
  if (EVENT_SCHEDULE_DATA[slugKey]) {
    return EVENT_SCHEDULE_DATA[slugKey];
  }

  const byName = Object.values(EVENT_SCHEDULE_DATA).find(
    (item) => item.name.toLowerCase() === event.name.toLowerCase()
  );
  if (byName) return byName;

  if (event.aliases) {
    for (const alias of event.aliases) {
      if (EVENT_SCHEDULE_DATA[alias]) return EVENT_SCHEDULE_DATA[alias];
    }
  }

  return {
    name: event.name,
    date: event.dateLocation?.split('·')[0]?.trim() || 'Oct 9–11, 2026',
    time: '10:00 AM – 05:00 PM',
    venue: event.dateLocation?.split('·')[1]?.trim() || 'PCCOE Campus Arena',
    teamSize: event.teamConfig.maxMembers === 1
      ? 'Individual participation only'
      : `${event.teamConfig.minMembers}–${event.teamConfig.maxMembers} members`,
    rounds: 'Official Epoch Trial',
  };
}

function getShortVenue(venue: string): string {
  if (venue.includes('Data Analytics')) return 'Data Lab';
  if (venue.includes('Architecture')) return 'Arch Hall';
  if (venue.includes('Seminar Hall')) return 'Seminar Hall';
  if (venue.includes('Reading Hall')) return 'Reading Hall';
  if (venue.includes('Auditorium')) return 'Auditorium';
  if (venue.includes('Main Stage')) return 'Main Stage';
  if (venue.includes('/')) return venue.split('/')[0].trim();
  if (venue.includes(',')) return venue.split(',')[0].trim();
  return venue;
}

function getSubVenue(venue: string): string {
  if (venue.includes('Block D')) return 'Block D';
  if (venue.includes('Block A')) return 'Block A';
  if (venue.includes('Block C')) return 'Block C';
  if (venue.includes('5th Floor')) return '5th Fl Mech';
  if (venue.includes('6517')) return 'Rooms 6517';
  if (venue.includes('Open Air')) return 'Open Air';
  if (venue.includes(',')) return venue.split(',').slice(1).join(',').trim();
  if (venue.includes('/')) return venue.split('/')[1].trim();
  return 'Campus';
}

function EventSpecsCard({ schedule }: { schedule: EventScheduleDetail }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const specItems = [
    {
      id: 'date',
      label: 'DATE',
      shortVal: schedule.date.replace(', 2026', ''),
      subVal: '',
      fullVal: `Date: ${schedule.date}`,
      valClass: 'val-date',
    },
    {
      id: 'team',
      label: 'TEAM',
      shortVal: schedule.teamSize.toLowerCase().includes('individual')
        ? 'Solo'
        : schedule.teamSize
          .replace('members', '')
          .replace('(mandatory)', '')
          .replace('(exactly)', '')
          .trim(),
      subVal: schedule.teamSize.toLowerCase().includes('individual') ? 'Individual' : 'Members',
      fullVal: `Team Size: ${schedule.teamSize}`,
      valClass: 'val-team',
    },
    {
      id: 'rounds',
      label: 'ROUNDS',
      shortVal: schedule.rounds.replace(/rounds?/i, '').trim() || schedule.rounds,
      subVal: '',
      fullVal: `Format: ${schedule.rounds}`,
      valClass: 'val-rounds',
    },
  ];

  const activeDetail = hoveredIndex !== null
    ? specItems[hoveredIndex].fullVal
    : `${schedule.name} • ${schedule.date} • ${schedule.rounds} • ${schedule.teamSize}`;

  return (
    <aside className="circular-specs-section" aria-label="Trial Specifications">
      {/* ── Circular Header Ornament ── */}
      <div className="circular-specs-header">
        <div className="circular-header-line" />
        <div className="circular-header-badge">
          <span className="circular-gem-glyph">◯</span>
          <span>TRIAL SPECIFICATIONS &amp; SCHEDULE</span>
          <span className="circular-gem-glyph">◯</span>
        </div>
        <div className="circular-header-line" />
      </div>

      {/* ── Orbital Starlight Track with 5 Circular Astrolabe Medallions ── */}
      <div className="circular-specs-track">
        {specItems.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={item.id}
              className={`circular-chakra-node${isHovered ? ' active-hover' : ''}`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(idx)}
              role="button"
              tabIndex={0}
              aria-label={item.fullVal}
            >
              {/* Concentric Astrolabe Circles SVG */}
              <svg viewBox="0 0 130 130" className="chakra-astrolabe-svg" aria-hidden="true">
                {/* Outer Dashed Orbit Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r="61"
                  stroke="rgba(201, 164, 92, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="chakra-dash-ring"
                />
                {/* Metallic Bronze Bevel Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r="57"
                  stroke="rgba(169, 130, 61, 0.75)"
                  strokeWidth="1.5"
                />
                {/* Inner Filigree Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r="52"
                  stroke="rgba(201, 164, 92, 0.3)"
                  strokeWidth="0.8"
                />
                {/* 4 Cardinal Astrolabe Tick Marks */}
                <line x1="65" y1="4" x2="65" y2="10" stroke="rgba(254, 240, 138, 0.7)" strokeWidth="1.5" />
                <line x1="65" y1="120" x2="65" y2="126" stroke="rgba(254, 240, 138, 0.7)" strokeWidth="1.5" />
                <line x1="4" y1="65" x2="10" y2="65" stroke="rgba(254, 240, 138, 0.7)" strokeWidth="1.5" />
                <line x1="120" y1="65" x2="126" y2="65" stroke="rgba(254, 240, 138, 0.7)" strokeWidth="1.5" />
              </svg>

              {/* Inside Disc Content */}
              <div className="chakra-core-disc">
                <span className="chakra-field-label">{item.label}</span>
                <span className={`chakra-field-val ${item.valClass}`}>{item.shortVal}</span>
                {item.subVal ? <span className="chakra-field-sub">{item.subVal}</span> : null}
              </div>

              {/* Radiant Flare on Hover */}
              <div className="chakra-glow-halo" aria-hidden="true" />
            </div>
          );
        })}
      </div>

      {/* ── Active Detail Decree Banner below Circles ── */}
      <div className="circular-specs-ribbon" aria-live="polite">
        <span className="ribbon-gem">❖</span>
        <span className="ribbon-text">{activeDetail}</span>
        <span className="ribbon-gem">❖</span>
      </div>
    </aside>
  );
}

function ScrollSvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        {/* Legacy gradients for backwards compatibility */}
        <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae18c" />
          <stop offset="22%" stopColor="#dfa742" />
          <stop offset="50%" stopColor="#7a4613" />
          <stop offset="80%" stopColor="#2e1505" />
          <stop offset="100%" stopColor="#693b10" />
        </linearGradient>

        <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe699" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        {/* Masterwork Imperial Gold Cylinder Gradient for collars & rods */}
        <linearGradient id="goldCylinder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8d2" />
          <stop offset="12%" stopColor="#fae28e" />
          <stop offset="28%" stopColor="#dfa742" />
          <stop offset="52%" stopColor="#8a4f14" />
          <stop offset="78%" stopColor="#2a1103" />
          <stop offset="92%" stopColor="#562807" />
          <stop offset="100%" stopColor="#a86e22" />
        </linearGradient>

        {/* Spherical 3D shading for turned pommel bulb */}
        <radialGradient id="pommelRadial" cx="35%" cy="24%" r="72%">
          <stop offset="0%" stopColor="#fffef0" />
          <stop offset="20%" stopColor="#fce288" />
          <stop offset="48%" stopColor="#c98622" />
          <stop offset="78%" stopColor="#542306" />
          <stop offset="100%" stopColor="#180701" />
        </radialGradient>

        {/* Faceted Solar Topaz Gemstone */}
        <radialGradient id="solarGem" cx="30%" cy="26%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor="#ffe68e" />
          <stop offset="58%" stopColor="#ea580c" />
          <stop offset="88%" stopColor="#7c1c04" />
          <stop offset="100%" stopColor="#2a0601" />
        </radialGradient>

        {/* Masterwork Turned Imperial Baluster Finial */}
        <g id="finial-shape">
          {/* 1. Ferrule / Sleeve: seamlessly caps over the rod cylinder (X=54..76) */}
          <rect x="56" y="20.5" width="20" height="23" rx="1.5" fill="url(#goldCylinder)" stroke="#3d1903" strokeWidth="0.7" />
          {/* Stepped Beveled Ring at rod entrance */}
          <rect x="52" y="18" width="6" height="28" rx="2" fill="url(#goldCylinder)" stroke="#fce392" strokeWidth="0.8" />
          <line x1="55" y1="18.5" x2="55" y2="45.5" stroke="#ffeaa0" strokeWidth="0.8" opacity="0.9" />

          {/* 2. Lathe-Turned Waist (X=42..52) */}
          <path d="M 52,21 C 48,23 45,24 43,24 L 43,40 C 45,41 48,41 52,43 Z" fill="url(#goldCylinder)" />
          {/* Torus Bead */}
          <ellipse cx="42.5" cy="32" rx="3" ry="12" fill="url(#goldCylinder)" stroke="#ffeaa0" strokeWidth="0.7" />
          <ellipse cx="42" cy="23" rx="1.6" ry="1" fill="#ffffff" opacity="0.75" />

          {/* 3. Royal Pommel Bulb (X=14..40) */}
          <path
            d="M 40,23
               C 36,15 31,8 23,8
               C 14,8 11,18 11,24
               L 11,40
               C 11,46 14,56 23,56
               C 31,56 36,49 40,41 Z"
            fill="url(#pommelRadial)"
            stroke="#4a2104"
            strokeWidth="1.1"
          />

          {/* Top Petal Flute highlight */}
          <path
            d="M 39,24
               C 33,15 28,10 23,10
               C 16,10 13,18 13,23
               C 20,21 30,21 39,24 Z"
            fill="#fff5ca"
            opacity="0.65"
          />
          <ellipse cx="23" cy="13.5" rx="7.5" ry="2.2" fill="#ffffff" opacity="0.8" />

          {/* Bottom Petal Flute core shadow */}
          <path
            d="M 39,40
               C 33,49 28,54 23,54
               C 16,54 13,46 13,41
               C 20,43 30,43 39,40 Z"
            fill="#160601"
            opacity="0.75"
          />

          {/* Carved Longitudinal Ribs */}
          <path d="M 38,28 C 30,26 21,26 12,30" fill="none" stroke="#683409" strokeWidth="0.8" opacity="0.7" />
          <path d="M 38,36 C 30,38 21,38 12,34" fill="none" stroke="#2a1003" strokeWidth="0.8" opacity="0.7" />

          {/* Central Gemstone Medallion */}
          <circle cx="23" cy="32" r="8.5" fill="url(#goldCylinder)" stroke="#fae18c" strokeWidth="1.1" />
          <circle cx="23" cy="32" r="6.6" fill="#2d1203" />
          <circle cx="23" cy="32" r="5.2" fill="url(#solarGem)" stroke="#ffd777" strokeWidth="0.8" />
          <circle cx="21.2" cy="30.2" r="1.5" fill="#ffffff" opacity="0.95" />
          <circle cx="24.5" cy="33.5" r="0.7" fill="#ffffff" opacity="0.6" />

          {/* 4. Spire Tip (X=1..12) */}
          <rect x="9.5" y="24.5" width="3" height="15" rx="1.5" fill="url(#goldCylinder)" stroke="#f7d58b" strokeWidth="0.6" />
          <path
            d="M 10,26
               C 8,26 5,28 1,32
               C 5,36 8,38 10,38 Z"
            fill="url(#goldCylinder)"
            stroke="#4e2104"
            strokeWidth="0.8"
          />
          <path d="M 10,26 C 8,26 5,28 1,32 L 10,32 Z" fill="#fff3bd" opacity="0.65" />
          <path d="M 1,32 L 3,30.5 L 5,32 L 3,33.5 Z" fill="#ffffff" opacity="0.95" />
          <circle cx="1" cy="32" r="1.2" fill="#ffffff" />
        </g>

        <g id="corner-shape">
          <path
            d="M2,2 C22,2 24,8 24,14 C24,20 30,18 34,22 C24,20 20,26 20,20 C20,14 14,12 8,12 C4,12 2,8 2,2 Z"
            fill="none"
            stroke="#946222"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M2,2 C10,2 14,4 14,10" fill="none" stroke="#ba8536" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="2" cy="2" r="3.2" fill="#d99f3b" stroke="#4a2a0c" strokeWidth="0.6" />
          <circle cx="30" cy="20" r="2.2" fill="#f0be54" stroke="#4a2a0c" strokeWidth="0.5" />
        </g>
      </defs>
    </svg>
  );
}

function ScrollRodRow({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div className={`scroll-rod-row ${position}`}>
      <svg className="scroll-finial" viewBox="0 0 76 64"><use href="#finial-shape" /></svg>
      <div className="scroll-rod-bar" />
      <svg className="scroll-finial right" viewBox="0 0 76 64"><use href="#finial-shape" /></svg>
    </div>
  );
}

export default function EventRegistrationWizard({ event }: EventRegistrationWizardProps) {
  const router = useRouter();

  const isCtf = event.slug === 'capture-the-flag';
  const isPixelPerfect = ['pixel-perfect', 'surprise-event', 'surprise', 'pixelperfect', 'photography', 'secret-event'].includes(event.slug?.toLowerCase()?.trim() || '');
  const minMembers = isCtf ? 2 : (event.teamConfig?.minMembers ?? 1);
  const maxMembers = isCtf ? 4 : (event.teamConfig?.maxMembers ?? 1);
  const isSolo = maxMembers === 1;
  const schedule = getEventSchedule(event);

  // Live registration status check
  const [isRegistrationClosed, setIsRegistrationClosed] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE}/events/${event.slug}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          if (json.data.registrationOpen === false || json.data.active === false) {
            setIsRegistrationClosed(true);
          }
        }
      })
      .catch(() => { })
      .finally(() => setIsCheckingStatus(false));
  }, [event.slug]);

  // Multi-step state:
  // Step 0: Team Name / Participant Name
  // Step 1: Member Details
  // Step 2: Confirmation Decree & Payment
  const [step, setStep] = useState<number>(0);
  const [teamName, setTeamName] = useState<string>('');
  const [teamNameTouched, setTeamNameTouched] = useState<boolean>(false);
  const [teamNameError, setTeamNameError] = useState<string>('');

  const [members, setMembers] = useState<MemberData[]>([
    { name: '', email: '', phone: '', college: '', year: 'FE', branch: '' },
  ]);
  const [currentMemberIndex, setCurrentMemberIndex] = useState<number>(0);

  // Field validation and touched states per member
  const [fieldErrors, setFieldErrors] = useState<Record<number, MemberErrors>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<number, MemberTouched>>({});

  // Duplicate email check cache per event: email -> { available: boolean; message?: string }
  const emailCheckCacheRef = useRef<Record<string, { available: boolean; message?: string }>>({});
  const [checkingEmailIndex, setCheckingEmailIndex] = useState<number | null>(null);

  // Duplicate email check against server
  const checkEmailRegistered = useCallback(
    async (email: string, memberIdx: number): Promise<string> => {
      const trimmed = email.trim();
      if (!trimmed || !isValidEmailFormat(trimmed)) return '';

      // PCCOE email format check: if format is invalid, let standard validator handle it
      if (trimmed.toLowerCase().endsWith('@pccoepune.org') && !extractPccoeBatch(trimmed)) {
        return '';
      }

      const normalized = trimmed.toLowerCase();
      // Check cache first
      if (emailCheckCacheRef.current[normalized]) {
        const cached = emailCheckCacheRef.current[normalized];
        if (!cached.available) {
          const err = cached.message || 'This email is already registered for this event.';
          setFieldErrors((prev) => ({
            ...prev,
            [memberIdx]: {
              ...prev[memberIdx],
              email: err,
            },
          }));
          return err;
        }
        return '';
      }

      setCheckingEmailIndex(memberIdx);
      try {
        const res = await fetch(`${API_BASE}/registrations/check-email?_t=${Date.now()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventSlug: event.slug,
            email: trimmed,
          }),
        });
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          emailCheckCacheRef.current[normalized] = {
            available: data.available,
            message: data.message,
          };
          if (!data.available) {
            const err = data.message || 'This email is already registered for this event.';
            setFieldErrors((prev) => ({
              ...prev,
              [memberIdx]: {
                ...prev[memberIdx],
                email: err,
              },
            }));
            return err;
          } else {
            // If it was previously marked duplicate, clear it if still duplicate error
            setFieldErrors((prev) => {
              const currentErr = prev[memberIdx]?.email;
              if (currentErr && (currentErr.includes('already registered') || currentErr.includes('cannot be used'))) {
                return {
                  ...prev,
                  [memberIdx]: {
                    ...prev[memberIdx],
                    email: '',
                  },
                };
              }
              return prev;
            });
            return '';
          }
        }
      } catch (e) {
        // Network error - do not block
      } finally {
        setCheckingEmailIndex(null);
      }
      return '';
    },
    [event.slug]
  );

  // Debounced real-time duplicate email check while typing (300ms)
  const currentMemberEmail = members[currentMemberIndex]?.email || '';
  useEffect(() => {
    const trimmed = currentMemberEmail.trim();
    if (!trimmed || !isValidEmailFormat(trimmed)) return;
    if (trimmed.toLowerCase().endsWith('@pccoepune.org') && !extractPccoeBatch(trimmed)) {
      return;
    }

    const timer = setTimeout(() => {
      checkEmailRegistered(trimmed, currentMemberIndex);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentMemberEmail, currentMemberIndex, checkEmailRegistered]);

  // Payment UI state (for Step 2)
  const [transactionId, setTransactionId] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [paymentErrors, setPaymentErrors] = useState<{ transactionId?: string; screenshot?: string }>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationSuccessData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ── Medieval Unrolling Scroll Animation State ──
  const [isScrollOpen, setIsScrollOpen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const [hasOpenedInitially, setHasOpenedInitially] = useState<boolean>(false);

  // Open the scroll immediately as the page loading animation ends
  useEffect(() => {
    if (hasOpenedInitially) return;

    let openTimer: NodeJS.Timeout | null = null;
    let checkInterval: NodeJS.Timeout | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const checkAndTriggerOpen = () => {
      // If full-screen page loader is actively covering the screen (opaque), wait
      const isOpaqueLoaderInDom =
        typeof document !== 'undefined' &&
        !!document.querySelector('.mythic-page-loader:not(.loader-fade-out)');

      if (isOpaqueLoaderInDom) {
        return false;
      }

      // Loader has cleared or started fading out! Open the scroll immediately
      if (openTimer) clearTimeout(openTimer);
      openTimer = setTimeout(() => {
        setIsScrollOpen(true);
        setHasOpenedInitially(true);
      }, 50);

      return true;
    };

    // Attempt immediately (instant on direct load/refresh)
    checkAndTriggerOpen();

    // Listen for page transition loader updates
    const unsubscribe = subscribeToPageTransition((isLoading) => {
      if (!isLoading) {
        checkAndTriggerOpen();
      }
    });

    const handleLoaderEnd = () => {
      checkAndTriggerOpen();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('artimas:loader-end', handleLoaderEnd);
    }

    // Fast interval polling to catch exact moment loader fades
    checkInterval = setInterval(() => {
      if (checkAndTriggerOpen()) {
        if (checkInterval) clearInterval(checkInterval);
      }
    }, 50);

    // Fast safety fallback: ensure scroll is open within 1s maximum
    safetyTimer = setTimeout(() => {
      setIsScrollOpen(true);
      setHasOpenedInitially(true);
      if (checkInterval) clearInterval(checkInterval);
    }, 1000);

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('artimas:loader-end', handleLoaderEnd);
      }
      if (openTimer) clearTimeout(openTimer);
      if (checkInterval) clearInterval(checkInterval);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [hasOpenedInitially]);

  // Smooth scroll roll-shut -> update step -> roll-open transition
  const transitionStep = (callback: () => void) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsScrollOpen(false);

    // Roll closed (750ms duration)
    setTimeout(() => {
      callback();
      // Tick to let React state commit before reopening
      setTimeout(() => {
        setIsScrollOpen(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 750);
      }, 50);
    }, 750);
  };

  // ── Single Field Validator ──
  const validateSingleField = (
    field: MemberField,
    value: string,
    memberIdx: number,
    currentMembersList: MemberData[] = members
  ): string => {
    const val = (value || '').trim();

    switch (field) {
      case 'name':
        if (!val) return 'Full name is required.';
        if (val.length < 2) return 'Full name must be at least 2 characters.';
        return '';

      case 'email':
        if (!val) return 'Email ID is required.';
        if (!isValidEmailFormat(val)) return 'Please enter a valid email address.';
        // If official PCCOE email is used, enforce name.surname<numbers max 4>@pccoepune.org format
        if (val.trim().toLowerCase().endsWith('@pccoepune.org')) {
          const batch = extractPccoeBatch(val);
          if (!batch) {
            return 'PCCOE email format for free registration: name.surname<numbers max 4>@pccoepune.org (e.g. first.last24@pccoepune.org)';
          }
        }
        // Duplicate check within team (case-insensitive)
        for (let i = 0; i < currentMembersList.length; i++) {
          if (i !== memberIdx && currentMembersList[i].email?.trim().toLowerCase() === val.toLowerCase()) {
            return 'This email is already used by another team member.';
          }
        }

        // Duplicate check against existing event registrations in database
        const cachedCheck = emailCheckCacheRef.current[val.toLowerCase()];
        if (cachedCheck && cachedCheck.available === false) {
          return cachedCheck.message || 'This email is already registered for this event.';
        }

        return '';

      case 'phone':
        if (!val) return 'Phone number is required.';
        if (isPixelPerfect) {
          if (!isValidInternationalPhone(val)) {
            return 'Please enter a valid phone number (7–16 digits).';
          }
        } else {
          if (!isValidIndianPhone(val)) {
            return 'Please enter a valid 10-digit Indian mobile number.';
          }
        }
        const cleanPhone = isPixelPerfect
          ? val.replace(/[\s\-()]/g, '')
          : val.replace(/[\s\-()]/g, '').slice(-10);
        for (let i = 0; i < currentMembersList.length; i++) {
          if (i !== memberIdx) {
            const otherClean = isPixelPerfect
              ? (currentMembersList[i].phone || '').replace(/[\s\-()]/g, '')
              : (currentMembersList[i].phone || '').replace(/[\s\-()]/g, '').slice(-10);
            if (otherClean && otherClean === cleanPhone) {
              return 'This phone number is already used by another team member.';
            }
          }
        }
        return '';

      case 'college':
        if (!val) return 'College name is required.';
        return '';

      case 'year':
        if (!val) return 'Please select your academic year.';
        return '';

      case 'branch':
        if (!val) return 'Branch / Department is required.';
        return '';

      default:
        return '';
    }
  };

  // ── Validate entire member form ──
  const validateMember = (memberIdx: number, membersList: MemberData[] = members): MemberErrors => {
    const m = membersList[memberIdx] || {
      name: '',
      email: '',
      phone: '',
      college: '',
      year: 'FE',
      branch: '',
    };
    const errors: MemberErrors = {};

    const nameErr = validateSingleField('name', m.name, memberIdx, membersList);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateSingleField('email', m.email, memberIdx, membersList);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validateSingleField('phone', m.phone, memberIdx, membersList);
    if (phoneErr) errors.phone = phoneErr;

    const collegeErr = validateSingleField('college', m.college, memberIdx, membersList);
    if (collegeErr) errors.college = collegeErr;

    const yearErr = validateSingleField('year', m.year, memberIdx, membersList);
    if (yearErr) errors.year = yearErr;

    const branchErr = validateSingleField('branch', m.branch, memberIdx, membersList);
    if (branchErr) errors.branch = branchErr;

    return errors;
  };

  // ── Step 0: Team Name Validation & Next ──
  const validateTeamName = (val: string): string => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return isSolo ? 'Participant name is required.' : 'Team name is required.';
    }
    if (trimmed.length < 2) {
      return isSolo ? 'Name must be at least 2 characters.' : 'Team name must be at least 2 characters.';
    }
    return '';
  };

  const handleTeamNameChange = (val: string) => {
    setTeamName(val);
    if (teamNameTouched) {
      setTeamNameError(validateTeamName(val));
    }
  };

  const handleTeamNameBlur = () => {
    setTeamNameTouched(true);
    setTeamNameError(validateTeamName(teamName));
  };

  const handleTeamNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamNameTouched(true);
    const err = validateTeamName(teamName);
    setTeamNameError(err);

    if (err) return;

    setErrorMessage('');
    transitionStep(() => {
      setStep(1);
      setCurrentMemberIndex(0);
    });
  };

  // ── Step 1: Member Field Changes & Blurs ──
  // Preserve exact casing entered by user for all fields, especially email
  const handleFieldChange = (field: MemberField, value: string) => {
    setMembers((prev) => {
      const updated = [...prev];
      if (updated[currentMemberIndex]) {
        updated[currentMemberIndex] = { ...updated[currentMemberIndex], [field]: value };
      }

      if (fieldTouched[currentMemberIndex]?.[field] || fieldErrors[currentMemberIndex]?.[field]) {
        const error = validateSingleField(field, value, currentMemberIndex, updated);
        setFieldErrors((prevErr) => ({
          ...prevErr,
          [currentMemberIndex]: {
            ...prevErr[currentMemberIndex],
            [field]: error,
          },
        }));
      }

      return updated;
    });

    if (field === 'email' && value.trim() && isValidEmailFormat(value.trim())) {
      checkEmailRegistered(value.trim(), currentMemberIndex);
    }
  };

  const handleFieldBlur = (field: MemberField) => {
    setFieldTouched((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        ...prev[currentMemberIndex],
        [field]: true,
      },
    }));

    const currentValue = members[currentMemberIndex]?.[field] || '';
    const error = validateSingleField(field, currentValue, currentMemberIndex, members);

    setFieldErrors((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        ...prev[currentMemberIndex],
        [field]: error,
      },
    }));

    if (field === 'email' && !error && currentValue.trim()) {
      checkEmailRegistered(currentValue, currentMemberIndex);
    }
  };

  // ── Step 1: Member Next Button ──
  const handleMemberNext = async (e: React.FormEvent) => {
    e.preventDefault();

    setFieldTouched((prev) => ({
      ...prev,
      [currentMemberIndex]: {
        name: true,
        email: true,
        phone: true,
        college: true,
        year: true,
        branch: true,
      },
    }));

    const errors = validateMember(currentMemberIndex, members);

    // Live verification of email before advancing
    const currentEmail = members[currentMemberIndex]?.email || '';
    if (!errors.email && currentEmail.trim()) {
      const duplicateErr = await checkEmailRegistered(currentEmail, currentMemberIndex);
      if (duplicateErr) {
        errors.email = duplicateErr;
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      [currentMemberIndex]: errors,
    }));

    if (Object.values(errors).some(Boolean)) {
      setErrorMessage(errors.email || 'Please correct the highlighted fields before proceeding.');
      return;
    }

    setErrorMessage('');

    const nextIdx = currentMemberIndex + 1;
    if (nextIdx < minMembers) {
      if (members.length <= nextIdx) {
        const current = members[currentMemberIndex];
        const newMembers = [
          ...members,
          {
            name: '',
            email: '',
            phone: '',
            college: current?.college || '',
            year: 'FE',
            branch: '',
          },
        ];
        transitionStep(() => {
          setMembers(newMembers);
          setCurrentMemberIndex(nextIdx);
        });
      } else {
        transitionStep(() => {
          setCurrentMemberIndex(nextIdx);
        });
      }
    } else {
      if (nextIdx < members.length) {
        transitionStep(() => {
          setCurrentMemberIndex(nextIdx);
        });
      } else {
        if (isCtf && ![2, 4].includes(members.length)) {
          setErrorMessage('Capture the Flag requires exactly 2 or 4 team members.');
          return;
        }
        transitionStep(() => {
          setStep(2);
        });
      }
    }
  };

  // ── Add optional member ──
  const handleAddOptionalMember = async () => {
    const errors = validateMember(currentMemberIndex, members);
    const currentEmail = members[currentMemberIndex]?.email || '';
    if (!errors.email && currentEmail.trim()) {
      const duplicateErr = await checkEmailRegistered(currentEmail, currentMemberIndex);
      if (duplicateErr) {
        errors.email = duplicateErr;
      }
    }

    if (Object.values(errors).some(Boolean)) {
      setFieldTouched((prev) => ({
        ...prev,
        [currentMemberIndex]: {
          name: true,
          email: true,
          phone: true,
          college: true,
          year: true,
          branch: true,
        },
      }));
      setFieldErrors((prev) => ({
        ...prev,
        [currentMemberIndex]: errors,
      }));
      setErrorMessage(errors.email || 'Please complete the current member details first.');
      return;
    }

    setErrorMessage('');

    if (isCtf) {
      if (members.length === 2) {
        const last = members[members.length - 1];
        const updated = [
          ...members,
          {
            name: '',
            email: '',
            phone: '',
            college: last?.college || '',
            year: 'FE',
            branch: '',
          },
          {
            name: '',
            email: '',
            phone: '',
            college: last?.college || '',
            year: 'FE',
            branch: '',
          },
        ];
        transitionStep(() => {
          setMembers(updated);
          setCurrentMemberIndex(2);
          setStep(1);
        });
      }
      return;
    }

    if (members.length < maxMembers) {
      const last = members[members.length - 1];
      const updated = [
        ...members,
        {
          name: '',
          email: '',
          phone: '',
          college: last?.college || '',
          year: 'FE',
          branch: '',
        },
      ];
      transitionStep(() => {
        setMembers(updated);
        setCurrentMemberIndex(members.length);
        setStep(1);
      });
    }
  };

  // ── Handle Previous Navigation ──
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isTransitioning) return;
    setErrorMessage('');

    if (isSuccess) {
      router.push('/events');
      return;
    }

    if (step === 2) {
      transitionStep(() => {
        setStep(1);
        setCurrentMemberIndex(members.length - 1);
      });
    } else if (step === 1) {
      if (currentMemberIndex > 0) {
        transitionStep(() => {
          setCurrentMemberIndex(currentMemberIndex - 1);
        });
      } else {
        transitionStep(() => {
          setStep(0);
        });
      }
    } else if (step === 0) {
      // Step 0 previous smoothly rolls the scroll shut and navigates to /events
      setIsTransitioning(true);
      setIsScrollOpen(false);
      setTimeout(() => {
        router.push('/events');
      }, 750);
    }
  };

  // ── Screenshot File Selection ──
  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPaymentErrors((prev) => ({
        ...prev,
        screenshot: 'Allowed formats: JPG, JPEG, PNG, or WebP.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentErrors((prev) => ({
        ...prev,
        screenshot: 'Screenshot size must not exceed 5MB.',
      }));
      return;
    }

    setScreenshotFile(file);
    setPaymentErrors((prev) => ({ ...prev, screenshot: '' }));

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Step 2: Final Submit ──
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCtf && ![2, 4].includes(members.length)) {
      setErrorMessage('Capture the Flag requires exactly 2 or 4 team members.');
      return;
    }

    // Eligibility check
    const pccoeCount = members.filter(isMemberPccoeEligible).length;
    const isAllPccoe = pccoeCount === members.length;
    const paymentRequired = !isAllPccoe && event.fee > 0;

    // Validate payment fields if payment is required
    if (paymentRequired) {
      const pErrors: { transactionId?: string; screenshot?: string } = {};
      if (!transactionId.trim()) {
        pErrors.transactionId = 'Transaction ID is required for payment verification.';
      }
      if (!screenshotFile) {
        pErrors.screenshot = 'Payment screenshot is required.';
      }

      if (Object.keys(pErrors).length > 0) {
        setPaymentErrors(pErrors);
        setErrorMessage('Please provide both the Transaction ID and Payment Screenshot.');
        return;
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let response: Response;

      if (paymentRequired && screenshotFile) {
        // Submit using FormData to stream screenshot to Cloudinary
        const formData = new FormData();
        formData.append('eventSlug', event.slug);
        formData.append('teamName', teamName.trim() || members[0]?.name || '');
        formData.append('members', JSON.stringify(members));
        formData.append('transactionId', transactionId.trim());
        formData.append('paymentScreenshot', screenshotFile);

        response = await fetch(`${API_BASE}/registrations`, {
          method: 'POST',
          body: formData,
          cache: 'no-store',
        });
      } else {
        // Submit JSON for ₹0 PCCOE registrations
        response = await fetch(`${API_BASE}/registrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({
            eventSlug: event.slug,
            teamName: teamName.trim() || members[0]?.name || '',
            members,
          }),
          cache: 'no-store',
        });
      }

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      if (!data) {
        if (!response.ok) {
          throw new Error(
            response.status === 404 || response.status === 502 || response.status === 503
              ? 'Unable to reach backend server. Please verify the backend service is deployed and running.'
              : `Server returned an error (${response.status}). Please try again.`
          );
        }
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      if (!response.ok || !data.success) {
        if (response.status === 409 || data.clashingEmail) {
          // Identify clashing email and member
          const clashingEmail = (data.clashingEmail || '').trim().toLowerCase();
          let clashIdx = members.findIndex(
            (m) => (m.email || '').trim().toLowerCase() === clashingEmail
          );
          if (clashIdx === -1 && data.message) {
            clashIdx = members.findIndex((m) =>
              data.message.toLowerCase().includes((m.email || '').trim().toLowerCase())
            );
          }
          if (clashIdx === -1) clashIdx = 0;

          const clashMsg = data.message || 'This email is already registered for this event.';

          if (clashingEmail) {
            emailCheckCacheRef.current[clashingEmail] = {
              available: false,
              message: clashMsg,
            };
          }

          // Mark error on that member's email field and navigate back to Step 1 on that member
          setFieldErrors((prev) => ({
            ...prev,
            [clashIdx]: {
              ...prev[clashIdx],
              email: clashMsg,
            },
          }));
          setFieldTouched((prev) => ({
            ...prev,
            [clashIdx]: {
              ...prev[clashIdx],
              email: true,
            },
          }));

          setErrorMessage(clashMsg);
          transitionStep(() => {
            setStep(1);
            setCurrentMemberIndex(clashIdx);
          });
          return;
        }

        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(' • '));
        }
        throw new Error(data.message || 'Registration failed. Please verify your details.');
      }

      transitionStep(() => {
        setRegistrationResult(data.data);
        setIsSuccess(true);
      });
    } catch (error: any) {
      const msg = error?.message || '';
      if (
        msg === 'Failed to fetch' ||
        msg.includes('is not valid JSON') ||
        msg.includes('Unexpected token') ||
        msg.includes('NetworkError')
      ) {
        setErrorMessage('Unable to reach backend server. Please ensure the backend service is running and accessible.');
      } else {
        setErrorMessage(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberTitle = (index: number) => {
    if (isSolo) return 'PARTICIPANT DETAILS';
    if (index === 0) return 'TEAM LEADER';
    if (index === 1) return isCtf ? 'SECOND AGENT' : 'SECOND MEMBER';
    if (index === 2) return isCtf ? 'THIRD AGENT' : 'THIRD MEMBER';
    if (index === 3) return isCtf ? 'FOURTH AGENT' : 'FOURTH MEMBER';
    return `MEMBER ${index + 1}`;
  };

  const currentErrors = fieldErrors[currentMemberIndex] || {};
  const currentTouched = fieldTouched[currentMemberIndex] || {};

  // Eligibility calculation for step 2 preview
  const pccoeMemberCount = members.filter(isMemberPccoeEligible).length;
  const allPccoeEligible = pccoeMemberCount === members.length;
  const paymentRequired = !allPccoeEligible && event.fee > 0;

  // Derive schedule and location metadata cleanly
  const scheduleDate = schedule.date || event.dateLocation?.split('·')[0]?.trim() || '11th Oct, 2026';
  const scheduleVenue = schedule.venue || event.dateLocation?.split('·')[1]?.trim() || 'PCCOE Campus / Online Arena';
  const eventTime = schedule.time || '10:00 AM – 05:00 PM IST';

  // If registration is closed for this event, render decree closed state
  if (!isCheckingStatus && isRegistrationClosed) {
    return (
      <div className="reg-stage-wrapper">
        <ScrollSvgDefs />
        <div className="reg-top-bar">
          <Link href="/events" className="reg-back-btn reg-top-prev-btn">
            ← PREV
          </Link>
          <span className="reg-tag">{event.yuga} • {event.category}</span>
        </div>

        <div className="reg-card-stage">
          <div className={`medieval-scroll-stage stage-step-closed ${isScrollOpen ? 'open' : ''}`}>
            {/* Top Rod */}
            <ScrollRodRow position="top" />

            {/* Parchment Wrap */}
            <div className="parchment-wrap">
              <div className="parchment">
                <div className="parchment-lines" />
                <svg className="scroll-corner tl" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
                <svg className="scroll-corner tr" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
                <svg className="scroll-corner bl" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
                <svg className="scroll-corner br" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
                <div className="scroll-frame" />

                <div className="parchment-content" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  <h1 className="decree-title reg-title">{event.name}</h1>
                  <p className="decree-trial-subtitle reg-subtitle">
                    {event.category.toUpperCase()} | EPOCH TRIAL
                  </p>

                  <div className="decree-ornament-divider" aria-hidden="true" style={{ margin: '14px auto' }}>
                    <span className="decree-divider-line" />
                    <span className="decree-divider-gem">◆</span>
                    <span className="decree-divider-line" />
                  </div>

                  <div
                    style={{
                      background: 'rgba(90, 40, 25, 0.12)',
                      border: '1.5px solid #8a6a40',
                      borderRadius: '6px',
                      padding: '20px 18px',
                      margin: '20px 0',
                    }}
                  >
                    <div style={{ color: '#b91c1c', fontSize: '24px', marginBottom: '6px' }}>●</div>
                    <h3 style={{ color: 'var(--ink)', fontSize: '20px', letterSpacing: '2px', margin: '0 0 8px' }}>
                      REGISTRATION CLOSED
                    </h3>
                    <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                      Registration for <strong style={{ color: 'var(--ink)' }}>{event.name}</strong> is currently closed by the festival organizers.
                    </p>
                  </div>

                  <Link href="/events" className="reg-action-btn next-btn" style={{ maxWidth: '240px', margin: '0 auto', display: 'inline-flex' }}>
                    RETURN TO EVENTS
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Rod */}
            <ScrollRodRow position="bottom" />
          </div>

          {/* ── Event Schedule & Trial Specifications ── */}
          <EventSpecsCard schedule={schedule} />
        </div>

        {/* ── Floating Contact Us Button ── */}
        <EventContactButton currentEventSlug={event.slug} currentEventName={event.name} />
      </div>
    );
  }

  const stageStepClass = isSuccess
    ? 'stage-step-success'
    : step === 0
      ? 'stage-step-0'
      : step === 1
        ? 'stage-step-1'
        : 'stage-step-2';

  return (
    <div className="reg-stage-wrapper">
      <ScrollSvgDefs />
      {/* ── Outer Navigation Back ── */}
      <div className="reg-top-bar">
        {!isSuccess && (
          <button
            type="button"
            onClick={handlePrev}
            disabled={isTransitioning}
            className="reg-back-btn reg-top-prev-btn"
            aria-label="Previous step"
          >
            ← PREV
          </button>
        )}
        <span className="reg-tag">{event.yuga} • {event.category}</span>
      </div>

      {/* ── Main Parchment Stage (Medieval Unrolling Scroll) ── */}
      <div className="reg-card-stage">
        <div className={`medieval-scroll-stage ${stageStepClass} ${isScrollOpen ? 'open' : ''}`}>
          {/* Top Rod */}
          <ScrollRodRow position="top" />

          {/* Parchment Wrap */}
          <div className="parchment-wrap">
            <div className="parchment">
              <div className="parchment-lines" />

              {/* Ornate Frame & Corner Flourishes */}
              <svg className="scroll-corner tl" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
              <svg className="scroll-corner tr" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
              <svg className="scroll-corner bl" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>
              <svg className="scroll-corner br" viewBox="0 0 64 64"><use href="#corner-shape" /></svg>

              <div className="scroll-frame" />

              {/* Parchment Content Viewport */}
              <div className="parchment-content">
                {/* ── Step 0: Team Name Step ── */}
                {step === 0 && !isSuccess && (
                  <form onSubmit={handleTeamNameNext} noValidate className="reg-form-step">
                    {event.overheadTitle && (
                      <span className="decree-overhead-title reg-overhead-title">{event.overheadTitle}</span>
                    )}
                    <h1 className="decree-title reg-title">{event.name}</h1>
                    <p className="decree-trial-subtitle reg-subtitle">
                      {event.ruleSubtitle || `${event.category.toUpperCase()} | REGISTRATION`}
                    </p>

                    <div className="decree-ornament-divider" aria-hidden="true">
                      <span className="decree-divider-line" />
                      <span className="decree-divider-gem">◆</span>
                      <span className="decree-divider-line" />
                    </div>

                    <div className="reg-input-group">
                      <div className="reg-field-wrap">
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => handleTeamNameChange(e.target.value)}
                          onBlur={handleTeamNameBlur}
                          placeholder={isSolo ? 'ENTER PARTICIPANT NAME' : 'ENTER TEAM NAME'}
                          className={`reg-input ${teamNameTouched && teamNameError ? 'reg-input-error' : ''}`}
                          autoFocus
                        />
                        {teamNameTouched && teamNameError && (
                          <span className="reg-field-error">⚠ {teamNameError}</span>
                        )}
                      </div>
                    </div>

                    {isCtf && (
                      <p className="reg-fee-display" style={{ fontSize: '13.5px', color: '#3a2410', marginTop: '12px', fontWeight: 600 }}>
                        ⚔ CTF Trial Protocol: Teams must consist of <strong>exactly 2 or 4 members</strong>.
                      </p>
                    )}

                    {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                    <div className="reg-btn-row">
                      <button type="button" onClick={handlePrev} disabled={isTransitioning} className="reg-secondary-btn">
                        PREV
                      </button>
                      <button type="submit" disabled={isTransitioning} className="reg-action-btn next-btn">
                        NEXT
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Step 1: Member Details Step ── */}
                {step === 1 && !isSuccess && (
                  <form onSubmit={handleMemberNext} noValidate className="reg-form-step">
                    <div className="reg-header-with-line">
                      <h2 className="reg-step-title">{getMemberTitle(currentMemberIndex)}</h2>
                      <div className="reg-underline" />
                    </div>

                    {/* College Email Instruction Banner */}
                    <div className="reg-pccoe-banner">
                      <span className="reg-pccoe-icon">ℹ</span>
                      <span>
                        <strong>Note:</strong> All students must register using their official college email ID.
                      </span>
                    </div>

                    <div className="reg-fields-grid">
                      {/* Full Name */}
                      <div className="reg-field-wrap">
                        <input
                          type="text"
                          value={members[currentMemberIndex]?.name || ''}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          onBlur={() => handleFieldBlur('name')}
                          placeholder="FULL NAME"
                          className={`reg-input full-width ${currentTouched.name && currentErrors.name ? 'reg-input-error' : ''}`}
                          autoFocus
                        />
                        {currentTouched.name && currentErrors.name && (
                          <span className="reg-field-error">⚠ {currentErrors.name}</span>
                        )}
                      </div>

                      {/* Email ID (Preserves user typed casing) */}
                      <div className="reg-field-wrap">
                        <div style={{ position: 'relative' }}>
                          <input
                            type="email"
                            value={members[currentMemberIndex]?.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            onBlur={() => handleFieldBlur('email')}
                            placeholder="COLLEGE EMAIL ID (e.g. name.surname24@pccoepune.org)"
                            className={`reg-input reg-input-email full-width ${currentErrors.email ? 'reg-input-error' : ''}`}
                            style={currentErrors.email ? { borderColor: '#dc2626', borderWidth: '2px', backgroundColor: 'rgba(254, 226, 226, 0.95)', boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.25)', color: '#7f1d1d' } : {}}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                          />
                          {checkingEmailIndex === currentMemberIndex && (
                            <span
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.72rem',
                                color: '#dfa742',
                                pointerEvents: 'none',
                                opacity: 0.85,
                              }}
                            >
                              Verifying...
                            </span>
                          )}
                        </div>
                        {currentErrors.email && (
                          <span
                            className="reg-field-error"
                            style={{
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '13.5px',
                              marginTop: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            ⚠ {currentErrors.email}
                          </span>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="reg-field-wrap">
                        <input
                          type="tel"
                          value={members[currentMemberIndex]?.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          onBlur={() => handleFieldBlur('phone')}
                          placeholder={isPixelPerfect ? "PHONE NUMBER" : "PHONE NUMBER (10 DIGITS)"}
                          className={`reg-input full-width ${currentTouched.phone && currentErrors.phone ? 'reg-input-error' : ''}`}
                        />
                        {currentTouched.phone && currentErrors.phone && (
                          <span className="reg-field-error">⚠ {currentErrors.phone}</span>
                        )}
                      </div>

                      {/* Row 3: College, Academic Year, Branch (No separate admission batch field) */}
                      <div className="reg-row-3">
                        <div className="reg-field-wrap">
                          <input
                            type="text"
                            value={members[currentMemberIndex]?.college || ''}
                            onChange={(e) => handleFieldChange('college', e.target.value)}
                            onBlur={() => handleFieldBlur('college')}
                            placeholder="COLLEGE"
                            className={`reg-input col-field ${currentTouched.college && currentErrors.college ? 'reg-input-error' : ''}`}
                          />
                          {currentTouched.college && currentErrors.college && (
                            <span className="reg-field-error">⚠ {currentErrors.college}</span>
                          )}
                        </div>

                        <div className="reg-field-wrap">
                          <select
                            value={members[currentMemberIndex]?.year || 'FE'}
                            onChange={(e) => handleFieldChange('year', e.target.value)}
                            onBlur={() => handleFieldBlur('year')}
                            className={`reg-select col-field ${currentTouched.year && currentErrors.year ? 'reg-input-error' : ''}`}
                          >
                            <option value="FE">FE (1st Yr)</option>
                            <option value="SE">SE (2nd Yr)</option>
                            <option value="TE">TE (3rd Yr)</option>
                            <option value="BE">BE (4th Yr)</option>
                          </select>
                          {currentTouched.year && currentErrors.year && (
                            <span className="reg-field-error">⚠ {currentErrors.year}</span>
                          )}
                        </div>

                        <div className="reg-field-wrap">
                          <input
                            type="text"
                            value={members[currentMemberIndex]?.branch || ''}
                            onChange={(e) => handleFieldChange('branch', e.target.value)}
                            onBlur={() => handleFieldBlur('branch')}
                            placeholder="BRANCH"
                            className={`reg-input col-field ${currentTouched.branch && currentErrors.branch ? 'reg-input-error' : ''}`}
                          />
                          {currentTouched.branch && currentErrors.branch && (
                            <span className="reg-field-error">⚠ {currentErrors.branch}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                    <div className="reg-btn-row">
                      <button type="button" onClick={handlePrev} disabled={isTransitioning} className="reg-secondary-btn">
                        PREV
                      </button>

                      {/* Add member button */}
                      {isCtf ? (
                        members.length === 2 && currentMemberIndex === 1 && (
                          <button type="button" onClick={handleAddOptionalMember} disabled={isTransitioning} className="reg-optional-btn">
                            + ADD 2 AGENTS (MAX 4)
                          </button>
                        )
                      ) : (
                        members.length < maxMembers &&
                        currentMemberIndex === members.length - 1 &&
                        currentMemberIndex + 1 >= minMembers && (
                          <button type="button" onClick={handleAddOptionalMember} disabled={isTransitioning} className="reg-optional-btn">
                            + ADD MEMBER
                          </button>
                        )
                      )}

                      <button type="submit" disabled={isTransitioning} className="reg-action-btn next-btn">
                        NEXT
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Step 2: Confirmation Decree & Payment Step ── */}
                {step === 2 && !isSuccess && (
                  <form onSubmit={handleFinalSubmit} noValidate className="reg-form-step">
                    <div className="reg-header-with-line">
                      <h2 className="reg-step-title">CONFIRM REGISTRATION</h2>
                      <div className="reg-underline" />
                    </div>

                    <p className="reg-fee-display" style={{ color: '#241204' }}>
                      Trial: <strong style={{ color: '#5a3818' }}>{event.name}</strong>
                    </p>

                    {/* Team & Member Details */}
                    <div className="reg-scroll-summary-card">
                      <p style={{ margin: '0 0 8px', color: 'var(--ink)', fontSize: '14px', letterSpacing: '1px' }}>
                        <strong>Team / Entry:</strong> {teamName.trim() || members[0]?.name}
                      </p>
                      <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)', fontSize: '13px' }}>
                        Total Members: {members.length} {isCtf ? '(2 or 4 Protocol Verified)' : ''}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--ink-soft)', fontSize: '13px', lineHeight: '1.6' }}>
                        {members.map((m, idx) => {
                          const isPccoe = isMemberPccoeEligible(m);
                          const batch = extractPccoeBatch(m.email);
                          return (
                            <li key={idx}>
                              <strong style={{ color: 'var(--ink)' }}>{m.name || `Member ${idx + 1}`}</strong> &lt;{m.email}&gt; • {m.phone} — {m.college || 'College'} ({m.year}, {m.branch || 'Dept'})
                              {isPccoe && (
                                <span style={{ marginLeft: '6px', color: '#166534', fontSize: '11px', fontWeight: 700 }}>
                                  [PCCOE {batch ? (batch.length === 2 ? `Batch 20${batch}` : `Batch ${batch}`) : 'Verified'}]
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* ── Case 1: PCCOE 100% Free Registrations ── */}
                    {allPccoeEligible && (
                      <div
                        style={{
                          background: 'rgba(34, 197, 94, 0.12)',
                          border: '1.5px solid rgba(22, 101, 52, 0.45)',
                          borderRadius: '8px',
                          padding: '16px',
                          margin: '16px 0',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534', letterSpacing: '1px' }}>
                            NO PAYMENT REQUIRED
                          </span>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>
                            ₹0
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                          All team members are verified PCCOE students (Batches 23-26). No payment is required for your entry.
                        </p>
                      </div>
                    )}

                    {/* ── Case 2: Payment Required (Mixed or External Teams) ── */}
                    {paymentRequired && (
                      <div className="reg-payment-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#854d0e', letterSpacing: '1.5px' }}>
                            PAYMENT REQUIRED
                          </span>
                          <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
                            Registration Fee: ₹{event.fee}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                          At least one team member is outside the PCCOE eligibility criteria. Standard event registration fee applies to the entire team.
                        </p>

                        {/* QR Code */}
                        <div className="reg-qr-wrapper">
                          <img
                            src={event.paymentQrUrl || '/images/payment-qr.svg'}
                            alt="Payment QR Code"
                            className="reg-qr-img"
                          />
                          <p className="reg-qr-instruction">Scan the QR code to make the payment.</p>
                          <span className="reg-upi-id">UPI ID: {event.upiId || 'artimas2026@upi'}</span>
                        </div>

                        {/* Transaction ID Input */}
                        <div className="reg-field-wrap" style={{ marginTop: '16px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--ink-light)', letterSpacing: '1px', marginBottom: '4px', fontWeight: 600 }}>
                            TRANSACTION ID / UTR NUMBER *
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => {
                              setTransactionId(e.target.value);
                              if (paymentErrors.transactionId) {
                                setPaymentErrors((prev) => ({ ...prev, transactionId: '' }));
                              }
                            }}
                            placeholder="ENTER 12-DIGIT TRANSACTION ID"
                            className={`reg-input reg-input-nocase full-width ${paymentErrors.transactionId ? 'reg-input-error' : ''}`}
                          />
                          {paymentErrors.transactionId && (
                            <span className="reg-field-error">⚠ {paymentErrors.transactionId}</span>
                          )}
                        </div>

                        {/* Payment Screenshot Upload */}
                        <div className="reg-field-wrap" style={{ marginTop: '16px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--ink-light)', letterSpacing: '1px', marginBottom: '4px', fontWeight: 600 }}>
                            PAYMENT SCREENSHOT *
                          </label>
                          <div className="reg-upload-dropzone">
                            <input
                              type="file"
                              id="payment-screenshot-input"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleScreenshotFileChange}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="payment-screenshot-input" className="reg-upload-trigger">
                              {screenshotPreview ? (
                                <div className="reg-screenshot-preview">
                                  <img src={screenshotPreview} alt="Screenshot Preview" />
                                  <span>Click to change screenshot</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--ink-soft)', padding: '10px' }}>
                                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                  </svg>
                                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Click to upload payment screenshot</span>
                                  <span style={{ fontSize: '11px', color: 'var(--ink-light)' }}>Supported formats: JPG, JPEG, PNG, WebP (max 5MB)</span>
                                </div>
                              )}
                            </label>
                          </div>
                          {paymentErrors.screenshot && (
                            <span className="reg-field-error">⚠ {paymentErrors.screenshot}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {errorMessage && <p className="reg-error-msg">{errorMessage}</p>}

                    <div className="reg-btn-row reg-btn-row-submit">
                      <button type="button" onClick={handlePrev} disabled={isTransitioning} className="reg-secondary-btn">
                        PREV
                      </button>

                      <button type="submit" disabled={isSubmitting || isTransitioning} className="reg-action-btn submit-btn">
                        {isSubmitting ? 'SEALING REGISTRATION...' : 'CONFIRM REGISTRATION'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Step 3: Redesigned Simple & Easy-to-Understand Confirmation Page ── */}
                {isSuccess && (
                  <div className="reg-success-view">
                    <div className="reg-success-badge" style={{ width: '40px', height: '40px', fontSize: '20px', marginBottom: '6px' }}>✓</div>
                    <h2 className="reg-success-title" style={{ margin: '0 0 2px', fontSize: 'clamp(18px, 2.2vw, 22px)' }}>REGISTRATION CONFIRMED</h2>
                    <p className="reg-success-sub" style={{ margin: '0 0 8px', fontSize: '12.5px' }}>Your entry into the trial has been sealed in the archives.</p>

                    {/* Main Clean Confirmation Card */}
                    <div className="reg-confirm-card" style={{ padding: '14px 18px', margin: '10px 0' }}>
                      <div className="reg-confirm-grid" style={{ gap: '8px 16px', marginBottom: '10px' }}>
                        <div className="reg-confirm-item">
                          <span className="reg-confirm-label" style={{ fontSize: '10px' }}>Event</span>
                          <span className="reg-confirm-val" style={{ color: '#241204', fontSize: '15px', fontWeight: 700 }}>
                            {event.name}
                          </span>
                        </div>

                        <div className="reg-confirm-item">
                          <span className="reg-confirm-label" style={{ fontSize: '10px' }}>Pass ID</span>
                          <span className="reg-confirm-val" style={{ color: '#241204', fontFamily: 'monospace', letterSpacing: '1.5px', fontSize: '15px', fontWeight: 700 }}>
                            {registrationResult?.passId || registrationResult?.registrationId}
                          </span>
                        </div>

                        <div className="reg-confirm-item">
                          <span className="reg-confirm-label" style={{ fontSize: '10px' }}>{isSolo ? 'Participant' : 'Team'}</span>
                          <span className="reg-confirm-val" style={{ color: '#241204', fontSize: '14px', fontWeight: 700 }}>
                            {registrationResult?.teamName || teamName || members[0]?.name}
                          </span>
                        </div>

                        <div className="reg-confirm-item">
                          <span className="reg-confirm-label" style={{ fontSize: '10px' }}>Registration</span>
                          <span className="reg-confirm-val" style={{ color: '#166534', fontSize: '14px', fontWeight: 700 }}>
                            ✓ Confirmed
                          </span>
                        </div>

                        <div className="reg-confirm-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="reg-confirm-label" style={{ fontSize: '10px' }}>Payment</span>
                          <span
                            className="reg-confirm-val"
                            style={{
                              color: registrationResult?.payment?.required || registrationResult?.paymentRequired ? '#854d0e' : '#166534',
                              fontSize: '14px',
                              fontWeight: 700,
                            }}
                          >
                            {registrationResult?.payment?.required || registrationResult?.paymentRequired
                              ? `₹${registrationResult?.payment?.amount || registrationResult?.payableAmount || event.fee} — Verification Pending`
                              : 'No payment required'}
                          </span>
                        </div>
                      </div>

                      {/* EVENT INFORMATION (Compact & Clear, No Emojis) */}
                      <div className="reg-confirm-section" style={{ borderTop: '1px solid rgba(138, 106, 64, 0.25)', paddingTop: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '12.5px' }}>
                          <div>
                            <span style={{ color: '#5a3818', fontWeight: 600 }}>Date:</span>{' '}
                            <strong style={{ color: '#1a0b02' }}>{scheduleDate}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#5a3818', fontWeight: 600 }}>Time:</span>{' '}
                            <strong style={{ color: '#1a0b02' }}>{eventTime}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#5a3818', fontWeight: 600 }}>Venue:</span>{' '}
                            <strong style={{ color: '#1a0b02' }}>{scheduleVenue}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Official Event WhatsApp Group (QR Code + Direct Link) ── */}
                    <WhatsAppGroupCard eventSlug={event.slug} eventName={event.name} />

                    {isCtf && registrationResult?.submissionToken && (
                      <div
                        style={{
                          background: 'rgba(85, 50, 20, 0.09)',
                          border: '1.5px solid #8a6a40',
                          borderRadius: '6px',
                          padding: '14px',
                          margin: '16px 0',
                          wordBreak: 'break-all',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ color: '#2b1807', fontSize: '12px', letterSpacing: '1px', fontWeight: 700 }}>
                          CTF SUBMISSION TOKEN:
                        </span>
                        <p style={{ color: '#120701', fontFamily: 'monospace', fontSize: '14px', margin: '4px 0 0', fontWeight: 700 }}>
                          {registrationResult.submissionToken}
                        </p>
                        <span style={{ color: '#5a3818', fontSize: '11px', fontWeight: 500 }}>
                          (Save this token to submit challenge screenshots during the event)
                        </span>
                      </div>
                    )}

                    <p className="reg-success-note" style={{ color: '#3b1d06', fontWeight: 600, fontSize: '13.5px', textAlign: 'center', margin: '14px auto 16px', lineHeight: '1.5' }}>
                      Verification email will be sent to you by End of the Day—please check your spam/junk folder if you don’t see it.
                    </p>

                    <div className="reg-btn-row">
                      <Link href="/events" className="reg-action-btn next-btn">
                        RETURN TO EVENTS
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Rod */}
          <ScrollRodRow position="bottom" />
        </div>

        {/* ── Event Schedule & Trial Specifications (Only in wizard, hidden upon success) ── */}
        {!isSuccess && <EventSpecsCard schedule={schedule} />}
      </div>

      {/* ── Floating Contact Us Button in Bottom-Right Corner ── */}
      <EventContactButton currentEventSlug={event.slug} currentEventName={event.name} />
    </div>
  );
}
