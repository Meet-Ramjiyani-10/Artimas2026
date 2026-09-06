import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  'camera-orbit'?: string;
  'camera-target'?: string;
  bounds?: string;
  'interaction-prompt'?: string;
  'disable-zoom'?: boolean;
  'disable-pan'?: boolean;
  'disable-tap'?: boolean;
  'shadow-intensity'?: string;
  exposure?: string;
  loading?: string;
  'seamless-poster'?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

export {};
