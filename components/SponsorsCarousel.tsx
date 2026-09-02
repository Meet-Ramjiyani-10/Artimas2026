'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA } from '@/lib/media';

const TOTAL_CARDS = 6;
const CARDS = Array.from({ length: TOTAL_CARDS }, (_, i) => ({
  id: i,
  index: i + 1,
}));

export default function SponsorsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isDragging = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const hasDragged = useRef(false);

  const nextScroll = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % TOTAL_CARDS);
  }, []);

  const prevScroll = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + TOTAL_CARDS) % TOTAL_CARDS);
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
    if (hasDragged.current) return;
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
      {/* ── Left Navigation Arrow ──────────────────────────────────────── */}
      <button
        className="carousel-arrow prev"
        type="button"
        aria-label="Previous Sponsor Card"
        onClick={prevScroll}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* ── 3D Coverflow Stage (Placeholder Scroll Cards) ──────────────── */}
      <div className="scroll-carousel-stage">
        {CARDS.map((item, index) => {
          let offset = index - activeIndex;
          if (offset > TOTAL_CARDS / 2) offset -= TOTAL_CARDS;
          if (offset < -TOTAL_CARDS / 2) offset += TOTAL_CARDS;

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
                <div className="decree-inner-frame">
                  {/* Ornamental Divider Line */}
                  <div className="decree-ornament-divider" aria-hidden="true">
                    <span className="decree-divider-line" />
                    <span className="decree-divider-gem">◆</span>
                    <span className="decree-divider-line" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right Navigation Arrow ─────────────────────────────────────── */}
      <button
        className="carousel-arrow next"
        type="button"
        aria-label="Next Sponsor Card"
        onClick={nextScroll}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Pagination Dots Indicator ──────────────────────────────────── */}
      <div className="carousel-pagination">
        {CARDS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`pagination-dot${activeIndex === index ? ' active' : ''}`}
            aria-label={`Go to sponsor card ${item.index}`}
            onClick={() => goToScroll(index)}
          />
        ))}
      </div>
    </div>
  );
}
