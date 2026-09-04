'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MEDIA } from '@/lib/media';

export interface ScheduleMilestone {
  time?: string;
  overhead?: string;
  title: string;
  round?: string;
  date?: string;
  type?: 'online' | 'offline';
}

export interface CalendarPageData {
  id: number;
  pageNum: number;
  tabLabel: string;
  title: string;
  subtitle: string;
  dateBadge: string;
  yugaEpoch: string;
  imageUrl: string;
  description: string;
  milestones: ScheduleMilestone[];
}

export const CALENDAR_PAGES: CalendarPageData[] = [
  {
    id: 1,
    pageNum: 1,
    tabLabel: '1. ONLINE ROUNDS',
    title: 'Online Preliminary Rounds',
    subtitle: 'Global Virtual Trials & Eliminators',
    dateBadge: '26th Sept – 10th Oct',
    yugaEpoch: 'Satya & Treta Epochs',
    imageUrl: MEDIA.images.calendarPages.page1,
    description:
      'The initial digital battleground for Artimas 2026. Global squads compete across data, design, generative prompting, and cyber warfare elimination rounds.',
    milestones: [
      {
        overhead: 'Round 1 · Hackathon',
        title: 'HACKMATRIX',
        date: '26TH SEPT',
        type: 'online',
      },
      {
        overhead: 'Round 1 · Design & Branding',
        title: 'BRANDATHON',
        date: '4TH OCT',
        type: 'online',
      },
      {
        overhead: 'Round 1 · Generative AI',
        title: 'PROMPT RELAY',
        date: '5TH OCT',
        type: 'online',
      },
      {
        overhead: 'Round 1 · Data Science & ML',
        title: 'DATATHON',
        date: '6TH OCT',
        type: 'online',
      },
      {
        overhead: 'Round 1 · Cyber Warfare',
        title: 'CTF (Capture The Flag)',
        date: '10TH OCT',
        type: 'online',
      },
    ],
  },
  {
    id: 2,
    pageNum: 2,
    tabLabel: '2. 9TH OCTOBER',
    title: '9th October 2026',
    subtitle: 'Grand On-Campus Arena • Day 1',
    dateBadge: 'Friday · 9th Oct',
    yugaEpoch: 'Dwapara Epoch Opening',
    imageUrl: MEDIA.images.calendarPages.page2,
    description:
      'The grand physical gathering kicks off. Full-day offline data modeling trial alongside tactical real-world social deduction tournaments.',
    milestones: [
      {
        time: '08:00 AM – 05:00 PM',
        overhead: 'Round 2 · All-Day In-Person Sprint',
        title: 'DATATHON',
        round: 'Round 2',
        type: 'offline',
      },
      {
        time: '11:00 AM – 02:00 PM',
        overhead: 'Round 1 · Tactical Social Deduction',
        title: 'AMONG US',
        round: 'Round 1',
        type: 'offline',
      },
      {
        time: '03:00 PM – 06:00 PM',
        overhead: 'Round 2 · Championship Elimination',
        title: 'AMONG US',
        round: 'Round 2',
        type: 'offline',
      },
    ],
  },
  {
    id: 3,
    pageNum: 3,
    tabLabel: '3. 10TH OCTOBER',
    title: '10th October 2026',
    subtitle: 'Grand On-Campus Arena • Day 2',
    dateBadge: 'Saturday · 10th Oct',
    yugaEpoch: 'High Duels & Infiltration',
    imageUrl: MEDIA.images.calendarPages.page3,
    description:
      'Dual prompt duels, an intense 10-hour non-stop HackMatrix build, and physical escape room labyrinth challenges.',
    milestones: [
      {
        time: '08:00 AM – 01:00 PM',
        overhead: 'Round 1 · Generative AI Trial',
        title: 'PROMPT RELAY',
        round: 'Round 1',
        type: 'offline',
      },
      {
        time: '01:00 PM – 06:00 PM',
        overhead: 'Round 2 · Prompt Showdown Final',
        title: 'PROMPT RELAY',
        round: 'Round 2',
        type: 'offline',
      },
      {
        time: '08:00 AM – 06:00 PM',
        overhead: 'Round 2 · 10-Hour Prototype Sprint',
        title: 'HACKMATRIX',
        round: 'Round 2',
        type: 'offline',
      },
      {
        time: '10:00 AM – 01:00 PM',
        overhead: 'Round 1 · Physical Enigma Maze',
        title: 'HOUDINI HEIST',
        round: 'Round 1',
        type: 'offline',
      },
      {
        time: '01:00 PM – 05:00 PM',
        overhead: 'Round 2 · Escape Chamber Elimination',
        title: 'HOUDINI HEIST',
        round: 'Round 2',
        type: 'offline',
      },
    ],
  },
  {
    id: 4,
    pageNum: 4,
    tabLabel: '4. 11TH OCTOBER',
    title: '11th October 2026',
    subtitle: 'Grand Finale & Championship Day',
    dateBadge: 'Sunday · 11th Oct',
    yugaEpoch: 'Kali Yuga Finale & Glory',
    imageUrl: MEDIA.images.calendarPages.page4,
    description:
      'The supreme finale of Artimas 2026. Full-day branding presentations, live 10-hour offline cyber warfare, final escape labyrinth, and prototype jury evaluation.',
    milestones: [
      {
        time: '08:00 AM – 06:00 PM',
        overhead: 'Round 2 · Brand Architecture & Identity Final',
        title: 'BRANDATHON',
        round: 'Round 2',
        type: 'offline',
      },
      {
        time: '08:00 AM – 06:00 PM',
        overhead: 'Round 2 · Full-Day Offline Cyber Warfare',
        title: 'CTF (Capture The Flag)',
        round: 'Round 2',
        type: 'offline',
      },
      {
        time: '10:00 AM – 01:00 PM',
        overhead: 'Round 3 · Grand Escape Finale',
        title: 'HOUDINI HEIST',
        round: 'Round 3',
        type: 'offline',
      },
      {
        time: '08:00 AM – 11:00 AM',
        overhead: 'Jury Evaluation & Pitch Defense',
        title: 'HACKMATRIX',
        round: 'Evaluation',
        type: 'offline',
      },
    ],
  },
];

