'use client';

import { MEDIA } from '@/lib/media';
import { TEAM_MEMBERS } from '@/lib/team';

export default function TeamGrid() {
  return (
    <div className="decree-showcase-grid team-showcase-grid" aria-label="Team Council Grid">
      {TEAM_MEMBERS.map((member, idx) => (
        <div
          key={member.id}
          className="decree-grid-card team-decree-card"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <div className="decree-card-panel">
            {/* Background Illustrated Event Card Graphic (Original Unchanged) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MEDIA.images.eventCard}
              alt={`${member.name} Card Frame`}
              className="decree-card-bg-img"
              draggable={false}
              loading={idx < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />

            {/* Overlapping Person Cutout Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.cropPhotoUrl}
              alt={member.name}
              className={`team-member-cutout cutout-${member.id}`}
              draggable={false}
              loading={idx < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />

            {/* Ornamental Decree Corner Brackets */}
            <div className="decree-corner top-left" aria-hidden="true" />
            <div className="decree-corner top-right" aria-hidden="true" />
            <div className="decree-corner bottom-left" aria-hidden="true" />
            <div className="decree-corner bottom-right" aria-hidden="true" />

            {/* Inner Double-Border Frame */}
            <div className="decree-inner-frame team-inner-frame">
              {/* Member Name Header (Top-Left) */}
              <div className="team-card-header">
                <h3 className="team-member-name">
                  {member.name.split(' ').map((part, pIdx) => (
                    <span key={pIdx} className="team-name-word">
                      {part}
                    </span>
                  ))}
                </h3>
                {member.role && <span className="team-member-role">{member.role}</span>}
              </div>

              {/* Ornamental Divider Line */}
              <div className="decree-ornament-divider team-ornament-divider" aria-hidden="true">
                <span className="decree-divider-line" />
                <span className="decree-divider-gem">◆</span>
                <span className="decree-divider-line" />
              </div>

              {/* Medieval Decree Lore / Description */}
              {member.description && (
                <div className="team-decree-lore-box">
                  <p className="team-member-lore">{member.description}</p>
                </div>
              )}

              {/* Bottom-Right Social Badge */}
              {member.socials && (
                <div className="team-social-badge" aria-label={`${member.name} Social Links`}>
                  {member.socials.instagram && (
                    <a
                      href={member.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-social-btn"
                      aria-label={`${member.name} on Instagram`}
                      title="Instagram"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {member.socials.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-social-btn"
                      aria-label={`${member.name} on LinkedIn`}
                      title="LinkedIn"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.5a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63s1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
                      </svg>
                    </a>
                  )}
                  {member.socials.github && (
                    <a
                      href={member.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-social-btn"
                      aria-label={`${member.name} on GitHub`}
                      title="GitHub"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
