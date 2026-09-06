'use client';

import { useEffect, useState, useRef } from 'react';
import { MEDIA } from '@/lib/media';

/**
 * ChakraMedallion — wraps the <model-viewer> 3D web component.
 * Automatically refreshes / re-mounts the 3D canvas whenever the page is
 * zoomed in or out (desktop browser zoom, pinch zoom, or resolution scaling),
 * ensuring the WebGL viewport, pixel ratio, and camera framing remain crystal clear
 * and completely distortion-free.
 */
export default function ChakraMedallion() {
  const [isCustomElementReady, setIsCustomElementReady] = useState(false);
  const [zoomKey, setZoomKey] = useState(0);

  const lastDprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  const lastVisualScaleRef = useRef(1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (customElements.get('model-viewer')) {
      setIsCustomElementReady(true);
    } else {
      if (!document.querySelector('script[src*="model-viewer"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
        document.head.appendChild(script);
      }
      customElements.whenDefined('model-viewer').then(() => {
        setIsCustomElementReady(true);
      }).catch(() => {
        setIsCustomElementReady(true);
      });
    }

    const refreshChakra = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setZoomKey((prev) => prev + 1);
      }, 150);
    };

    // 1. Device pixel ratio check (Desktop browser zoom: Ctrl+, Ctrl-, Ctrl+mousewheel)
    const checkDprZoom = () => {
      const currentDpr = window.devicePixelRatio;
      if (Math.abs(currentDpr - lastDprRef.current) > 0.005) {
        lastDprRef.current = currentDpr;
        refreshChakra();
      }
    };

    // 2. Visual Viewport scale check (Pinch-to-zoom on mobile / trackpad)
    const checkVisualScale = () => {
      if (!window.visualViewport) return;
      const currentScale = window.visualViewport.scale;
      if (Math.abs(currentScale - lastVisualScaleRef.current) > 0.005) {
        lastVisualScaleRef.current = currentScale;
        refreshChakra();
      }
    };

    // 3. Dynamic resolution media query listener for instantaneous zoom event dispatch
    let mediaQueryList: MediaQueryList | null = null;
    const bindResolutionListener = () => {
      checkDprZoom();
      if (mediaQueryList) {
        try {
          mediaQueryList.removeEventListener('change', bindResolutionListener);
        } catch (_) {}
      }
      mediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      try {
        mediaQueryList.addEventListener('change', bindResolutionListener, { once: true });
      } catch (_) {}
    };

    bindResolutionListener();

    // 4. Window resize & VisualViewport listeners
    window.addEventListener('resize', checkDprZoom, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkVisualScale, { passive: true });
    }

    // 5. Ctrl + Wheel zoom shortcut
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        refreshChakra();
      }
    };
    window.addEventListener('wheel', handleWheelZoom, { passive: true });

    // 6. Keyboard zoom shortcuts (Ctrl / Cmd with +, -, =, 0)
    const handleKeyZoom = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || e.key === 'Subtract' || e.key === 'Add')
      ) {
        refreshChakra();
      }
    };
    window.addEventListener('keydown', handleKeyZoom, { passive: true });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener('resize', checkDprZoom);
      if (mediaQueryList) {
        try {
          mediaQueryList.removeEventListener('change', bindResolutionListener);
        } catch (_) {}
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkVisualScale);
      }
      window.removeEventListener('wheel', handleWheelZoom);
      window.removeEventListener('keydown', handleKeyZoom);
    };
  }, []);

  return (
    <model-viewer
      key={zoomKey}
      src={MEDIA.models.chakraMedallion}
      camera-orbit="0deg 90deg 110%"
      camera-target="0m 0m 0m"
      bounds="tight"
      interaction-prompt="none"
      loading="eager"
      seamless-poster
      disable-zoom
      disable-pan
      disable-tap
      tabIndex={-1}
      shadow-intensity="0"
      exposure="0.8"
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1 / 1',
        background: 'transparent',
        display: 'block',
        opacity: isCustomElementReady ? 1 : 0.95,
        transition: 'opacity 0.4s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        pointerEvents: 'none',
        cursor: 'pointer',
      }}
    >
      <div slot="progress-bar" style={{ display: 'none' }} />
    </model-viewer>
  );
}
