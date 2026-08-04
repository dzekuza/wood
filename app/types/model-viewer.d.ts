import type {DetailedHTMLProps, HTMLAttributes} from 'react';

type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'ar-placement'?: string;
  'camera-controls'?: boolean;
  'disable-zoom'?: boolean;
  'auto-rotate'?: boolean;
  'interaction-prompt'?: string;
  'shadow-intensity'?: string;
  exposure?: string;
  'environment-image'?: string;
  loading?: string;
  reveal?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
