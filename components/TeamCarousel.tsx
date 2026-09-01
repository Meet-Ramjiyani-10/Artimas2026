'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA } from '@/lib/media';

const TOTAL_TEAM_MEMBERS = 10;
const TEAM_ITEMS = Array.from({ length: TOTAL_TEAM_MEMBERS }, (_, i) => ({
  id: i,
  index: i + 1,
  image: MEDIA.images.teamCard,
}));

const AUTO_ROLL_INTERVAL = 2100;

export default function TeamCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextCard = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % TOTAL_TEAM_MEMBERS);
  }, []);

  const prevCard = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + TOTAL_TEAM_MEMBERS) % TOTAL_TEAM_MEMBERS);
  }, []);

  const goToCard = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Automatic rolling with pause on hover/interaction & tab visibility
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        nextCard();
      }
    }, AUTO_ROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, nextCard]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextCard();
      else prevCard();
    }
    setIsPaused(false);
  };

  return (
    <div
      className="scroll-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Left Navigation Arrow ──────────────────────────────────────── */}
      <button
        className="carousel-arrow prev"
        type="button"
        aria-label="Previous Team Member"
        onClick={prevCard}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* ── 3D Coverflow Stage (10 Rotating Team Cards) ───────────────── */}
      <div className="scroll-carousel-stage">
        {TEAM_ITEMS.map((item, index) => {
          // Calculate circular distance from activeIndex
          let offset = index - activeIndex;
          if (offset > TOTAL_TEAM_MEMBERS / 2) offset -= TOTAL_TEAM_MEMBERS;
          if (offset < -TOTAL_TEAM_MEMBERS / 2) offset += TOTAL_TEAM_MEMBERS;

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
              onClick={() => goToCard(index)}
              style={{
                zIndex: isActive ? 10 : isPrev || isNext ? 5 : isFarPrev || isFarNext ? 2 : 0,
              }}
            >
              <div className="scroll-graphic-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={`Artimas Team Member ${item.index}`}
                  className="scroll-img"
                  draggable={false}
                  loading={isActive ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right Navigation Arrow ─────────────────────────────────────── */}
      <button
        className="carousel-arrow next"
        type="button"
        aria-label="Next Team Member"
        onClick={nextCard}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Pagination Dots Indicator (10 Dots) ────────────────────────── */}
      <div className="carousel-pagination">
        {TEAM_ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`pagination-dot${activeIndex === index ? ' active' : ''}`}
            aria-label={`Go to team member ${item.index}`}
            onClick={() => goToCard(index)}
          />
        ))}
      </div>
    </div>
  );
}
