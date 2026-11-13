import { memo } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Reveal } from './Reveal'

interface ServiceItem {
  id: string
  title: string
}

const ALL_SERVICES: ServiceItem[] = [
  { id: 'web-dev', title: 'Web Development' },
  { id: 'mobile-app', title: 'Mobile App Development' },
  { id: 'ui-ux', title: 'UI/UX Design' },
  { id: 'digital-marketing', title: 'Digital Marketing' },
  { id: 'crm-erp', title: 'CRM & ERP Solutions' },
  { id: 'cloud-hosting', title: 'Cloud Hosting' },
  { id: 'tech-consulting', title: 'Technical Consulting' },
  { id: 'cyber-security', title: 'Cyber Security' },
  { id: 'devops', title: 'DevOps & Automation' },
  { id: 'ai-ml-web3', title: 'AI, ML & Web3' },
  { id: 'nfc-cards', title: 'NFC Digital Cards' },
]

// Staggered order for row 2 to create an engaging visual rhythm
const ROW_TWO_SERVICES: ServiceItem[] = [
  { id: 'ai-ml-web3', title: 'AI, ML & Web3' },
  { id: 'cyber-security', title: 'Cyber Security' },
  { id: 'nfc-cards', title: 'NFC Digital Cards' },
  { id: 'cloud-hosting', title: 'Cloud Hosting' },
  { id: 'web-dev', title: 'Web Development' },
  { id: 'devops', title: 'DevOps & Automation' },
  { id: 'ui-ux', title: 'UI/UX Design' },
  { id: 'crm-erp', title: 'CRM & ERP Solutions' },
  { id: 'mobile-app', title: 'Mobile App Development' },
  { id: 'tech-consulting', title: 'Technical Consulting' },
  { id: 'digital-marketing', title: 'Digital Marketing' },
]

interface ServicePillProps {
  title: string
}

function ServicePill({ title }: ServicePillProps) {
  return (
    <div
      className="service-pill"
      tabIndex={0}
      role="listitem"
      aria-label={title}
    >
      <span className="service-pill-icon" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span className="service-pill-text">{title}</span>
    </div>
  )
}

const ServicesMarquee = memo(function ServicesMarquee() {
  return (
    <section
      className="services-marquee-section"
      id="technology"
      aria-label="Capabilities and services marquee"
    >
      {/* Background ambient lighting */}
      <div className="marquee-ambient-glow" aria-hidden="true" />
      <div className="marquee-grid-lines" aria-hidden="true" />

      <Reveal className="container marquee-header-container">
        <div className="marquee-header">
          <span className="marquee-eyebrow">
            <Sparkles size={13} className="eyebrow-sparkle" />
            END-TO-END DIGITAL CAPABILITIES
          </span>
          <h2 className="marquee-title">
            Transforming Ideas with Next-Gen Engineering
          </h2>
          <p className="marquee-subtitle">
            From modern web &amp; mobile architectures to cloud, security, and AI —
            delivering resilient technology tailored for global growth.
          </p>
        </div>
      </Reveal>

      {/* Marquee Container with fade edge masks */}
      <Reveal
        className="marquee-viewport"
        delay={0.08}
      >
        {/* ROW 1: Scrolling Right-to-Left */}
        <div className="marquee-row marquee-row--left">
          <div className="marquee-track marquee-track--left" role="list">
            {ALL_SERVICES.map((item, idx) => (
              <ServicePill key={`r1-a-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
          <div
            className="marquee-track marquee-track--left"
            role="presentation"
            aria-hidden="true"
          >
            {ALL_SERVICES.map((item, idx) => (
              <ServicePill key={`r1-b-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
          <div
            className="marquee-track marquee-track--left"
            role="presentation"
            aria-hidden="true"
          >
            {ALL_SERVICES.map((item, idx) => (
              <ServicePill key={`r1-c-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
        </div>

        {/* ROW 2: Scrolling Left-to-Right (Reverse direction) */}
        <div className="marquee-row marquee-row--right">
          <div className="marquee-track marquee-track--right" role="list">
            {ROW_TWO_SERVICES.map((item, idx) => (
              <ServicePill key={`r2-a-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
          <div
            className="marquee-track marquee-track--right"
            role="presentation"
            aria-hidden="true"
          >
            {ROW_TWO_SERVICES.map((item, idx) => (
              <ServicePill key={`r2-b-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
          <div
            className="marquee-track marquee-track--right"
            role="presentation"
            aria-hidden="true"
          >
            {ROW_TWO_SERVICES.map((item, idx) => (
              <ServicePill key={`r2-c-${item.id}-${idx}`} title={item.title} />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
})

export default ServicesMarquee
