'use client';

import React from 'react';

type YugaAngle = 0 | 90 | 180 | 270;

interface CircularYugaDialProps {
  activeYuga: YugaAngle;
  onSelectYuga: (angle: YugaAngle) => void;
}

const YUGA_NODES: {
  angle: YugaAngle;
  name: string;
  shortName: string;
  sanskritChar: string;
  icon: string;
  positionClass: string;
}[] = [
  { angle: 0,   name: 'Satya',   shortName: 'SATYA',   sanskritChar: 'स', icon: '𑁍', positionClass: 'pos-top' },
  { angle: 90,  name: 'Treta',   shortName: 'TRETA',   sanskritChar: 'त्रे', icon: '☼', positionClass: 'pos-right' },
  { angle: 180, name: 'Dwapara', shortName: 'DWAPARA', sanskritChar: 'द्वा', icon: '☸', positionClass: 'pos-bottom' },
  { angle: 270, name: 'Kali',    shortName: 'KALI',    sanskritChar: 'क', icon: '⚡', positionClass: 'pos-left' },
];

export default function CircularYugaDial({ activeYuga, onSelectYuga }: CircularYugaDialProps) {
  return (
    <div
      className="circular-yuga-dial-wrapper"
      aria-label="Celestial Yuga Astrolabe Navigation"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="circular-yuga-dial">
        {/* Outer Astrolabe Ring with Engraved Ticks */}
        <svg viewBox="0 0 160 160" className="dial-astrolabe-svg" aria-hidden="true">
          {/* Outer Filigree Circle */}
          <circle cx="80" cy="80" r="76" stroke="rgba(201, 164, 92, 0.4)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <circle cx="80" cy="80" r="72" stroke="rgba(118, 85, 47, 0.6)" strokeWidth="1.2" fill="none" />
          <circle cx="80" cy="80" r="54" stroke="rgba(201, 164, 92, 0.25)" strokeWidth="0.8" fill="none" />

          {/* Cardinal Cross Axis Guidelines */}
          <line x1="80" y1="12" x2="80" y2="148" stroke="rgba(118, 85, 47, 0.3)" strokeWidth="0.8" strokeDasharray="2 4" />
          <line x1="12" y1="80" x2="148" y2="80" stroke="rgba(118, 85, 47, 0.3)" strokeWidth="0.8" strokeDasharray="2 4" />

          {/* 12 Astrological Hour Tick Marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const rot = i * 30;
            return (
              <line
                key={i}
                x1="80"
                y1="6"
                x2="80"
                y2={i % 3 === 0 ? "12" : "9"}
                stroke={i % 3 === 0 ? "rgba(232, 216, 176, 0.7)" : "rgba(118, 85, 47, 0.5)"}
                strokeWidth={i % 3 === 0 ? "1.5" : "0.8"}
                transform={`rotate(${rot} 80 80)`}
              />
            );
          })}
        </svg>

        {/* Central Rotating Needle / Golden Pointer */}
        <div
          className="dial-pointer-needle"
          style={{ transform: `translate(-50%, -50%) rotate(${activeYuga}deg)` }}
          aria-hidden="true"
        >
          <div className="dial-needle-arrow" />
          <div className="dial-needle-glow" />
        </div>

        {/* Center Golden Medallion Hub */}
        <div
          className="dial-center-hub"
          title="Click to cycle to next Yuga"
          onClick={() => onSelectYuga(((activeYuga + 90) % 360) as YugaAngle)}
        >
          <span className="dial-center-gem">✦</span>
        </div>

        {/* 4 Cardinal Epoch Interactive Buttons */}
        {YUGA_NODES.map((node) => {
          const isActive = activeYuga === node.angle;
          return (
            <button
              key={node.angle}
              type="button"
              className={`dial-epoch-node ${node.positionClass}${isActive ? ' active' : ''}`}
              onClick={() => onSelectYuga(node.angle)}
              aria-label={`Switch to ${node.name} Yuga`}
              title={`${node.name} Yuga`}
            >
              <span className="node-icon">{node.icon}</span>
              <span className="node-label">{node.shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
