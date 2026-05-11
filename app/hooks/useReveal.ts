import {useRef} from 'react';
import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface RevealOptions {
  selector?: string;
  y?: number;
  stagger?: number;
  delay?: number;
  start?: string;
  duration?: number;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {},
) {
  const ref = useRef<T>(null);
  const {
    selector = '*[data-reveal]',
    y = 28,
    stagger = 0.08,
    delay = 0,
    start = 'top 88%',
    duration = 0.7,
  } = options;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const {motion} = ctx.conditions as {motion: boolean; reduced: boolean};

          if (!motion) return;

          const els = ref.current?.querySelectorAll(selector);
          if (!els?.length) return;

          gsap.from(els, {
            autoAlpha: 0,
            y,
            duration,
            delay,
            stagger,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start,
            },
          });
        },
      );
    },
    {scope: ref},
  );

  return ref;
}
