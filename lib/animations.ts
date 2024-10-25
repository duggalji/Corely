import { Variants } from 'framer-motion'

export const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
  visible: { 
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.98,
    filter: 'blur(10px)',
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    rotateX: 10,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: -15, scale: 0.99, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.9,
      ease: [0.34, 1.56, 0.64, 1]
    }
  },
  exit: {
    opacity: 0,
    y: 15,
    scale: 0.99,
    filter: 'blur(8px)',
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
}

export const ultraSmoothFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export const ultraSmoothSlideIn: Variants = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
}
