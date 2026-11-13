import { useState, memo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Code2,
  Layers3,
  Megaphone,
  PenTool,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface SubServiceLink {
  label: string
  serviceId: string
  description: string
}

interface ServiceCategoryColumn {
  id: string
  title: string
  icon: LucideIcon
  serviceId: string
  items: SubServiceLink[]
}

const SERVICE_MENU_CATEGORIES: ServiceCategoryColumn[] = [
  {
    id: 'mobile-app-dev',
    title: 'Mobile App Development',
    icon: Smartphone,
    serviceId: 'mobile-app',
    items: [
      {
        label: 'Android App Development',
        serviceId: 'mobile-app',
        description: 'Native Android apps designed for everyday usability',
      },
      {
        label: 'Cross-Platform Mobile Apps',
        serviceId: 'mobile-app',
        description: 'Unified mobile builds across platforms and devices',
      },
      {
        label: 'Cloud & API Integration',
        serviceId: 'cloud-hosting',
        description: 'Reliable backend sync and cloud-hosted services',
      },
      {
        label: 'App Maintenance & Support',
        serviceId: 'maintenance-support',
        description: 'Ongoing updates, fixes, and operational support',
      },
    ],
  },
  {
    id: 'website-dev',
    title: 'Website Development',
    icon: Code2,
    serviceId: 'web-development',
    items: [
      {
        label: 'Business Websites & Portals',
        serviceId: 'web-development',
        description: 'Responsive corporate sites and customer portals',
      },
      {
        label: 'Custom Web Applications',
        serviceId: 'custom-software',
        description: 'Tailored web software for business workflows',
      },
      {
        label: 'E-commerce Solutions',
        serviceId: 'ecommerce',
        description: 'Online storefronts with payment integrations',
      },
      {
        label: 'Cloud Hosting & Support',
        serviceId: 'cloud-hosting',
        description: 'Deployment assistance and ongoing troubleshooting',
      },
    ],
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX Design Services',
    icon: PenTool,
    serviceId: 'ui-ux-design',
    items: [
      {
        label: 'User Interface (UI) Design',
        serviceId: 'ui-ux-design',
        description: 'Clean, accessible visual layouts across screens',
      },
      {
        label: 'UX Flows & Wireframing',
        serviceId: 'ui-ux-design',
        description: 'Structured user journeys and early flow validation',
      },
      {
        label: 'Interactive Prototyping',
        serviceId: 'ui-ux-design',
        description: 'Clickable design prototypes prior to engineering',
      },
      {
        label: 'Graphic Design Assets',
        serviceId: 'ui-ux-design',
        description: 'Visual brand assets for web and digital campaigns',
      },
    ],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing Services',
    icon: Megaphone,
    serviceId: 'digital-marketing',
    items: [
      {
        label: 'Search Engine Optimization (SEO)',
        serviceId: 'digital-marketing',
        description: 'Technical and content visibility across search',
      },
      {
        label: 'Social Media Marketing',
        serviceId: 'digital-marketing',
        description: 'Targeted campaigns to build brand engagement',
      },
      {
        label: 'NFC Digital Business Cards',
        serviceId: 'nfc-digital-cards',
        description: 'Contactless digital cards for instant profile sharing',
      },
      {
        label: 'Technical & Growth Consulting',
        serviceId: 'technical-consulting',
        description: 'Planning digital strategy aligned with goals',
      },
    ],
  },
]

const SPECIALIZED_CAPABILITIES = [
  { label: 'Custom Software', serviceId: 'custom-software' },
  { label: 'CRM & ERP Solutions', serviceId: 'crm-development' },
  { label: 'Cyber Security', serviceId: 'cyber-security' },
  { label: 'DevOps & Automation', serviceId: 'devops-automation' },
  { label: 'AI, ML & Web3', serviceId: 'ai-ml-web3' },
] as const

interface DesktopServicesMegaMenuProps {
  isOpen: boolean
  pathname: string
  onSelectService: (serviceId: string) => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const DesktopServicesMegaMenu = memo(function DesktopServicesMegaMenu({
  isOpen,
  pathname,
  onSelectService,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: DesktopServicesMegaMenuProps) {
  const reducedMotion = useReducedMotion()

  const getServiceHref = (serviceId: string) =>
    pathname === '/' ? `#service-${serviceId}` : `/#service-${serviceId}`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="services-mega-menu"
          className="services-mega-menu"
          role="region"
          aria-label="Services directory"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="container mega-menu-container">
            <div className="mega-menu-grid">
              {SERVICE_MENU_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon
                return (
                  <div className="mega-menu-col" key={category.id}>
                    <a
                      href={getServiceHref(category.serviceId)}
                      className="mega-col-heading"
                      onClick={(event) => {
                        if (pathname === '/') {
                          event.preventDefault()
                        }
                        onSelectService(category.serviceId)
                        onClose()
                      }}
                    >
                      <span className="mega-col-icon" aria-hidden="true">
                        <CategoryIcon size={17} strokeWidth={2} />
                      </span>
                      <span>{category.title}</span>
                    </a>
                    <ul className="mega-sublist">
                      {category.items.map((item) => (
                        <li key={item.label}>
                          <a
                            href={getServiceHref(item.serviceId)}
                            className="mega-sublink"
                            onClick={(event) => {
                              if (pathname === '/') {
                                event.preventDefault()
                              }
                              onSelectService(item.serviceId)
                              onClose()
                            }}
                          >
                            <span className="mega-sublink-title">
                              <span>{item.label}</span>
                              <ChevronRight
                                size={13}
                                className="mega-sublink-arrow"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="mega-sublink-desc">
                              {item.description}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Bottom Specialized Capabilities & View All Strip */}
            <div className="mega-menu-footer">
              <div className="mega-specialized">
                <span className="mega-specialized-label">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Specialized Solutions:</span>
                </span>
                <div className="mega-specialized-links">
                  {SPECIALIZED_CAPABILITIES.map((cap) => (
                    <a
                      key={cap.serviceId}
                      href={getServiceHref(cap.serviceId)}
                      className="mega-pill-link"
                      onClick={(event) => {
                        if (pathname === '/') {
                          event.preventDefault()
                        }
                        onSelectService(cap.serviceId)
                        onClose()
                      }}
                    >
                      {cap.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mega-footer-actions">
                <a
                  href={pathname === '/' ? '#services' : '/#services'}
                  className="mega-view-all-link"
                  onClick={onClose}
                >
                  <Layers3 size={14} aria-hidden="true" />
                  <span>All 14 Services</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

interface MobileServicesAccordionProps {
  pathname: string
  onSelectService: (serviceId: string) => void
  onNavigateAll: () => void
}

export const MobileServicesAccordion = memo(function MobileServicesAccordion({
  pathname,
  onSelectService,
  onNavigateAll,
}: MobileServicesAccordionProps) {
  const [servicesExpanded, setServicesExpanded] = useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    'mobile-app-dev',
  )
  const reducedMotion = useReducedMotion()

  const getServiceHref = (serviceId: string) =>
    pathname === '/' ? `#service-${serviceId}` : `/#service-${serviceId}`

  return (
    <div className="mobile-services-accordion">
      <button
        type="button"
        className={`mobile-accordion-trigger${servicesExpanded ? ' mobile-accordion-trigger--open' : ''}`}
        aria-expanded={servicesExpanded}
        aria-controls="mobile-services-panel"
        onClick={() => setServicesExpanded((open) => !open)}
      >
        <span>Services</span>
        <ChevronDown
          size={17}
          className={`mobile-accordion-chevron${servicesExpanded ? ' rotated' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {servicesExpanded && (
          <motion.div
            id="mobile-services-panel"
            className="mobile-accordion-panel"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mobile-accordion-categories">
              {SERVICE_MENU_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon
                const isCatOpen = expandedCategoryId === category.id
                return (
                  <div className="mobile-cat-group" key={category.id}>
                    <button
                      type="button"
                      className={`mobile-cat-trigger${isCatOpen ? ' mobile-cat-trigger--open' : ''}`}
                      aria-expanded={isCatOpen}
                      onClick={() =>
                        setExpandedCategoryId((prev) =>
                          prev === category.id ? null : category.id,
                        )
                      }
                    >
                      <span className="mobile-cat-label">
                        <CategoryIcon size={15} aria-hidden="true" />
                        <span>{category.title}</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`mobile-cat-chevron${isCatOpen ? ' rotated' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isCatOpen && (
                        <motion.ul
                          className="mobile-cat-sublist"
                          initial={
                            reducedMotion ? false : { height: 0, opacity: 0 }
                          }
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={
                            reducedMotion
                              ? { opacity: 0 }
                              : { height: 0, opacity: 0 }
                          }
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          {category.items.map((item) => (
                            <li key={item.label}>
                              <a
                                href={getServiceHref(item.serviceId)}
                                className="mobile-sublink"
                                onClick={(event) => {
                                  if (pathname === '/') {
                                    event.preventDefault()
                                  }
                                  onSelectService(item.serviceId)
                                }}
                              >
                                <ChevronRight size={13} aria-hidden="true" />
                                <span>{item.label}</span>
                              </a>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

              <a
                href={pathname === '/' ? '#services' : '/#services'}
                className="mobile-view-all-services"
                onClick={onNavigateAll}
              >
                <span>View All 14 Services</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
