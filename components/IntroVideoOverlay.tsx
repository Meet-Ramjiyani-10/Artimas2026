'use client';

import { useEffect, useRef, useState } from 'react';
import { MEDIA } from '@/lib/media';

interface IntroVideoOverlayProps {
  onComplete: () => void;
}

export default function IntroVideoOverlay({ onComplete }: IntroVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
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
      <video
        ref={videoRef}
        src={MEDIA.videos.intro}
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
