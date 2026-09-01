'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EVENTS } from '@/lib/events';
import { MEDIA } from '@/lib/media';

const TOTAL_SCROLLS = 8;
const SCROLL_ITEMS = EVENTS.map((event, i) => ({
  id: event.id,
  index: i + 1,
  event,
}));

export default function ScrollCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isDragging = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const hasDragged = useRef(false);

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
                {/* Ornamental Decree Corner Brackets */}
                <div className="decree-corner top-left" aria-hidden="true" />
                <div className="decree-corner top-right" aria-hidden="true" />
                <div className="decree-corner bottom-left" aria-hidden="true" />
                <div className="decree-corner bottom-right" aria-hidden="true" />

                {/* Inner Double-Border Frame */}
                <div className="decree-inner-frame">
                  {/* Category & Yuga Metadata */}
                  <div className="decree-category-tag">
                    <span className="decree-tag-sparkle">❖</span>
                    <span>{item.event.yuga} · {item.event.category}</span>
                    <span className="decree-tag-sparkle">❖</span>
                  </div>

                  {/* Main Event Title: HACKMATRIX */}
                  <h2 className="decree-title">{item.event.name}</h2>

                  {/* Subtitle: THE TRIAL OF INGENUITY */}
                  <div className="decree-trial-subtitle">
                    {item.event.trialSubtitle || item.event.tagline}
                  </div>

                  {/* Ornamental Divider Line */}
                  <div className="decree-ornament-divider" aria-hidden="true">
                    <span className="decree-divider-line" />
                    <span className="decree-divider-gem">◆</span>
                    <span className="decree-divider-line" />
                  </div>

                  {/* Short Description */}
                  <p className="decree-description">
                    {item.event.shortDescription || item.event.description}
                  </p>

                  {/* Date & Mode */}
                  <div className="decree-date-location">
                    {item.event.dateLocation || '18 OCTOBER 2026  ·  ONLINE'}
                  </div>

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
                    <Link
                      href={item.event.registerUrl}
                      className="decree-btn register-action-btn"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Enter The Trial for ${item.event.name}`}
                    >
                      ENTER THE TRIAL
                    </Link>
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
    </div>
  );
}
