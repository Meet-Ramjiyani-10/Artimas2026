'use client';

import { useRef, useCallback, type MouseEvent, type WheelEvent } from 'react';

type YugaAngle = 0 | 90 | 180 | 270;

interface LinearYugaSliderProps {
  activeYuga: YugaAngle;
  onSelectYuga: (angle: YugaAngle) => void;
}

const YUGAS_ORDER: {
  angle: YugaAngle;
  name: string;
  roman: string;
  sanskrit: string;
  icon: string;
}[] = [
  { angle: 0,   name: 'Satya',   roman: 'I',   sanskrit: 'सत्य', icon: '𑁍' },
  { angle: 90,  name: 'Treta',   roman: 'II',  sanskrit: 'त्रेता', icon: '☼' },
  { angle: 180, name: 'Dwapara', roman: 'III', sanskrit: 'द्वापर', icon: '☸' },
  { angle: 270, name: 'Kali',    roman: 'IV',  sanskrit: 'कलि', icon: '⚡' },
];

export default function LinearYugaSlider({
  activeYuga,
  onSelectYuga,
}: LinearYugaSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const activeIndex = YUGAS_ORDER.findIndex((y) => y.angle === activeYuga);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  // Handle direct click along the slider track
  const handleTrackClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const fraction = Math.max(0, Math.min(1, clickY / rect.height));
      const targetIdx = Math.min(3, Math.floor(fraction * 4));
      onSelectYuga(YUGAS_ORDER[targetIdx].angle);
    },
    [onSelectYuga]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.stopPropagation();
      if (e.deltaY > 0) {
        // scroll down -> next yuga
        const nextIdx = (safeIndex + 1) % 4;
        onSelectYuga(YUGAS_ORDER[nextIdx].angle);
      } else if (e.deltaY < 0) {
        // scroll up -> prev yuga
        const prevIdx = (safeIndex - 1 + 4) % 4;
        onSelectYuga(YUGAS_ORDER[prevIdx].angle);
      }
    },
    [safeIndex, onSelectYuga]
  );

  return (
    <div
      className="linear-yuga-slider-container"
      aria-label="Linear Yuga Epoch Slider"
      onWheel={handleWheel}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Up Stepper Arrow */}
      <button
        type="button"
        className="linear-yuga-arrow up"
        aria-label="Previous Yuga"
        onClick={() => {
          const prevIdx = (safeIndex - 1 + 4) % 4;
          onSelectYuga(YUGAS_ORDER[prevIdx].angle);
        }}
      >
        ▲
      </button>

      {/* Vertical Slider Track */}
      <div
        className="linear-yuga-track"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        {/* Background Rail Line */}
        <div className="linear-yuga-rail" />

        {/* Active Progress Fill */}
        <div
          className="linear-yuga-rail-fill"
          style={{ height: `${(safeIndex / 3) * 100}%` }}
        />

        {/* Sliding Thumb Indicator (Carriage) */}
        <div
          className="linear-yuga-thumb"
          style={{ top: `${(safeIndex / 3) * 100}%` }}
        >
          <div className="linear-yuga-thumb-gem">✦</div>
          <div className="linear-yuga-thumb-glow" />
        </div>

        {/* 4 Epoch Step Markers */}
        {YUGAS_ORDER.map((yuga, idx) => {
          const isActive = safeIndex === idx;
          const posPercent = (idx / 3) * 100;

          return (
            <div
              key={yuga.angle}
              className={`linear-yuga-step${isActive ? ' active' : ''}`}
              style={{ top: `${posPercent}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectYuga(yuga.angle);
              }}
            >
              {/* Step Node Pip */}
              <div className="linear-yuga-pip">
                <span className="pip-inner" />
              </div>

              {/* Extended Step Label Box */}
              <div className="linear-yuga-label-box">
                <span className="linear-yuga-roman">{yuga.roman}</span>
                <span className="linear-yuga-name">{yuga.name}</span>
                <span className="linear-yuga-sanskrit">{yuga.sanskrit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Down Stepper Arrow */}
      <button
        type="button"
        className="linear-yuga-arrow down"
        aria-label="Next Yuga"
        onClick={() => {
          const nextIdx = (safeIndex + 1) % 4;
          onSelectYuga(YUGAS_ORDER[nextIdx].angle);
        }}
      >
        ▼
      </button>
    </div>
  );
}
