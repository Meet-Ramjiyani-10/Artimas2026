'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { setPageTransitionLoading } from '@/lib/pageTransitionState';

const ROUTE_TITLES: Record<string, { title: string; mantra: string }> = {
  '/events': {
    title: 'INSCRIBING THE CHRONICLES',
    mantra: '॥ यतो धर्मस्ततो जयः ॥',
  },
  '/sponsors': {
    title: 'SUMMONING OUR PATRONS',
    mantra: '॥ सह वीर्यं करवावहै ॥',
  },
  '/team': {
    title: 'ASSEMBLING THE GUILD',
    mantra: '॥ संघे शक्तिः कलौ युगे ॥',
  },
  '/calendar': {
    title: 'ALIGNING THE TIME DIALS',
    mantra: '॥ कालचक्रं प्रवर्तते ॥',
  },
};

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [targetPath, setTargetPath] = useState<string>('');

  // Sync global loader state
  useEffect(() => {
    setPageTransitionLoading(loading);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(loading ? 'artimas:loader-start' : 'artimas:loader-end')
      );
    }
  }, [loading]);

  // Crisp, snappy cinematic loading experience (~0.95s total)
  useEffect(() => {
    if (loading && !isFadingOut) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 750);

      const finishTimer = setTimeout(() => {
        setLoading(false);
        setIsFadingOut(false);
      }, 980);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [loading, isFadingOut]);

  // Intercept navigation link clicks to trigger immediate cinematic transition
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('//') &&
        !target.getAttribute('target') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        href !== pathname
      ) {
        setTargetPath(href);
        setIsFadingOut(false);
        setLoading(true);
        setPageTransitionLoading(true);
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [pathname]);

  if (!loading) return null;

  // Determine title based on target or current path
  const activeRouteKey = Object.keys(ROUTE_TITLES).find(
    (k) => targetPath.startsWith(k) || (!targetPath && pathname.startsWith(k))
  );

  const meta = activeRouteKey
    ? ROUTE_TITLES[activeRouteKey]
    : {
        title: 'UNVEILING THE REALM',
        mantra: '॥ कालचक्रं प्रवर्तते ॥',
      };

  return (
    <div
      className={`mythic-page-loader${isFadingOut ? ' loader-fade-out' : ''}`}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Ambient Vignette & Cosmic Glow */}
      <div className="loader-backdrop" />
      <div className="loader-glow-orb" />

      <div className="loader-content">
        {/* Sacred Geometry Astrolabe Spinner */}
        <div className="astrolabe-spinner">
          <div className="astrolabe-ring outer-ring" />
          <div className="astrolabe-ring middle-ring" />
          <div className="astrolabe-ring inner-ring" />
          <div className="astrolabe-core">
            <span className="core-glyph">☸</span>
          </div>
        </div>

        {/* Luminous Sanskrit Inscription */}
        <div className="loader-mantra">{meta.mantra}</div>

        {/* Action Title */}
        <h2 className="loader-title">{meta.title}</h2>

        {/* Energy Shimmer Progress Bar */}
        <div className="loader-progress-track">
          <div className="loader-progress-shimmer" />
        </div>
      </div>
    </div>
  );
}
