import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import HeroGlobeFallback from './HeroGlobeFallback'

let webGLSupport: boolean | undefined
function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false
  if (webGLSupport !== undefined) return webGLSupport

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    webGLSupport = Boolean(gl)
    if (gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webGLSupport = false
  }

  return webGLSupport
}

function shouldShowFallback(): boolean {
  if (typeof window === 'undefined') return true
  const isMobile = window.matchMedia('(max-width: 767px)').matches
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const webglSupported = checkWebGLSupport()

  return isMobile || prefersReducedMotion || !webglSupported
}

const heroGlobeScenePromise = shouldShowFallback()
  ? null
  : import('./HeroGlobeScene')
const HeroGlobeScene = lazy(
  () => heroGlobeScenePromise ?? import('./HeroGlobeScene'),
)

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hqLabelRef = useRef<HTMLDivElement>(null)
  const [canRenderScene, setCanRenderScene] = useState<boolean>(
    () => !shouldShowFallback(),
  )
  const [hasRenderedScene, setHasRenderedScene] = useState(false)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const handleFirstFrame = useCallback(() => setHasRenderedScene(true), [])

  useEffect(() => {
    const mqlMobile = window.matchMedia('(max-width: 767px)')
    const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let isIntersecting = true
    let isDocVisible = !document.hidden

    const updateVisibility = () => {
      setIsVisible(
        isIntersecting &&
          isDocVisible &&
          !mqlMobile.matches &&
          !mqlMotion.matches,
      )
    }

    const checkConditions = () => {
      const canRender =
        !mqlMobile.matches &&
          !mqlMotion.matches &&
          checkWebGLSupport()
      setCanRenderScene(canRender)
      if (!canRender) setHasRenderedScene(false)
      updateVisibility()
    }

    const onVisibilityChange = () => {
      isDocVisible = !document.hidden
      updateVisibility()
    }

    mqlMobile.addEventListener?.('change', checkConditions)
    mqlMotion.addEventListener?.('change', checkConditions)
    window.addEventListener('resize', checkConditions, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    let observer: IntersectionObserver | null = null
    if (containerRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting
          updateVisibility()
        },
        { rootMargin: '50px 0px 50px 0px', threshold: 0.05 },
      )
      observer.observe(containerRef.current)
    }

    return () => {
      mqlMobile.removeEventListener?.('change', checkConditions)
      mqlMotion.removeEventListener?.('change', checkConditions)
      window.removeEventListener('resize', checkConditions)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (observer) observer.disconnect()
    }
  }, [])

  if (!canRenderScene) {
    return <HeroGlobeFallback />
  }

  return (
    <div ref={containerRef} className="hero-3d-wrapper">
      <Suspense fallback={null}>
        <HeroGlobeScene
          isVisible={isVisible}
          hasRendered={hasRenderedScene}
          onFirstFrame={handleFirstFrame}
          hqLabelRef={hqLabelRef}
        />
      </Suspense>
      {!hasRenderedScene && (
        <div className="hero-globe-loading" aria-hidden="true">
          <HeroGlobeFallback showHqLabel={false} />
        </div>
      )}
      <div ref={hqLabelRef} className="globe-hq-badge" aria-hidden="true">
        <span className="hq-dot" />
        <span className="hq-text">Hyderabad · HQ</span>
      </div>
    </div>
  )
}
