import {motion, type HTMLMotionProps} from 'motion/react';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DISTANCE, DURATION, EASE_OUT, IN_VIEW_MARGIN} from '~/lib/motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  y?: number;
  once?: boolean;
}

function Reveal({delay = 0, y = DISTANCE, once = true, children, ref: externalRef, ...props}: RevealProps) {
  const {ref, isInView} = useIsInView<HTMLDivElement>(externalRef ?? null, {
    inView: true,
    inViewOnce: once,
    inViewMargin: IN_VIEW_MARGIN,
  });

  return (
    <motion.div
      ref={ref}
      initial={{opacity: 0, transform: `translateY(${y}px)`}}
      animate={isInView ? {opacity: 1, transform: 'translateY(0px)'} : undefined}
      transition={{duration: DURATION, delay, ease: EASE_OUT}}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export {Reveal, type RevealProps};
