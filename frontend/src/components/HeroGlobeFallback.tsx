import { memo } from 'react'

interface HeroGlobeFallbackProps {
  className?: string
  showHqLabel?: boolean
}

export const HeroGlobeFallback = memo(function HeroGlobeFallback({
  className = '',
  showHqLabel = true,
}: HeroGlobeFallbackProps) {
  return (
    <div
      className={`hero-globe-fallback ${className}`}
      role="img"
      aria-label="Interactive digital globe illustration representing Godavari Wave Technologies global network"
    >
      <div className="fallback-glow fallback-glow--outer" />
      <div className="fallback-glow fallback-glow--core" />

      {/* Decorative Orbit Rings */}
      <div className="fallback-orbit fallback-orbit--one" />
      <div className="fallback-orbit fallback-orbit--two" />

      {/* Stylized Vector Globe */}
      <svg
        className="fallback-globe-svg"
        viewBox="0 0 460 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id="globeSphereGrad"
            cx="40%"
            cy="36%"
            r="65%"
            fx="35%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#e8f2ff" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#c7dffe" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#8ebbf7" stopOpacity="0.45" />
          </radialGradient>

          <linearGradient id="arcGradA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="arcGradB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>

          <filter id="fallbackGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Halo */}
        <circle
          cx="230"
          cy="230"
          r="196"
          stroke="rgba(147, 197, 253, 0.35)"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <circle
          cx="230"
          cy="230"
          r="180"
          stroke="rgba(96, 165, 250, 0.45)"
          strokeWidth="1.5"
        />

        {/* Shaded Globe Body */}
        <circle
          cx="230"
          cy="230"
          r="174"
          fill="url(#globeSphereGrad)"
          stroke="#93c5fd"
          strokeWidth="1"
        />

        {/* Latitude Lines */}
        <ellipse
          cx="230"
          cy="230"
          rx="174"
          ry="32"
          stroke="rgba(59, 130, 246, 0.35)"
          strokeWidth="1.1"
        />
        <ellipse
          cx="230"
          cy="165"
          rx="158"
          ry="25"
          stroke="rgba(59, 130, 246, 0.28)"
          strokeWidth="1"
        />
        <ellipse
          cx="230"
          cy="295"
          rx="158"
          ry="25"
          stroke="rgba(59, 130, 246, 0.28)"
          strokeWidth="1"
        />
        <ellipse
          cx="230"
          cy="115"
          rx="122"
          ry="18"
          stroke="rgba(59, 130, 246, 0.22)"
          strokeWidth="0.9"
        />
        <ellipse
          cx="230"
          cy="345"
          rx="122"
          ry="18"
          stroke="rgba(59, 130, 246, 0.22)"
          strokeWidth="0.9"
        />

        {/* Longitude Arcs */}
        <ellipse
          cx="230"
          cy="230"
          rx="44"
          ry="174"
          stroke="rgba(59, 130, 246, 0.32)"
          strokeWidth="1.1"
        />
        <ellipse
          cx="230"
          cy="230"
          rx="98"
          ry="174"
          stroke="rgba(59, 130, 246, 0.28)"
          strokeWidth="1"
        />
        <ellipse
          cx="230"
          cy="230"
          rx="146"
          ry="174"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="0.9"
        />

        {/* Connection Network Arcs (Connecting Hyderabad ~ [275, 205] to global nodes) */}
        {/* Hyderabad to London / Frankfurt [170, 155] */}
        <path
          d="M 275 205 Q 220 135 170 155"
          stroke="url(#arcGradA)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#fallbackGlow)"
        />
        {/* Hyderabad to San Francisco [95, 175] */}
        <path
          d="M 275 205 Q 185 105 95 175"
          stroke="url(#arcGradA)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="4 3"
        />
        {/* Hyderabad to Singapore [320, 245] */}
        <path
          d="M 275 205 Q 300 220 320 245"
          stroke="url(#arcGradB)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#fallbackGlow)"
        />
        {/* Hyderabad to Dubai [230, 195] */}
        <path
          d="M 275 205 Q 255 190 230 195"
          stroke="url(#arcGradA)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Hyderabad to Tokyo [345, 175] */}
        <path
          d="M 275 205 Q 315 155 345 175"
          stroke="url(#arcGradB)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Hyderabad to Sydney [340, 310] */}
        <path
          d="M 275 205 Q 325 265 340 310"
          stroke="url(#arcGradA)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Network Hub Nodes */}
        {/* San Francisco */}
        <circle cx="95" cy="175" r="3.5" fill="#2563eb" />
        <circle cx="95" cy="175" r="7" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1" />

        {/* London / Europe */}
        <circle cx="170" cy="155" r="4" fill="#2563eb" />
        <circle cx="170" cy="155" r="8" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1" />

        {/* Dubai */}
        <circle cx="230" cy="195" r="3.5" fill="#0284c7" />

        {/* Singapore */}
        <circle cx="320" cy="245" r="3.5" fill="#0284c7" />

        {/* Tokyo */}
        <circle cx="345" cy="175" r="3.5" fill="#2563eb" />

        {/* Sydney */}
        <circle cx="340" cy="310" r="3.5" fill="#0284c7" />

        {/* HYDERABAD (HQ - Highlighted Pulse Node) */}
        <circle
          cx="275"
          cy="205"
          r="14"
          fill="rgba(56, 189, 248, 0.22)"
          className="fallback-pulse"
        />
        <circle
          cx="275"
          cy="205"
          r="8"
          fill="rgba(37, 99, 235, 0.35)"
        />
        <circle
          cx="275"
          cy="205"
          r="5"
          fill="#0284c7"
          stroke="#ffffff"
          strokeWidth="1.8"
        />

        {/* Data Floating Dots */}
        <circle cx="140" cy="115" r="2" fill="#60a5fa" opacity="0.6" />
        <circle cx="205" cy="85" r="1.8" fill="#38bdf8" opacity="0.8" />
        <circle cx="370" cy="130" r="2.2" fill="#93c5fd" opacity="0.7" />
        <circle cx="110" cy="265" r="2.5" fill="#60a5fa" opacity="0.5" />
        <circle cx="295" cy="360" r="2" fill="#38bdf8" opacity="0.7" />
        <circle cx="380" cy="235" r="2.2" fill="#2563eb" opacity="0.6" />
      </svg>

      {showHqLabel && (
        <div className="fallback-badge fallback-badge--hq">
          <span className="badge-pulse-dot" />
          <strong>Hyderabad · HQ</strong>
        </div>
      )}
    </div>
  )
})

export default HeroGlobeFallback
