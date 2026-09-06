'use client';

import { useEffect, useRef, useState } from 'react';
import { MEDIA } from '@/lib/media';
import { setHasSeenIntro } from '@/lib/introState';

interface IntroVideoOverlayProps {
  onComplete: () => void;
}

export default function IntroVideoOverlay({ onComplete }: IntroVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  // Initial loader state before video plays
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isLoaderFading, setIsLoaderFading] = useState(false);
  const videoReadyRef = useRef(false);
  const minTimePassedRef = useRef(false);
  const isDismissingRef = useRef(false);

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setHasSeenIntro(true);
    try {
      sessionStorage.removeItem('artimas_has_seen_intro');
    } catch {}
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  const startVideoPlayback = () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.currentTime = 0;
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Video start failed:', e);
    }
  };

  const attemptDismissLoader = () => {
    if (videoReadyRef.current && minTimePassedRef.current && !isDismissingRef.current) {
      isDismissingRef.current = true;
      setIsLoaderFading(true);
      // Wait for the loader fade-out animation to finish before starting video
      setTimeout(() => {
        setIsVideoLoading(false);
        startVideoPlayback();
      }, 500);
    }
  };

  // Enforce a smooth minimum duration for the loading animation (800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimePassedRef.current = true;
      attemptDismissLoader();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Keep video paused at 0:00 while loading animation is active
    vid.pause();
    vid.currentTime = 0;

    const onReady = () => {
      videoReadyRef.current = true;
      attemptDismissLoader();
    };

    vid.addEventListener('canplaythrough', onReady);
    vid.addEventListener('canplay', onReady);
    vid.addEventListener('loadeddata', onReady);

    if (vid.readyState >= 2) {
      onReady();
    }

    // Safety fallback: if buffering is slow, dismiss loader after 3.5s
    const fallbackTimer = setTimeout(() => {
      videoReadyRef.current = true;
      minTimePassedRef.current = true;
      attemptDismissLoader();
    }, 3500);

    return () => {
      vid.removeEventListener('canplaythrough', onReady);
      vid.removeEventListener('canplay', onReady);
      vid.removeEventListener('loadeddata', onReady);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className={`intro-video-overlay${isFadingOut ? ' fading-out' : ''}`}>
      {/* ── Simple Preloader Animation before Video Starts ── */}
      {isVideoLoading && (
        <div
          className={`initial-loader-overlay${isLoaderFading ? ' fade-out' : ''}`}
          aria-live="polite"
          aria-label="Loading website"
        >
          <div className="initial-loader-content">
            <div className="initial-loader-spinner" />
            <p className="initial-loader-text">
              Loading<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="intro-video-player"
        playsInline
        muted
        preload="auto"
        onEnded={handleFinish}
      >
        <source src={MEDIA.videos.introMobile} media="(max-width: 768px)" type="video/webm" />
        <source src={MEDIA.videos.intro} type="video/webm" />
      </video>

      {!isVideoLoading && (
        <div className="intro-controls-bar">
          {/* Sound Toggle */}
          <button
            type="button"
            className="intro-control-btn sound-btn"
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute intro video" : "Mute intro video"}
          >
            {isMuted ? "UNMUTE 🔈" : "SOUND ON 🔊"}
          </button>

          {/* Skip Intro Button */}
          <button
            type="button"
            className="intro-control-btn skip-btn"
            onClick={handleFinish}
            aria-label="Skip intro video"
          >
            SKIP INTRO →
          </button>
        </div>
      )}
    </div>
  );
}
