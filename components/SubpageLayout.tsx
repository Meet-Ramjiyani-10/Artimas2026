'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import NavIslands from './NavIslands';
import LandingFooter from './LandingFooter';
import { MEDIA } from '@/lib/media';
import { setHasSeenIntro } from '@/lib/introState';

interface SubpageLayoutProps {
  tag?: string;
  title?: string;
  description?: string;
  showHeader?: boolean;
  fullWidth?: boolean;
  showFooter?: boolean;
  children: React.ReactNode;
}

export default function SubpageLayout({
  tag,
  title,
  description,
  showHeader = true,
  fullWidth = false,
  showFooter = true,
  children,
}: SubpageLayoutProps) {
  useEffect(() => {
    setHasSeenIntro(true);
    try {
      sessionStorage.removeItem('artimas_has_seen_intro');
    } catch { }
  }, []);
  return (
    <>
      {/* ── Fixed Top Navbar (Logo + Navigation Islands) ──────────────── */}
      <header className="subpage-topbar">
        <Link href="/" className="subpage-logo-link" title="Return to Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MEDIA.images.logo}
            className="subpage-logo"
            alt="Artimas Logo"
            draggable={false}
          />
        </Link>
        <NavIslands />
      </header>

      {/* ── Background Parallax Environment (Landing Background) ─────── */}
      <div className="parallax-scene" style={{ zIndex: 0 }}>
        {/* Landing background image */}
        <div className="parallax-layer layer-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MEDIA.images.bgImage}
            alt=""
            draggable={false}
            className="yuga-bg default-bg active"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Subtle Temple Pillars framing */}
        <div className="parallax-layer layer-pillars" style={{ opacity: 0.35, pointerEvents: 'none' }}>
          <picture className="pillar-picture">
            <source media="(max-width: 960px)" srcSet={MEDIA.images.pillarMobile} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MEDIA.images.pillar} alt="" draggable={false} loading="lazy" decoding="async" />
          </picture>
        </div>
      </div>

      {/* ── Open Full-Page Content ────────────────────────────────────── */}
      <main className={`subpage-wrapper${!showHeader ? ' headerless' : ''}`}>
        <div className={`subpage-container${fullWidth ? ' full-width' : ''}`}>
          {showHeader && title && (
            <header className="subpage-header">
              <div className="subpage-header-top">
                {tag && <span className="subpage-tag">{tag}</span>}
                <Link href="/" className="subpage-back-pill">
                  ← Home
                </Link>
              </div>
              <h1 className="subpage-title">{title}</h1>
              {description && <p className="subpage-description">{description}</p>}
            </header>
          )}

          <section className="subpage-body">
            {children}
          </section>
        </div>

        {/* ── Subpage Footer ─────────────────────────────────────────── */}
        {showFooter && <LandingFooter />}
      </main>
    </>
  );
}
