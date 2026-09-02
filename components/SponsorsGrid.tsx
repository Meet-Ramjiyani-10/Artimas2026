'use client';

import { MEDIA } from '@/lib/media';

const TOTAL_CARDS = 6;
const CARDS = Array.from({ length: TOTAL_CARDS }, (_, i) => ({
  id: i,
  index: i + 1,
}));

export default function SponsorsGrid() {
  return (
    <div className="decree-showcase-grid" aria-label="Sponsors Grid">
      {CARDS.map((item, idx) => (
        <div
          key={item.id}
          className="decree-grid-card"
          style={{ animationDelay: `${idx * 0.08}s` }}
        >
          <div className="decree-card-panel">
            {/* Background Illustrated Event Card Graphic */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MEDIA.images.eventCard}
              alt={`Sponsor Card ${item.index}`}
              className="decree-card-bg-img"
              draggable={false}
              loading="lazy"
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
      ))}
    </div>
  );
}
