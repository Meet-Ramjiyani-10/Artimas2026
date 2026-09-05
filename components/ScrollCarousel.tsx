'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EVENTS } from '@/lib/events';
import { MEDIA } from '@/lib/media';
import MythicCrestIcon from './MythicCrestIcon';
import LinearEventsSlider from './LinearEventsSlider';

const TOTAL_SCROLLS = EVENTS.length;
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const SCROLL_ITEMS = EVENTS.map((event, i) => ({
  id: event.id,
  index: i + 1,
  event,
}));

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ScrollCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const hasDragged = useRef(false);

  // Fetch live registration open/closed status from API
  useEffect(() => {
    fetch(`${API_BASE}/events`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const map: Record<string, boolean> = {};
          json.data.forEach((e: any) => {
            map[e.slug] = e.registrationOpen !== false && e.active !== false;
            map[e.id] = e.registrationOpen !== false && e.active !== false;
          });
          setOpenMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const nextScroll = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % TOTAL_SCROLLS);
  }, []);

  const prevScroll = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + TOTAL_SCROLLS) % TOTAL_SCROLLS);
  }, []);

  const goToScroll = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextScroll();
      } else if (e.key === 'ArrowLeft') {
        prevScroll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextScroll, prevScroll]);

  // Touch & Mouse Drag handlers
  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    hasDragged.current = false;
    touchStartX.current = clientX;
    touchEndX.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    touchEndX.current = clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 10) {
      hasDragged.current = true;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextScroll();
      else prevScroll();
    }
  };

  const handleCardClick = (index: number) => {
    if (hasDragged.current) {
      // Prevent click action if the user was just dragging
      return;
    }
    goToScroll(index);
  };

  return (
    <div
      className="scroll-carousel-container"
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* ── 3D Coverflow Stage (Exactly 3 Visible Scrolls: Prev, Active, Next) ── */}
      <div className="scroll-carousel-stage">
        {SCROLL_ITEMS.map((item, index) => {
          // Calculate circular distance from activeIndex
          let offset = index - activeIndex;
          if (offset > TOTAL_SCROLLS / 2) offset -= TOTAL_SCROLLS;
          if (offset < -TOTAL_SCROLLS / 2) offset += TOTAL_SCROLLS;

          const isActive = offset === 0;
          const isPrev = offset === -1;
          const isNext = offset === 1;
          const isFarPrev = offset === -2;
          const isFarNext = offset === 2;

          let className = 'scroll-card';
          if (isActive) className += ' active';
          else if (isPrev) className += ' prev';
          else if (isNext) className += ' next';
          else if (isFarPrev) className += ' far-prev';
          else if (isFarNext) className += ' far-next';
          else className += ' hidden';

          return (
            <div
              key={item.id}
              className={className}
              onClick={() => handleCardClick(index)}
              style={{
                zIndex: isActive ? 10 : isPrev || isNext ? 5 : isFarPrev || isFarNext ? 2 : 0,
              }}
            >
              <div className="decree-card-panel">
                {/* Background Illustrated Event Card Graphic */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MEDIA.images.eventCard}
                  alt=""
                  className="decree-card-bg-img"
                  draggable={false}
                  loading={isActive ? 'eager' : 'lazy'}
                  decoding="async"
                />

                {/* Ornamental Decree Corner Brackets */}
                <div className="decree-corner top-left" aria-hidden="true" />
                <div className="decree-corner top-right" aria-hidden="true" />
                <div className="decree-corner bottom-left" aria-hidden="true" />
                <div className="decree-corner bottom-right" aria-hidden="true" />

                {/* Inner Double-Border Frame */}
                <div className={`decree-inner-frame${(item.event.slug === 'datathon' || item.event.slug === 'prompt-relay' || item.event.slug === 'brandathon' || item.event.slug === 'hackmatrix' || item.event.slug === 'capture-the-flag' || item.event.slug === 'among-us' || item.event.slug === 'surprise-event' || item.event.slug === 'houdini-heist') ? ' custom-art-frame' : ''}`}>
                  {/* Top Header Group (Crest + Title moved up) */}
                  <div className="scroll-card-header-group">
                    <div className="scroll-mythic-crest-box" aria-hidden="true">
                      <MythicCrestIcon type={item.event.mythicCrest || 'lotus'} />
                    </div>
                    {item.event.overheadTitle && (
                      <span className="decree-overhead-title">{item.event.overheadTitle}</span>
                    )}
                    <h2 className="decree-title">{item.event.name}</h2>
                  </div>

                  {/* Custom Center Art (Datathon Fish, Prompt Relay Lotus, Brandathon Turtle, Hackmatrix, CTF Feather, Among Us Art, Surprise Rath, Houdini Heist, or Standard Divider) */}
                  {item.event.slug === 'datathon' ? (
                    <div className="scroll-datathon-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.datathonFish}
                        alt="Datathon Matsya Golden Fish"
                        className="scroll-datathon-fish-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'prompt-relay' ? (
                    <div className="scroll-prompt-relay-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.promptRelayLotus}
                        alt="Prompt Relay Golden Lotus"
                        className="scroll-prompt-relay-lotus-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'brandathon' ? (
                    <div className="scroll-brandathon-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.brandathonRath}
                        alt="Brandathon Golden Rath"
                        className="scroll-brandathon-rath-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'hackmatrix' ? (
                    <div className="scroll-hackmatrix-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.hackmatrixArt}
                        alt="HackMatrix Golden Emblem"
                        className="scroll-hackmatrix-art-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'capture-the-flag' ? (
                    <div className="scroll-ctf-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.ctfFeather}
                        alt="CTF Golden Peacock Feather"
                        className="scroll-ctf-feather-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'among-us' ? (
                    <div className="scroll-among-us-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.amongUsArt}
                        alt="Among Us Golden Cosmic Blade"
                        className="scroll-among-us-art-img"
                        draggable={false}
                      />
                    </div>
                  ) : (item.event.slug === 'pixel-perfect' || item.event.slug === 'surprise-event') ? (
                    <div className="scroll-surprise-center-art scroll-pixel-perfect-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.pixelPerfectTurtle || MEDIA.images.surpriseEventTurtle}
                        alt="Pixel Perfect Kurma Golden Turtle"
                        className="scroll-surprise-turtle-img scroll-pixel-perfect-turtle-img"
                        draggable={false}
                      />
                    </div>
                  ) : item.event.slug === 'houdini-heist' ? (
                    <div className="scroll-houdini-center-art" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={MEDIA.images.houdiniHeistArt}
                        alt="Houdini Heist Golden Mace"
                        className="scroll-houdini-gada-img"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    /* Ornamental Divider Line */
                    <div className="decree-ornament-divider" aria-hidden="true">
                      <span className="decree-divider-line" />
                      <span className="decree-divider-gem">◆</span>
                      <span className="decree-divider-line" />
                    </div>
                  )}

                  {/* Text and Actions Container */}
                  <div className="decree-bottom-box">
                    {/* Short Description */}
                    <p className="decree-description">
                      {item.event.shortDescription || item.event.description}
                    </p>

                    {/* Action Buttons: VIEW RULEBOOK & ENTER THE TRIAL */}
                    <div className="decree-btn-group">
                      <Link
                        href={item.event.rulebookUrl}
                        className="decree-btn rulebook-action-btn"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View Rulebook for ${item.event.name}`}
                      >
                        VIEW RULEBOOK
                      </Link>
                      {(openMap[item.event.slug] !== false && openMap[item.event.id] !== false) ? (
                        <Link
                          href={item.event.registerUrl}
                          className="decree-btn register-action-btn"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Enter The Trial for ${item.event.name}`}
                        >
                          ENTER THE TRIAL
                        </Link>
                      ) : (
                        <div
                          className="decree-btn register-action-btn closed"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Registration closed for ${item.event.name}`}
                        >
                          REGISTRATION CLOSED
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Side Navigation Arrows ─────────────────────────────────────── */}
      <button
        type="button"
        className="carousel-arrow prev"
        onClick={prevScroll}
        aria-label="Previous event"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        className="carousel-arrow next"
        onClick={nextScroll}
        aria-label="Next event"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Pagination Dots Indicator ──────────────────────────────────── */}
      <div className="carousel-pagination">
        {SCROLL_ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`pagination-dot${activeIndex === index ? ' active' : ''}`}
            aria-label={`Go to scroll ${item.index}`}
            onClick={() => goToScroll(index)}
          />
        ))}
      </div>

      {/* ── Mobile-Only Fast Navigation Rail (Hidden on Desktop) ────────── */}
      <div className="mobile-events-nav-bar" aria-label="Mobile Events Navigation">
        {/* Active Event Pill Badge */}
        <div className="mobile-events-active-badge">
          <span className="mobile-events-roman">{ROMAN_NUMERALS[activeIndex] || `${activeIndex + 1}`}</span>
          <span className="mobile-events-name">{SCROLL_ITEMS[activeIndex].event.name}</span>
        </div>

        {/* Horizontal Navigation Capsule */}
        <div className="mobile-events-capsule">
          <button
            type="button"
            className="mobile-events-arrow prev"
            aria-label="Previous Event"
            onClick={prevScroll}
          >
            ◀
          </button>

          <div
            className="mobile-events-track"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const fraction = Math.max(0, Math.min(1, clickX / rect.width));
              const targetIdx = Math.min(TOTAL_SCROLLS - 1, Math.floor(fraction * TOTAL_SCROLLS));
              goToScroll(targetIdx);
            }}
          >
            <div className="mobile-events-rail" />
            <div
              className="mobile-events-rail-fill"
              style={{ width: `${(activeIndex / (TOTAL_SCROLLS - 1)) * 100}%` }}
            />
            <div
              className="mobile-events-thumb"
              style={{ left: `${(activeIndex / (TOTAL_SCROLLS - 1)) * 100}%` }}
            >
              <span className="mobile-events-thumb-gem">✦</span>
            </div>

            {SCROLL_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`mobile-events-step${activeIndex === idx ? ' active' : ''}`}
                style={{ left: `${(idx / (TOTAL_SCROLLS - 1)) * 100}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  goToScroll(idx);
                }}
                aria-label={`Go to ${item.event.name}`}
              >
                <div className="mobile-events-pip">
                  <span className="pip-inner" />
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="mobile-events-arrow next"
            aria-label="Next Event"
            onClick={nextScroll}
          >
            ▶
          </button>
        </div>
      </div>

      {/* ── Side Linear Events Fast Navigation Slider ──────────────────── */}
      <LinearEventsSlider
        activeIndex={activeIndex}
        onSelectEvent={goToScroll}
      />
    </div>
  );
}
