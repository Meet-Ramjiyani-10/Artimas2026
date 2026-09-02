'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import NavIslands from './NavIslands';
import LandingFooter from './LandingFooter';
import IntroVideoOverlay from './IntroVideoOverlay';
import LinearYugaSlider from './LinearYugaSlider';
import { MEDIA } from '@/lib/media';
import { EVENTS } from '@/lib/events';
import { getHasSeenIntro, setHasSeenIntro } from '@/lib/introState';

// model-viewer is a browser-only web component — dynamically imported without SSR
const ChakraMedallion = dynamic(() => import('./ChakraMedallion'), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────────────────

type YugaAngle = 0 | 90 | 180 | 270;

// ─── Static data ─────────────────────────────────────────────────────────────

const YUGA_NAME_MAP: Record<YugaAngle, string> = {
  0: 'Satya Yuga',
  90: 'Treta Yuga',
  180: 'Dwapara Yuga',
  270: 'Kali Yuga',
};

const YUGA_TITLES: Record<YugaAngle, string> = {
  0: 'SATYA YUGA',
  90: 'TRETA YUGA',
  180: 'DWAPARA YUGA',
  270: 'KALI YUGA',
};

const VIDEO_KEY: Record<YugaAngle, string> = {
  0: 'satyug',
  90: 'treta',
  180: 'dwapar',
  270: 'kalyug',
};

const SCROLL_COOLDOWN_MS = 2000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRotationAngle(el: HTMLElement): number {
  const matrix = window.getComputedStyle(el).transform;
  if (matrix === 'none') return 0;
  const vals = matrix.split('(')[1].split(')')[0].split(',');
  const angle = Math.round(Math.atan2(parseFloat(vals[1]), parseFloat(vals[0])) * (180 / Math.PI));
  return angle < 0 ? angle + 360 : angle;
}

function normalizeToYuga(angle: number): YugaAngle {
  const n = (((angle - 315) % 360) + 360) % 360;
  const snapped = (Math.round(n / 90) * 90) % 360;
  return (snapped as YugaAngle);
}

// ─── Mythic Crest Icons for Each Yuga Epoch ──────────────────────────────────

function MythicCrestIcon({ type }: { type: 'lotus' | 'solar' | 'chakra' | 'blade' }) {
  if (type === 'lotus') {
    // Satya Yuga: Sacred Celestial Lotus & Triad Mandalas
    return (
      <svg viewBox="0 0 48 48" className="yuga-mythic-icon lotus-icon" fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.2" />
        <path d="M24 8 C28 15 34 18 34 24 C34 30 24 38 24 38 C24 38 14 30 14 24 C14 18 20 15 24 8 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M16 16 C22 20 26 22 28 28 C22 30 18 26 16 16 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
        <path d="M32 16 C26 20 22 22 20 28 C26 30 30 26 32 16 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'solar') {
    // Treta Yuga: Radiant Surya Sunburst & Sacred Valor Arc
    return (
      <svg viewBox="0 0 48 48" className="yuga-mythic-icon solar-icon" fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
        <path d="M24 4 L24 10 M24 38 L24 44 M4 24 L10 24 M38 24 L44 24 M10 10 L15 15 M33 33 L38 38 M10 38 L15 33 M33 15 L38 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="24,17 26,22 31,24 26,26 24,31 22,26 17,24 22,22" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'chakra') {
    // Dwapara Yuga: Sudarshana Chakra & Duality Battlefield Blades
    return (
      <svg viewBox="0 0 48 48" className="yuga-mythic-icon chakra-icon" fill="none">
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.3" />
        <path d="M24 3 L24 45 M3 24 L45 24 M9 9 L39 39 M9 39 L39 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <circle cx="24" cy="3" r="1.5" fill="currentColor" />
        <circle cx="24" cy="45" r="1.5" fill="currentColor" />
        <circle cx="3" cy="24" r="1.5" fill="currentColor" />
        <circle cx="45" cy="24" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Kali Yuga: Kalki Twilight Star & Flaming Lightning Blade
  return (
    <svg viewBox="0 0 48 48" className="yuga-mythic-icon blade-icon" fill="none">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" opacity="0.5" />
      <path d="M24 4 L28 18 L42 24 L28 30 L24 44 L20 30 L6 24 L20 18 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M24 8 L24 40 M8 24 L40 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArtimasScene() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [showIntro, setShowIntro] = useState(() => !getHasSeenIntro());
  const [wheelEmerging, setWheelEmerging] = useState(false);
  const [isYugasMode, setIsYugasMode] = useState(false);
  const [activeYuga, setActiveYuga] = useState<YugaAngle | null>(null);

  // Clear legacy sessionStorage
  useEffect(() => {
    try {
      sessionStorage.removeItem('artimas_has_seen_intro');
    } catch { }
  }, []);

  const handleIntroComplete = useCallback(() => {
    setHasSeenIntro(true);
    setShowIntro(false);
    setTimeout(() => {
      setWheelEmerging(true);
    }, 50);
  }, []);

  useEffect(() => {
    if (!showIntro) {
      setWheelEmerging(true);
    }
  }, [showIntro]);

  // ── Mobile Card Deck State & Touch Swipe Handlers ──────────────────────────
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  const cardTouchStartX = useRef(0);
  const cardTouchStartY = useRef(0);
  const cardTouchDeltaX = useRef(0);

  // Reset mobile card index when activeYuga changes
  useEffect(() => {
    setMobileCardIndex(0);
  }, [activeYuga]);

  const handleDeckTouchStart = (e: React.TouchEvent) => {
    cardTouchStartX.current = e.touches[0].clientX;
    cardTouchStartY.current = e.touches[0].clientY;
    cardTouchDeltaX.current = 0;
  };

  const handleDeckTouchMove = (e: React.TouchEvent) => {
    cardTouchDeltaX.current = e.touches[0].clientX - cardTouchStartX.current;
  };

  const handleDeckTouchEnd = () => {
    const swipeThreshold = 35;
    if (Math.abs(cardTouchDeltaX.current) > swipeThreshold) {
      setMobileCardIndex((prev) => (prev === 0 ? 1 : 0));
    }
    cardTouchDeltaX.current = 0;
  };

  // ── Refs ───────────────────────────────────────────────────────────────────
  const chakraRef = useRef<HTMLDivElement>(null);
  const chakraAngle = useRef(0);
  const isScrolling = useRef(false);
  const isYugasModeRef = useRef(false);

  // Video element refs
  const satyugRef = useRef<HTMLVideoElement>(null);
  const tretaRef = useRef<HTMLVideoElement>(null);
  const dwaparRef = useRef<HTMLVideoElement>(null);
  const kalyugRef = useRef<HTMLVideoElement>(null);

  const vidRefs = useRef({
    satyug: satyugRef,
    treta: tretaRef,
    dwapar: dwaparRef,
    kalyug: kalyugRef,
  });

  // ── Sync body class & chakra rotation ──────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('mode-yugas', isYugasMode);
    isYugasModeRef.current = isYugasMode;

    if (isYugasMode && chakraRef.current) {
      const el = chakraRef.current;
      void el.offsetWidth; // force reflow
      el.style.transform = `translate(-50%, -50%) rotate(${chakraAngle.current}deg)`;
    }
  }, [isYugasMode]);

  // ── Video play/pause when activeYuga changes ──────────────────────────────
  useEffect(() => {
    const activeKey = activeYuga !== null ? VIDEO_KEY[activeYuga] : null;

    Object.entries(vidRefs.current).forEach(([key, ref]) => {
      const el = ref.current;
      if (!el) return;
      if (key === activeKey) {
        el.muted = true;
        el.play().catch(() => { });
      } else {
        const target = el;
        setTimeout(() => {
          if (activeKey !== key) target.pause();
        }, 1400);
      }
    });
  }, [activeYuga]);

  // ── Core actions ──────────────────────────────────────────────────────────

  const enterYugasMode = useCallback(() => {
    if (isYugasModeRef.current || isScrolling.current) return;
    isScrolling.current = true;
    const el = chakraRef.current;
    if (!el) {
      isScrolling.current = false;
      return;
    }

    // 1. Freeze CSS rotation at current angle
    const currentAngle = getRotationAngle(el);
    el.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;

    // 2. Compute snap target (at least 720° ahead, aligned with 315° = Satya Yuga)
    let target = 720 + 315;
    while (target <= currentAngle) target += 360;
    chakraAngle.current = target;

    // 3. Set state and play Satya Yuga video
    setIsYugasMode(true);
    setActiveYuga(normalizeToYuga(target));

    setTimeout(() => { isScrolling.current = false; }, SCROLL_COOLDOWN_MS);
  }, []);

  const rotateChakra = useCallback((delta: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    chakraAngle.current += delta;
    const el = chakraRef.current;
    if (el) {
      el.style.transform = `translate(-50%, -50%) rotate(${chakraAngle.current}deg)`;
    }
    setActiveYuga(normalizeToYuga(chakraAngle.current));

    setTimeout(() => { isScrolling.current = false; }, SCROLL_COOLDOWN_MS);
  }, []);

  const goToYuga = useCallback((targetYuga: YugaAngle) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const curNorm = (((chakraAngle.current - 315) % 360) + 360) % 360;
    let diff = targetYuga - curNorm;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    chakraAngle.current += diff;
    const el = chakraRef.current;
    if (el) {
      el.style.transform = `translate(-50%, -50%) rotate(${chakraAngle.current}deg)`;
    }
    setActiveYuga(targetYuga);

    setTimeout(() => { isScrolling.current = false; }, SCROLL_COOLDOWN_MS);
  }, []);

  const exitYugasMode = useCallback(() => {
    Object.values(vidRefs.current).forEach(ref => { ref.current?.pause(); });
    if (chakraRef.current) {
      chakraRef.current.style.transform = '';
    }
    setIsYugasMode(false);
    setActiveYuga(null);
  }, []);

  // ── Event listeners (active only inside Yugas mode) ─────────────────────────

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!isYugasModeRef.current) return;
      rotateChakra(e.deltaY > 0 ? 90 : -90);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length) touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches.length || !isYugasModeRef.current) return;
      const diffY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diffY) > 35) rotateChakra(diffY > 0 ? 90 : -90);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isYugasModeRef.current) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') rotateChakra(90);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') rotateChakra(-90);
      else if (['1', '2', '3', '4'].includes(e.key)) {
        const targetNorm = (parseInt(e.key, 10) - 1) * 90;
        goToYuga(targetNorm as YugaAngle);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goToYuga, rotateChakra]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Cinematic Full-Screen Intro Video ─────────────────────────── */}
      {showIntro && (
        <IntroVideoOverlay onComplete={handleIntroComplete} />
      )}

      <div className={`landing-wrapper${isYugasMode ? ' in-yugas-mode' : ''}`}>
        {/* ── Main Landing Hero Viewport (100vh) ─────────────────────────── */}
        <div className="landing-hero-section">
          {/* ── Brand Logo ────────────────────────────────────────────────── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MEDIA.images.logo}
            className={`brand-logo${wheelEmerging && !isYugasMode ? ' logo-emerged' : ''}${!wheelEmerging && !isYugasMode ? ' logo-starting-top' : ''}`}
            alt="Artimas Logo"
            onClick={isYugasMode ? exitYugasMode : undefined}
            draggable={false}
          />

          {/* ── Top-Right Navigation Islands ──────────────────────────────── */}
          <NavIslands showMobile={isYugasMode} />

          {/* ── Enter Button ──────────────────────────────────────────────── */}
          <button className="enter-btn" type="button" onClick={enterYugasMode}>
            ENTER THE YUGAS
          </button>

          {/* ── Yuga Title Emblems ────────────────────────────────────────── */}
          <div className="yuga-titles-wrapper">
            {([
              [0, MEDIA.images.yugaTitles[0], 'Satya Yuga'],
              [90, MEDIA.images.yugaTitles[90], 'Treta Yuga'],
              [180, MEDIA.images.yugaTitles[180], 'Dwapara Yuga'],
              [270, MEDIA.images.yugaTitles[270], 'Kali Yuga'],
            ] as [YugaAngle, string, string][]).map(([angle, src, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={angle}
                src={src}
                alt={alt}
                className={`yuga-title-img${activeYuga === angle ? ' active' : ''}`}
                draggable={false}
              />
            ))}
          </div>

          {/* ── Parallax Scene ────────────────────────────────────────────── */}
          <div className="parallax-scene">
            {/* Layer 0: Cosmic Background & Videos */}
            <div className="parallax-layer layer-bg">
              {/* Default landing background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MEDIA.images.bgImage}
                alt=""
                draggable={false}
                className={`yuga-bg default-bg${!isYugasMode ? ' active' : ''}`}
              />

              {/* Yuga cinematic videos (Cloudinary CDN) */}
              <video
                ref={satyugRef}
                className={`yuga-bg yuga-video${activeYuga === 0 ? ' active' : ''}`}
                style={{ zIndex: activeYuga === 0 ? 2 : 1 }}
                loop muted playsInline preload="auto"
              >
                <source src={MEDIA.videos.satyug} type="video/mp4" />
              </video>
              <video
                ref={tretaRef}
                className={`yuga-bg yuga-video${activeYuga === 90 ? ' active' : ''}`}
                style={{ zIndex: activeYuga === 90 ? 2 : 1 }}
                loop muted playsInline preload="auto"
              >
                <source src={MEDIA.videos.treta} type="video/mp4" />
              </video>
              <video
                ref={dwaparRef}
                className={`yuga-bg yuga-video${activeYuga === 180 ? ' active' : ''}`}
                style={{ zIndex: activeYuga === 180 ? 2 : 1 }}
                loop muted playsInline preload="auto"
              >
                <source src={MEDIA.videos.dwapar} type="video/mp4" />
              </video>
              <video
                ref={kalyugRef}
                className={`yuga-bg yuga-video${activeYuga === 270 ? ' active' : ''}`}
                style={{ zIndex: activeYuga === 270 ? 2 : 1 }}
                loop muted playsInline preload="auto"
              >
                <source src={MEDIA.videos.kalyug} type="video/mp4" />
              </video>
            </div>

            {/* 3D Chakra Medallion (The Wheel) */}
            <div
              ref={chakraRef}
              className={`chakra-container${wheelEmerging && !isYugasMode ? ' wheel-emerged' : ''}${!wheelEmerging && !isYugasMode ? ' wheel-starting-bottom' : ''}`}
              onClick={() => (isYugasMode ? rotateChakra(90) : undefined)}
            >
              <ChakraMedallion />
            </div>

            {/* Temple Pillars Foreground */}
            <div className="parallax-layer layer-pillars">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MEDIA.images.pillar} alt="" draggable={false} />
            </div>
          </div>

          {/* ── Yuga Event Showcase Cards (Mobile Deck & Desktop 3D) ──── */}
          {isYugasMode && activeYuga !== null && (
            <div
              className={`yuga-events-showcase yuga-showcase-${activeYuga}`}
              key={activeYuga}
              onTouchStart={handleDeckTouchStart}
              onTouchMove={handleDeckTouchMove}
              onTouchEnd={handleDeckTouchEnd}
            >
              {EVENTS.filter((e) => e.yuga === YUGA_NAME_MAP[activeYuga]).map((evt, idx) => {
                const isFront = idx === mobileCardIndex;
                return (
                  <div
                    key={evt.id}
                    className={`yuga-decree-card yuga-card-${activeYuga} ${isFront ? 'deck-front' : 'deck-back'}`}
                    style={{ animationDelay: `${idx * 0.12}s` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFront) {
                        setMobileCardIndex(idx);
                      }
                    }}
                  >
                    {/* Ornamental Decree Corner Brackets */}
                    <div className="decree-corner top-left" aria-hidden="true" />
                    <div className="decree-corner top-right" aria-hidden="true" />
                    <div className="decree-corner bottom-left" aria-hidden="true" />
                    <div className="decree-corner bottom-right" aria-hidden="true" />

                    <div className="yuga-decree-inner">
                      {/* Top Header Group (Crest + Title) */}
                      <div className="yuga-card-header-group">
                        <div className="yuga-mythic-crest-box" aria-hidden="true">
                          <MythicCrestIcon type={evt.mythicCrest || 'lotus'} />
                        </div>
                        <h3 className="yuga-decree-title">{evt.name}</h3>
                      </div>

                      {/* Custom Center Art (Datathon Fish, Prompt Relay Lotus, Brandathon Turtle, Hackmatrix, CTF Feather, Among Us Art, Surprise Rath, Houdini Heist, or Standard Divider) */}
                      {evt.slug === 'datathon' ? (
                        <div className="yuga-card-center-art datathon-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.datathonFish}
                            alt="Datathon Matsya Golden Fish"
                            className="yuga-art-img yuga-datathon-fish"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'prompt-relay' ? (
                        <div className="yuga-card-center-art prompt-relay-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.promptRelayLotus}
                            alt="Prompt Relay Golden Lotus"
                            className="yuga-art-img yuga-prompt-relay-lotus"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'brandathon' ? (
                        <div className="yuga-card-center-art brandathon-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.brandathonTurtle}
                            alt="Brandathon Kurma Golden Turtle"
                            className="yuga-art-img yuga-brandathon-turtle"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'hackmatrix' ? (
                        <div className="yuga-card-center-art hackmatrix-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.hackmatrixArt}
                            alt="HackMatrix Golden Emblem"
                            className="yuga-art-img yuga-hackmatrix-art"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'capture-the-flag' ? (
                        <div className="yuga-card-center-art ctf-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.ctfFeather}
                            alt="CTF Golden Peacock Feather"
                            className="yuga-art-img yuga-ctf-feather"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'among-us' ? (
                        <div className="yuga-card-center-art among-us-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.amongUsArt}
                            alt="Among Us Golden Bow & Arrow"
                            className="yuga-art-img yuga-among-us-art"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'surprise-event' ? (
                        <div className="yuga-card-center-art surprise-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.surpriseEventRath}
                            alt="Surprise Event Golden Rath"
                            className="yuga-art-img yuga-surprise-rath"
                            draggable={false}
                          />
                        </div>
                      ) : evt.slug === 'houdini-heist' ? (
                        <div className="yuga-card-center-art houdini-art" aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={MEDIA.images.houdiniHeistArt}
                            alt="Houdini Heist Golden Mace"
                            className="yuga-art-img yuga-houdini-gada"
                            draggable={false}
                          />
                        </div>
                      ) : (
                        /* Ornamental Divider with Epoch Star */
                        <div className="decree-ornament-divider" aria-hidden="true">
                          <span className="decree-divider-line" />
                          <span className="decree-divider-gem">✦</span>
                          <span className="decree-divider-line" />
                        </div>
                      )}

                      {/* Short Description */}
                      <p className="yuga-decree-desc">{evt.shortDescription}</p>

                      {/* Prize Pool Badge */}
                      {evt.prizePool && (
                        <div className="yuga-card-meta-row">
                          <span className="yuga-decree-prize-badge">{evt.prizePool}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="yuga-decree-actions">
                        <Link
                          href={evt.rulebookUrl}
                          className="yuga-decree-btn secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          VIEW RULEBOOK
                        </Link>
                        <Link
                          href={evt.registerUrl}
                          className="yuga-decree-btn primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ENTER TRIAL
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Card Deck Dots Indicator */}
              <div className="mobile-deck-indicator" aria-hidden="true">
                <span
                  className={`deck-dot ${mobileCardIndex === 0 ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileCardIndex(0);
                  }}
                />
                <span
                  className={`deck-dot ${mobileCardIndex === 1 ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileCardIndex(1);
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Right-Side Linear Yuga Slider Navigation ──── */}
          {isYugasMode && activeYuga !== null && (
            <LinearYugaSlider
              activeYuga={activeYuga}
              onSelectYuga={goToYuga}
            />
          )}
        </div>

        {/* ── Natural Flow Footer (Scroll down to reveal) ────────────────── */}
        {!isYugasMode && <LandingFooter />}
      </div>
    </>
  );
}
