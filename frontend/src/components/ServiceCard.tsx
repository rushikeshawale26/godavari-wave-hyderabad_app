import { memo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  GitBranch,
  Lightbulb,
  Nfc,
  PenTool,
  ShieldCheck,
  Smartphone,
  Layers3,
  ShoppingCart,
  Megaphone,
  Server,
  Wrench,
  ClipboardList,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface ServiceCardData {
  id: string
  iconKey:
    | 'web'
    | 'mobile'
    | 'software'
    | 'commerce'
    | 'marketing'
    | 'cloud'
    | 'support'
    | 'crm'
    | 'design'
    | 'nfc'
    | 'consulting'
    | 'security'
    | 'devops'
    | 'ai'
  imageUrl: string
  imageAlt: string
  title: string
  description: string
  tags: string[]
  isFeatured?: boolean
}

const iconMap: Record<ServiceCardData['iconKey'], LucideIcon> = {
  web: Code2,
  mobile: Smartphone,
  software: Layers3,
  commerce: ShoppingCart,
  marketing: Megaphone,
  cloud: Server,
  support: Wrench,
  crm: ClipboardList,
  design: PenTool,
  nfc: Nfc,
  consulting: Lightbulb,
  security: ShieldCheck,
  devops: GitBranch,
  ai: BrainCircuit,
}

interface ServiceCardProps {
  service: ServiceCardData
  index: number
  disableReveal?: boolean
}

const ServiceCard = memo(function ServiceCard({
  service,
  index,
  disableReveal = false,
}: ServiceCardProps) {
  const reducedMotion = useReducedMotion()
  const [imageFailed, setImageFailed] = useState(false)
  const IconComponent = iconMap[service.iconKey]
  const formattedIndex = String(index + 1).padStart(2, '0')

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  return (
    <motion.article
      id={`service-${service.id}`}
      className={`service-card ${service.isFeatured ? 'service-card--featured' : ''}`}
      variants={reducedMotion || disableReveal ? undefined : cardVariants}
      whileHover={reducedMotion ? undefined : { y: -5 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Top accent line */}
      <div className="card-top-accent" aria-hidden="true" />

      {/* Ambient background glow and decorative corner circle */}
      <div className="card-ambient-glow" aria-hidden="true" />
      <div className="card-corner-shape" aria-hidden="true" />

      <div className="service-card-image">
        {imageFailed ? (
          <div className="service-image-fallback" aria-hidden="true">
            <IconComponent size={34} strokeWidth={1.6} />
          </div>
        ) : (
          <img
            src={service.imageUrl}
            alt={service.imageAlt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Top Header Row: Icon & Service Number / Featured Badge */}
      <div className="service-card-top">
        <div className="service-icon-container" aria-hidden="true">
          <div className="service-icon-backdrop" />
          <IconComponent className="service-icon-svg" size={22} strokeWidth={2} />
        </div>

        <div className="service-card-meta">
          {service.isFeatured && (
            <span className="featured-badge">
              <Sparkles size={11} className="featured-badge-icon" />
              <span>Core Focus</span>
            </span>
          )}
          <span className="card-index-badge">{formattedIndex}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="service-card-body">
        <h3 className="service-card-title">{service.title}</h3>
        <p className="service-card-desc">{service.description}</p>
      </div>

      {/* Tags & Action Link */}
      <div className="service-card-footer">
        <div className="service-card-tags" aria-label="Capabilities and highlights">
          {service.tags.map((tag) => (
            <span key={tag} className="service-tag-pill">
              {tag}
            </span>
          ))}
        </div>

        <a
          className="service-card-link"
          href="#contact"
          aria-label={`Enquire about ${service.title}`}
        >
          <span>Learn more</span>
          <span className="link-arrow-circle" aria-hidden="true">
            <ArrowRight size={14} strokeWidth={2.5} />
          </span>
        </a>
      </div>
    </motion.article>
  )
})

export default ServiceCard
