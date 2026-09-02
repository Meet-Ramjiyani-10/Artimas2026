'use client';

import React, { useState } from 'react';
import { MEDIA } from '@/lib/media';

export default function LandingFooter() {
  const [activeGlow, setActiveGlow] = useState<string | null>(null);

  const triggerGlow = (logoKey: string) => {
    setActiveGlow(logoKey);
    setTimeout(() => {
      setActiveGlow((current) => (current === logoKey ? null : current));
    }, 950);
  };

  return (
    <footer className="landing-footer" aria-label="Footer">
      <div className="footer-container">
        {/* ── Left Section: Association & Department ── */}
        <div className="footer-left">
          <div className="footer-logos-grid">
            {/* Logo 1: AIMSA (Clickable link to https://www.pccoeaimsa.in/) */}
            <a
              href="https://www.pccoeaimsa.in/"
              target="_blank"
              rel="noopener noreferrer"
              className={`footer-logo-aimsa-link ${activeGlow === 'aimsa' ? 'is-glowing-aimsa' : ''}`}
              title="AIMSA - PCCOE"
              aria-label="AIMSA Website"
              onClick={() => triggerGlow('aimsa')}
            >
              <img
                src={MEDIA.images.footerLogos.aimsa}
                alt="AIMSA"
                className="footer-aimsa-img"
              />
            </a>

            {/* Logo 2: GFG (Clickable link to https://gfgpccoe.in/) */}
            <a
              href="https://gfgpccoe.in/"
              target="_blank"
              rel="noopener noreferrer"
              className={`footer-logo-circle footer-logo-white ${activeGlow === 'gfg' ? 'is-glowing-gold' : ''}`}
              title="GeeksforGeeks Campus Body - PCCOE"
              aria-label="GFG PCCOE Website"
              onClick={() => triggerGlow('gfg')}
            >
              <img
                src={MEDIA.images.footerLogos.gfg}
                alt="GFG Campus Body"
                className="footer-circle-img"
              />
            </a>

            {/* Logo 3: INNS */}
            <div
              className={`footer-logo-circle footer-logo-inns ${activeGlow === 'inns' ? 'is-glowing-inns' : ''}`}
              title="INNS Student Network Cell"
              role="button"
              tabIndex={0}
              onClick={() => triggerGlow('inns')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerGlow('inns');
                }
              }}
            >
              <img
                src={MEDIA.images.footerLogos.inns}
                alt="INNS Student Network Cell"
                className="footer-circle-img inns-img"
              />
            </div>

            {/* Logo 4: AAAI Chapter */}
            <div
              className={`footer-logo-circle footer-logo-white ${activeGlow === 'aaai' ? 'is-glowing-gold' : ''}`}
              title="AAAI Student Chapter"
              role="button"
              tabIndex={0}
              onClick={() => triggerGlow('aaai')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerGlow('aaai');
                }
              }}
            >
              <img
                src={MEDIA.images.footerLogos.aaai}
                alt="AAAI Student Chapter"
                className="footer-circle-img"
              />
            </div>

            {/* Logo 5: IEEE CIS */}
            <div
              className={`footer-logo-circle footer-logo-white ieee-cis-circle ${activeGlow === 'ieeeCis' ? 'is-glowing-gold' : ''}`}
              title="IEEE Computational Intelligence Society"
              role="button"
              tabIndex={0}
              onClick={() => triggerGlow('ieeeCis')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerGlow('ieeeCis');
                }
              }}
            >
              <img
                src={MEDIA.images.footerLogos.ieeeCis}
                alt="IEEE Computational Intelligence Society"
                className="footer-circle-img ieee-cis-img"
              />
            </div>

            {/* Logo 6: IEEE CS */}
            <div
              className={`footer-logo-cs-btn ${activeGlow === 'ieeeCs' ? 'is-glowing-gold' : ''}`}
              title="IEEE Computer Society"
              role="button"
              tabIndex={0}
              onClick={() => triggerGlow('ieeeCs')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerGlow('ieeeCs');
                }
              }}
            >
              <img
                src={MEDIA.images.footerLogos.ieeeCs}
                alt="IEEE Computer Society"
                className="footer-cs-img"
              />
            </div>
          </div>

          <div className="footer-dept-info">
            <h4 className="footer-dept-title">DEPARTMENT OF CSE (AI &amp; ML)</h4>
            <p className="footer-college-name">Pimpri Chinchwad College Of Engineering, Pune</p>
          </div>
        </div>

        {/* ── Right Section: Social Connections ── */}
        <div className="footer-right">
          <h3 className="footer-connect-title">Connect With Us</h3>

          <div className="footer-social-links">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/pccoe-s-aimsa/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
              </svg>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/PCCOE-AiMSA"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/pccoe_aimsa"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>

            {/* Phone */}
            <a
              href="tel:+919876543210"
              className="social-icon-btn"
              aria-label="Phone"
              title="Phone"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>

            {/* Email */}
            <a
              href="mailto:artimas@pccoepune.org"
              className="social-icon-btn"
              aria-label="Email"
              title="Email"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer Bottom Copyright & Credits ── */}
      <div className="footer-bottom-bar">
        <p className="footer-motto">|| एम्सा कुटुम्बकम् ||</p>
        <p className="footer-credits">
          Crafted with <span className="heart-icon">❤️</span> by the <strong className="gold-tech-team">ARTIMAS Tech Team</strong>
        </p>
        <p className="footer-copyright">
          © 2026 ARTIMAS - All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
