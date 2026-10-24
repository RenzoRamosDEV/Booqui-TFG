import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router'
import { pageTransition } from '../../lib/motion'

export function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const preset = pageTransition(useReducedMotion() ?? false)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        data-testid="page-transition"
        initial={preset.initial}
        animate={preset.animate}
        exit={preset.exit}
        transition={preset.transition}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
