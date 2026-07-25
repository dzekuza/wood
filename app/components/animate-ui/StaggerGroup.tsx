import {motion, type HTMLMotionProps, type Variants} from 'motion/react';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DISTANCE, DURATION, EASE_OUT, IN_VIEW_MARGIN, STAGGER} from '~/lib/motion';

const containerVariants: Variants = {
  hidden: {},
  visible: {transition: {staggerChildren: STAGGER}},
};

const itemVariants: Variants = {
  hidden: {opacity: 0, transform: `translateY(${DISTANCE}px)`},
  visible: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: {duration: DURATION, ease: EASE_OUT},
  },
};

interface StaggerGroupProps extends HTMLMotionProps<'div'> {
  once?: boolean;
}

function StaggerGroup({once = true, children, ref: externalRef, ...props}: StaggerGroupProps) {
  const {ref, isInView} = useIsInView<HTMLDivElement>(externalRef ?? null, {
    inView: true,
    inViewOnce: once,
    inViewMargin: IN_VIEW_MARGIN,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({children, ...props}: Omit<HTMLMotionProps<'div'>, 'ref'>) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}

export {StaggerGroup, StaggerItem};
