import type {Easing} from 'motion/react';

export const EASE_OUT: Easing = [0.23, 1, 0.32, 1];
export const DURATION = 0.5;
export const DISTANCE = 20;
export const STAGGER = 0.07;
// Shrinks the viewport's bottom edge inward by 20% of its height, so a
// section is considered "in view" as soon as its top crosses into the
// top 80% of the screen, instead of waiting for it to fully clear the
// bottom edge.
export const IN_VIEW_MARGIN = '0px 0px -20% 0px';
