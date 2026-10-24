import type { TargetAndTransition, Transition, Variants } from 'motion/react'

type Target = TargetAndTransition & { opacity: number }

export type MotionPreset = {
  initial: Target
  animate: Target
  exit: Target
  transition: Transition
}

export type OverlayPlacement = 'center' | 'right'

const fadeOnly: MotionPreset = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}

const overlaySpring: Transition = { type: 'spring', stiffness: 380, damping: 32 }

export function pageTransition(reduced: boolean): MotionPreset {
  if (reduced) return fadeOnly
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  }
}

export function overlayTransition(reduced: boolean, placement: OverlayPlacement): MotionPreset {
  if (reduced) return fadeOnly
  if (placement === 'right') {
    return {
      initial: { opacity: 0, x: '100%' },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: '100%' },
      transition: overlaySpring,
    }
  }
  return {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
    transition: overlaySpring,
  }
}

export function toastTransition(reduced: boolean): MotionPreset {
  if (reduced) return fadeOnly
  return {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2, ease: 'easeOut' },
  }
}

export type PressableProps = {
  whileHover?: TargetAndTransition
  whileTap?: TargetAndTransition
  transition?: Transition
}

export function pressable(reduced: boolean): PressableProps {
  if (reduced) return {}
  return {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.18 },
  }
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const

export type ListStagger = { container: Variants; item: Variants }

export function listStagger(reduced: boolean): ListStagger {
  if (reduced) {
    return {
      container: { hidden: {}, visible: {} },
      item: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } } },
    }
  }
  return {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
    },
    item: {
      hidden: { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [...easeOutExpo] } },
    },
  }
}

export type HoverLiftProps = { whileHover?: TargetAndTransition; transition?: Transition }

export function hoverLift(reduced: boolean): HoverLiftProps {
  if (reduced) return {}
  return { whileHover: { scale: 1.02, y: -4 }, transition: { duration: 0.18, ease: 'easeOut' } }
}
