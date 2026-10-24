import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const CONFETTI_MS = 1500
const colors = ['#7c3aed', '#a78bfa', '#c026d3', '#f0abfc', '#22c55e', '#facc15']

const pieces = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2
  const distance = index % 2 === 0 ? 96 : 136
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: (index % 3) * 120 + 90,
    color: colors[index % colors.length],
    round: index % 3 === 0,
  }
})

export function SuccessBurst() {
  const reduced = useReducedMotion() ?? false
  const [confetti, setConfetti] = useState(!reduced)

  useEffect(() => {
    if (!confetti) return
    const timer = setTimeout(() => setConfetti(false), CONFETTI_MS)
    return () => clearTimeout(timer)
  }, [confetti])

  return (
    <motion.div
      data-testid="success-burst"
      aria-hidden="true"
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 16 }}
      className="relative mx-auto grid size-28 place-items-center"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-brand shadow-xl shadow-brand-600/40 dark:bg-none dark:bg-primary" />
      <div className="absolute -inset-3 rounded-full bg-brand-400/20 blur-xl" />
      <svg data-testid="success-check" viewBox="0 0 52 52" className="relative size-14 text-white">
        <motion.path
          d="M14 27l8 8 16-17"
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.45, ease: 'easeOut' }}
        />
      </svg>
      {confetti &&
        pieces.map((piece, index) => (
          <motion.span
            key={index}
            data-testid="confetti"
            className={
              piece.round ? 'absolute size-2 rounded-full' : 'absolute h-3 w-1.5 rounded-sm'
            }
            style={{
              backgroundColor: piece.color,
              left: 'calc(50% - 4px)',
              top: 'calc(50% - 4px)',
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: piece.x, y: piece.y, opacity: 0, rotate: piece.rotate }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        ))}
    </motion.div>
  )
}
