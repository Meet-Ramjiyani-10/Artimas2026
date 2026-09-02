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
  const [videoSrc, setVideoSrc] = useState(MEDIA.videos.intro);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        setVideoSrc(MEDIA.videos.introMobile);
      }
    }
  }, []);

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

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.play().catch(() => {
      // Ensure muted autoplay succeeds in all browsers
      vid.muted = true;
      vid.play().catch(() => {});
    });
  }, [videoSrc]);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className={`intro-video-overlay${isFadingOut ? ' fading-out' : ''}`}>
      <video
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
        className="intro-video-player"
        playsInline
        autoPlay
        muted
        preload="auto"
        onEnded={handleFinish}
      />

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
    </div>
  );
}
