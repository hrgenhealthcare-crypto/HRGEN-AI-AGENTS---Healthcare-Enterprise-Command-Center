import { type Transition, type Variants } from 'framer-motion';

// Cinematic fluid float with moderate stiffness and soft damping (User Selected 2026 Theme)
export const cinematicSpring: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.8,
};

// Snappy tactile bounce for buttons, toggles, and micro-interactions
export const tactileBounce: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 22,
  mass: 0.6,
};

// Smooth gentle float for continuous ambient background elements
export const ambientFloat: Transition = {
  duration: 3.5,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

// Depth zoom & subtle directional slide with crossfade view transitions (User Selected)
export const depthZoomViewVariant: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      ...cinematicSpring,
      opacity: { duration: 0.24 },
      filter: { duration: 0.22 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Staggered list container for cards and pods
export const staggerContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Individual card entry variant
export const cardStaggerItemVariant: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: cinematicSpring,
  },
};

// Mobile Bottom Sheet spring variants
export const bottomSheetVariant: Variants = {
  hidden: { y: '100%', opacity: 0.5 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      mass: 0.9,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: 'easeInOut',
    },
  },
};

// Global shared element transition spring profile (Cinematic fluid float with moderate damping)
export const sharedElementSpring: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.8,
};

// Backdrop fade variants for layoutId expanded modals
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: 'easeOut' } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: 'easeIn' } 
  },
};

