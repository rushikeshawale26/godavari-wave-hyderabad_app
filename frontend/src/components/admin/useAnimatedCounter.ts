import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly animates a numeric KPI counter on initial load and value updates,
 * while immediately snapping to the target when prefers-reduced-motion is enabled.
 */
export function useAnimatedCounter(target: number, durationMs = 560): number {
  const safeTarget = Number.isFinite(target) ? target : 0
  const [displayValue, setDisplayValue] = useState<number>(safeTarget)
  const previousRef = useRef<number>(0)
  const initializedRef = useRef(false)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      previousRef.current = safeTarget
      const raf = window.requestAnimationFrame(() => setDisplayValue(safeTarget))
      return () => window.cancelAnimationFrame(raf)
    }

    const from = initializedRef.current ? previousRef.current : 0
    initializedRef.current = true
    previousRef.current = safeTarget

    if (from === safeTarget) {
      const raf = window.requestAnimationFrame(() => setDisplayValue(safeTarget))
      return () => window.cancelAnimationFrame(raf)
    }

    let frameId = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)
      // Ease-out cubic for natural deceleration as numbers settle
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + (safeTarget - from) * eased)
      setDisplayValue(next)
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      } else {
        setDisplayValue(safeTarget)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [durationMs, safeTarget])

  return displayValue
}
