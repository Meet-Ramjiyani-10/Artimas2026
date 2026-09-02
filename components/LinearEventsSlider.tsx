'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EVENTS } from '@/lib/events';

interface LinearEventsSliderProps {
  activeIndex: number;
  onSelectEvent: (index: number) => void;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export default function LinearEventsSlider({
  activeIndex,
  onSelectEvent,
}: LinearEventsSliderProps) {
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = EVENTS.length;
  const safeIndex = Math.max(0, Math.min(total - 1, activeIndex));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle direct click along the slider track
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const fraction = Math.max(0, Math.min(1, clickY / rect.height));
      const targetIdx = Math.min(total - 1, Math.floor(fraction * total));
      onSelectEvent(targetIdx);
    },
    [total, onSelectEvent]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      if (e.deltaY > 0) {
        // scroll down -> next event
        const nextIdx = (safeIndex + 1) % total;
        onSelectEvent(nextIdx);
      } else if (e.deltaY < 0) {
        // scroll up -> prev event
        const prevIdx = (safeIndex - 1 + total) % total;
        onSelectEvent(prevIdx);
      }
    },
    [safeIndex, total, onSelectEvent]
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <aside
      className="linear-events-slider-container"
      aria-label="Events Fast Navigation Slider"
      onWheel={handleWheel}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Up Stepper Arrow */}
      <button
        type="button"
        className="linear-events-arrow up"
        aria-label="Previous Event"
        onClick={() => {
          const prevIdx = (safeIndex - 1 + total) % total;
          onSelectEvent(prevIdx);
        }}
      >
        ▲
      </button>

      {/* Vertical Slider Track */}
      <div
        className="linear-events-track"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        {/* Background Rail Line */}
        <div className="linear-events-rail" />

        {/* Active Progress Fill */}
        <div
          className="linear-events-rail-fill"
          style={{ height: `${(safeIndex / (total - 1)) * 100}%` }}
        />

        {/* Sliding Thumb Indicator (Carriage) */}
        <div
          className="linear-events-thumb"
          style={{ top: `${(safeIndex / (total - 1)) * 100}%` }}
        >
          <div className="linear-events-thumb-gem">✦</div>
          <div className="linear-events-thumb-glow" />
        </div>

        {/* 8 Event Step Markers */}
        {EVENTS.map((item, idx) => {
          const isActive = safeIndex === idx;
          const posPercent = (idx / (total - 1)) * 100;
          const roman = ROMAN_NUMERALS[idx] || `${idx + 1}`;

          return (
            <div
              key={item.id}
              className={`linear-events-step${isActive ? ' active' : ''}`}
              style={{ top: `${posPercent}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(idx);
              }}
              title={item.name}
            >
              {/* Step Node Pip */}
              <div className="linear-events-pip">
                <span className="pip-inner" />
              </div>

              {/* Extended Floating Step Label Box */}
              <div className="linear-events-label-box">
                <span className="linear-events-roman">{roman}</span>
                <span className="linear-events-name">{item.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Down Stepper Arrow */}
      <button
        type="button"
        className="linear-events-arrow down"
        aria-label="Next Event"
        onClick={() => {
          const nextIdx = (safeIndex + 1) % total;
          onSelectEvent(nextIdx);
        }}
      >
        ▼
      </button>
    </aside>,
    document.body
  );
}
