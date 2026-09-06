'use client';

import { MEDIA } from '@/lib/media';
import { SPONSOR_TIERS } from '@/lib/sponsors';

export default function SponsorsGrid() {
  return (
    <div className="sponsors-showcase-container" style={{ width: '100%' }}>
      {SPONSOR_TIERS.map((tier) => (
        <section
          key={tier.id}
          className="sponsors-tier-section"
          aria-label={`${tier.title} Section`}
        >
          {/* Section Tier Header */}
          <div className="sponsors-tier-header">
            <span className="sponsors-tier-tag">{tier.tierTag}</span>
            <h2 className="sponsors-tier-title">{tier.title}</h2>
            <div className="decree-ornament-divider" aria-hidden="true">
              <span className="decree-divider-line" />
              <span className="decree-divider-gem">◆</span>
              <span className="decree-divider-line" />
            </div>
            {tier.description && (
              <p className="sponsors-tier-desc">{tier.description}</p>
            )}
          </div>

          {/* 4-Column Decree Cards Grid */}
          <div
            className="sponsors-4-col-grid"
            aria-label={`${tier.title} Grid`}
          >
            {tier.sponsors.map((partner, idx) => (
              <div
                key={partner.id}
                className="decree-grid-card sponsor-decree-card"
                style={{ animationDelay: `${idx * 0.09}s` }}
              >
                <div className="decree-card-panel">
                  {/* Background Illustrated Event Card Graphic */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MEDIA.images.eventCard}
                    alt={`${partner.name} Sponsor Card Frame`}
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

                  {/* Inner Frame */}
                  <div className="decree-inner-frame sponsor-inner-frame">
                    {/* Top Header Group - Partner Name without redundant category */}
                    <div className="sponsor-card-top">
                      <h3 className="sponsor-card-name">{partner.name}</h3>
                      <div className="decree-ornament-divider" aria-hidden="true">
                        <span className="decree-divider-line" />
                        <span className="decree-divider-gem">◆</span>
                        <span className="decree-divider-line" />
                      </div>
                    </div>

                    {/* Prominent Center Brand Logo */}
                    <div className="sponsor-logo-box-wrapper">
                      <div
                        className={`sponsor-logo-box ${
                          partner.isDarkLogo ? 'is-dark-theme' : 'is-light-theme'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={partner.logo}
                          alt={partner.alt}
                          className="sponsor-logo-img"
                          draggable={false}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>

                    {/* Bottom Status Pill */}
                    <div className="sponsor-card-bottom">
                      <span className="sponsor-badge-pill">OFFICIAL PARTNER</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
