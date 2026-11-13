import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
}

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.03 },
  },
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.06 }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredGrid({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={gridVariants}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.04 }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  as = 'article',
}: {
  children: ReactNode
  className: string
  as?: 'article' | 'div'
}) {
  const reducedMotion = useReducedMotion()
  const itemProps = {
    className,
    variants: itemVariants,
  }

  if (as === 'div') {
    return (
      <motion.div
        {...itemProps}
        initial={reducedMotion ? false : undefined}
        whileHover={reducedMotion ? undefined : { y: -4 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.article
      {...itemProps}
      initial={reducedMotion ? false : undefined}
      whileHover={reducedMotion ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.article>
  )
}