export default function CalendarViewer() {
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const currentPage = CALENDAR_PAGES[activePageIndex];

  const handlePrevPage = useCallback(() => {
    setActivePageIndex((prev) => (prev > 0 ? prev - 1 : CALENDAR_PAGES.length - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setActivePageIndex((prev) => (prev < CALENDAR_PAGES.length - 1 ? prev + 1 : 0));
  }, []);

  // Keyboard navigation for arrow keys & escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage) {
        if (e.key === 'Escape') {
          setLightboxImage(null);
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, handlePrevPage, handleNextPage]);

  return (
    <div className="calendar-codex-container">
      {/* Preload all 4 schedule graphics for instant switching */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {CALENDAR_PAGES.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.imageUrl} alt="" loading="eager" decoding="async" />
        ))}
      </div>

      {/* ── Top Bar: Page Selectors & View Mode ─────────────────────── */}
      <div className="calendar-controls-bar">
        {/* Navigation Tabs for the 4 Pages */}
        <div className="calendar-tabs-row" role="tablist" aria-label="Schedule Pages">
          {CALENDAR_PAGES.map((page, idx) => {
            const isActive = activePageIndex === idx && viewMode === 'single';
            return (
              <button
                key={page.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActivePageIndex(idx);
                  setViewMode('single');
                }}
                className={`calendar-tab-pill${isActive ? ' active-pill' : ''}`}
              >
                <span className="calendar-tab-dot" aria-hidden="true">◆</span>
                <span className="calendar-tab-text">{page.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="calendar-mode-toggle-group">
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`calendar-mode-btn${viewMode === 'single' ? ' active' : ''}`}
            title="Single Page Codex View"
          >
            📖 Codex View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`calendar-mode-btn${viewMode === 'grid' ? ' active' : ''}`}
            title="All 4 Pages Grid"
          >
            ▦ All 4 Pages
          </button>
        </div>
      </div>

      {/* ── View Mode 1: Single Page Codex View ─────────────────────── */}
      {viewMode === 'single' && (
        <div className="calendar-single-view">
          {/* Main Visual Codex Sheet */}
          <div className="calendar-sheet-card">
            {/* Corner Flourishes */}
            <div className="decree-corner top-left" aria-hidden="true" />
            <div className="decree-corner top-right" aria-hidden="true" />
            <div className="decree-corner bottom-left" aria-hidden="true" />
            <div className="decree-corner bottom-right" aria-hidden="true" />

            {/* Sheet Header */}
            <div className="calendar-sheet-header">
              <div className="calendar-sheet-meta">
                <span className="calendar-sheet-badge">{currentPage.dateBadge}</span>
                <span className="calendar-sheet-yuga">❖ {currentPage.yugaEpoch}</span>
              </div>
              <h2 className="calendar-sheet-title">{currentPage.title}</h2>
              <p className="calendar-sheet-subtitle">{currentPage.subtitle}</p>
            </div>

            {/* Sheet Graphic Image Frame with Fullscreen Zoom */}
            <div
              className="calendar-graphic-frame"
              onClick={() => {
                setLightboxImage(currentPage.imageUrl);
                setLightboxTitle(currentPage.title);
              }}
              title="Click to view full screen"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPage.imageUrl}
                alt={`${currentPage.title} - Official Artimas 2026 Schedule Graphic`}
                className="calendar-graphic-img"
                loading="eager"
              />
              <div className="calendar-graphic-overlay">
                <span className="calendar-zoom-hint">🔍 Click to Expand &amp; Zoom</span>
              </div>
            </div>

            {/* Navigation & Actions Row */}
            <div className="calendar-sheet-footer">
              <button
                type="button"
                onClick={handlePrevPage}
                className="calendar-arrow-btn"
                aria-label="Previous schedule page"
              >
                ← PREV PAGE
              </button>

              <div className="calendar-page-indicator">
                PAGE <strong>{currentPage.pageNum}</strong> OF {CALENDAR_PAGES.length}
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                className="calendar-arrow-btn"
                aria-label="Next schedule page"
              >
                NEXT PAGE →
              </button>
            </div>
          </div>

          {/* Structured Timeline Details for Active Page */}
          <div className="calendar-details-card">
            <div className="calendar-details-header">
              <span className="calendar-details-icon">✦</span>
              <div>
                <h3 className="calendar-details-heading">Chronicle Breakdown &amp; Event Timings</h3>
                <span className="calendar-details-sub">{currentPage.description}</span>
              </div>
            </div>

            <div className="calendar-milestones-grid">
              {currentPage.milestones.map((item, mIdx) => (
                <div key={mIdx} className="calendar-milestone-card">
                  <div className="calendar-milestone-top">
                    {item.time && <span className="calendar-time-pill">⏰ {item.time}</span>}
                    {item.date && <span className="calendar-date-pill">📅 {item.date}</span>}
                    {item.round && <span className="calendar-round-badge">{item.round}</span>}
                  </div>
                  {item.overhead && (
                    <span className="calendar-milestone-overhead">{item.overhead}</span>
                  )}
                  <h4 className="calendar-milestone-event-title">{item.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── View Mode 2: All 4 Pages Gallery Grid ───────────────────── */}
      {viewMode === 'grid' && (
        <div className="calendar-all-grid">
          {CALENDAR_PAGES.map((page, idx) => (
            <div key={page.id} className="calendar-grid-card">
              <div className="decree-corner top-left" aria-hidden="true" />
              <div className="decree-corner top-right" aria-hidden="true" />
              <div className="decree-corner bottom-left" aria-hidden="true" />
              <div className="decree-corner bottom-right" aria-hidden="true" />

              <div className="calendar-grid-card-header">
                <div>
                  <span className="calendar-page-index-pill">PAGE {page.pageNum}</span>
                  <h3 className="calendar-grid-card-title">{page.title}</h3>
                  <div className="calendar-grid-card-date">{page.dateBadge}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivePageIndex(idx);
                    setViewMode('single');
                  }}
                  className="calendar-inspect-btn"
                  title="Open in Codex view"
                >
                  View Page →
                </button>
              </div>

              <div
                className="calendar-grid-image-wrap"
                onClick={() => {
                  setLightboxImage(page.imageUrl);
                  setLightboxTitle(page.title);
                }}
                title="Click to view full screen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.imageUrl}
                  alt={`${page.title} schedule graphic`}
                  className="calendar-grid-img"
                  loading="lazy"
                />
                <div className="calendar-graphic-overlay">
                  <span className="calendar-zoom-hint">🔍 Expand</span>
                </div>
              </div>

              <div className="calendar-grid-events-summary">
                <div className="calendar-summary-title">Key Rounds Scheduled:</div>
                <ul className="calendar-summary-list">
                  {page.milestones.map((m, mIdx) => (
                    <li key={mIdx} className="calendar-summary-item">
                      <span className="calendar-summary-dot">◆</span>
                      <strong className="calendar-summary-name">{m.title}</strong>
                      <span className="calendar-summary-time">{m.time || m.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox Modal for Fullscreen Graphic Inspection ───────── */}
      {lightboxImage && (
        <div
          className="calendar-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen Schedule View"
        >
          <div
            className="calendar-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-lightbox-bar">
              <span className="calendar-lightbox-title">
                ❖ {lightboxTitle} · Artimas Official Schedule
              </span>
              <div className="calendar-lightbox-actions">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-lightbox-btn"
                >
                  Open Original ↗
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="calendar-lightbox-close"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="calendar-lightbox-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage}
                alt={lightboxTitle}
                className="calendar-lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
