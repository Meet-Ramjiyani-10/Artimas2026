'use client';

import { useEffect, useState } from 'react';
import { MEDIA } from '@/lib/media';

/**
 * ChakraMedallion — wraps the <model-viewer> 3D web component.
 */
export default function ChakraMedallion() {
  const [isCustomElementReady, setIsCustomElementReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  return (
    <model-viewer
      src={MEDIA.models.chakraMedallion}
      camera-orbit="0deg 90deg 110%"
      interaction-prompt="none"
      disable-zoom
      disable-pan
      disable-tap
      tabIndex={-1}
      shadow-intensity="0"
      exposure="0.8"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        display: 'block',
        opacity: isCustomElementReady ? 1 : 0.95,
        transition: 'opacity 0.4s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
      }}
    />
  );
}
