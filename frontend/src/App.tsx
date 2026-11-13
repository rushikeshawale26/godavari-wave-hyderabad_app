import {
  useCallback,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Cloud,
  Code2,
  ClipboardList,
  Crosshair,
  ShoppingCart,
  Megaphone,
  ExternalLink,
  Globe2,
  Headset,
  Layers3,
  Mail,
  MapPin,
  Menu,
  PencilRuler,
  Phone,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Server,
  Sun,
  Moon,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  getPublicSiteContent,
  type PublicSiteContent,
} from './services/api'
import Branches from './components/Branches'
import BrandLogo from './components/BrandLogo'
import ContactEnquiryContent from './components/ContactEnquiryContent'
import EnquiryPopupModal from './components/EnquiryPopupModal'
import HeroScene from './components/HeroScene'
import MobileHeroCarousel from './components/MobileHeroCarousel'
import ServicesMarquee from './components/ServicesMarquee'
import {
  DesktopServicesMegaMenu,
  MobileServicesAccordion,
} from './components/ServicesMegaMenu'
import NavbarSearch from './components/NavbarSearch'
import ServiceCard, { type ServiceCardData } from './components/ServiceCard'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './context/ThemeContext'
import { Reveal, RevealItem, StaggeredGrid } from './components/Reveal'
import Careers from './pages/Careers'
import './App.css'
import { motion, useReducedMotion, type Variants } from 'motion/react'

const ChatAssistant = lazy(() => import('./components/ChatAssistant'))
const AdminLeadsPage = lazy(() => import('./pages/AdminLeadsPage'))

type IconName =
  | 'arrow'
  | 'spark'
  | 'code'
  | 'cloud'
  | 'data'
  | 'commerce'
  | 'marketing'
  | 'server'
  | 'maintenance'
  | 'shield'
  | 'mobile'
  | 'design'
  | 'layers'
  | 'support'
  | 'check'
  | 'pin'
  | 'mail'
  | 'phone'
  | 'clock'
  | 'menu'
  | 'close'
  | 'external'
  | 'globe'
  | 'target'
  | 'search'
  | 'blueprint'
  | 'prototype'
  | 'cycle'
  | 'quality'
  | 'rocket'

const iconComponents: Record<IconName, LucideIcon> = {
  arrow: ArrowRight,
  spark: Sparkles,
  code: Code2,
  cloud: Cloud,
  data: Layers3,
  commerce: ShoppingCart,
  marketing: Megaphone,
  server: Server,
  maintenance: Wrench,
  shield: ShieldCheck,
  mobile: Smartphone,
  design: PencilRuler,
  layers: Layers3,
  support: Headset,
  check: Check,
  pin: MapPin,
  mail: Mail,
  phone: Phone,
  clock: Clock3,
  menu: Menu,
  close: X,
  external: ExternalLink,
  globe: Globe2,
  target: Crosshair,
  search: Search,
  blueprint: ClipboardList,
  prototype: Layers3,
  cycle: RefreshCw,
  quality: BadgeCheck,
  rocket: Rocket,
}

function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const IconComponent = iconComponents[name]

  return (
    <IconComponent
      className={className}
      size={size}
      aria-hidden="true"
      strokeWidth={1.7}
    />
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'center' | 'left'
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={`section-heading section-heading--${align}`}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </motion.div>
  )
}

const navigation: [string, string][] = [
  ['Home', '#home'],
  ['About Us', '#about'],
  ['Services', '#services'],
  ['Tech Stack', '#technology'],
  ['Projects', '#projects'],
  ['Careers', '/careers'],
  ['Contact', '#contact'],
]

const services: ServiceCardData[] = [
  {
    id: 'web-development',
    iconKey: 'web',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Laptop displaying a web development workspace',
    title: 'Web Design & Development',
    description: 'Responsive websites, business portals, and custom web applications.',
    tags: ['Responsive websites', 'Web portals'],
  },
  {
    id: 'mobile-app',
    iconKey: 'mobile',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Smartphone showing a mobile application interface',
    title: 'Mobile App Development',
    description: 'Android and cross-platform mobile applications designed for usability.',
    tags: ['Android', 'Cross-platform'],
  },
  {
    id: 'ui-ux-design',
    iconKey: 'design',
    imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Designer reviewing a digital interface on a tablet',
    title: 'UI/UX & Graphic Design',
    description: 'User-focused interface design, prototypes, and graphic assets.',
    tags: ['UI/UX', 'Graphic design'],
  },
  {
    id: 'custom-software',
    iconKey: 'software',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Close-up of a modern computer circuit board',
    title: 'Custom Software',
    description: 'Software solutions tailored to the needs of businesses and startups.',
    tags: ['Business software', 'Custom solutions'],
    isFeatured: true,
  },
  {
    id: 'ecommerce',
    iconKey: 'commerce',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Online payment card used for an e-commerce purchase',
    title: 'E-commerce Solutions',
    description: 'Online stores and e-commerce platforms with payment integrations.',
    tags: ['Online stores', 'Payments'],
  },
  {
    id: 'nfc-digital-cards',
    iconKey: 'nfc',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Person using a phone for a digital contact exchange',
    title: 'NFC Digital Cards',
    description: 'Smart contactless digital business cards for instant profile and contact sharing.',
    tags: ['NFC', 'Digital cards'],
  },
  {
    id: 'digital-marketing',
    iconKey: 'marketing',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Digital analytics dashboard with charts and metrics',
    title: 'Digital Marketing',
    description: 'Search engine optimization and social media campaigns built to grow brand visibility.',
    tags: ['SEO', 'Social media'],
  },
  {
    id: 'cloud-hosting',
    iconKey: 'cloud',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Global digital network representing cloud infrastructure',
    title: 'Cloud Hosting & IT Support',
    description: 'Reliable cloud hosting setup, infrastructure management, and responsive IT support.',
    tags: ['Cloud hosting', 'IT support'],
  },
  {
    id: 'maintenance-support',
    iconKey: 'support',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Person using a laptop for technical support and maintenance',
    title: 'Maintenance & Support',
    description: 'Proactive updates, bug resolution, and ongoing care for websites and applications.',
    tags: ['Maintenance', 'Troubleshooting'],
  },
  {
    id: 'crm-development',
    iconKey: 'crm',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Team reviewing a business management workflow together',
    title: 'CRM & ERP Solutions',
    description: 'Custom CRM and ERP platforms to streamline sales pipelines, workflows, and operations.',
    tags: ['CRM', 'ERP'],
  },
  {
    id: 'technical-consulting',
    iconKey: 'consulting',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Technology consultants discussing a project plan',
    title: 'Technical Consulting',
    description: 'Practical technology guidance to evaluate requirements, architecture, and delivery plans.',
    tags: ['Technology planning', 'Consulting'],
  },
  {
    id: 'cyber-security',
    iconKey: 'security',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Digital security visualization representing cybersecurity',
    title: 'Cyber Security',
    description: 'Security-focused reviews and protective controls for business applications and data.',
    tags: ['Security', 'Risk awareness'],
  },
  {
    id: 'devops-automation',
    iconKey: 'devops',
    imageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Cloud engineering workspace representing DevOps automation',
    title: 'DevOps & Automation',
    description: 'Automated build, testing, and deployment workflows for consistent software releases.',
    tags: ['DevOps', 'Automation'],
  },
  {
    id: 'ai-ml-web3',
    iconKey: 'ai',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Abstract artificial intelligence network visualization',
    title: 'AI, ML & Web3',
    description: 'Applied AI, machine learning, and Web3 integrations designed around business goals.',
    tags: ['AI & ML', 'Web3'],
  },
]

const advantages: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'target',
    title: 'Practical Engineering Focus',
    description:
      'Every product is shaped around real operational workflows, maintainable code, and measurable business clarity.',
  },
  {
    icon: 'cycle',
    title: 'Transparent Agile Delivery',
    description:
      'Structured sprints, regular progress demos, and open communication keep teams aligned at every milestone.',
  },
  {
    icon: 'quality',
    title: 'Built-In Quality & Security',
    description:
      'Functional testing, API validation, and security checks are integrated directly into our development lifecycle.',
  },
  {
    icon: 'support',
    title: 'Dedicated Hyderabad Support',
    description:
      'Collaborate directly with our Hyderabad engineering and delivery team from initial planning through post-launch care.',
  },
]

interface SolutionCapability {
  id: string
  category: string
  title: string
  problem: string
  description: string
  features: string[]
  imageUrl: string
  imageAlt: string
  icon: IconName
}

const solutions: SolutionCapability[] = [
  {
    id: 'crm-systems',
    category: 'CRM Systems · Customer Management',
    title: 'Customer Relationship Management Platform',
    problem: 'Eliminates scattered spreadsheets and missed lead follow-ups across sales and support teams.',
    description:
      'Centralized lead pipelines, contact timelines, automated follow-up tracking, and role-based team views.',
    features: ['Lead pipelines', 'Role-based access', 'REST APIs', 'Activity logs'],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Team collaborating on a customer relationship workflow',
    icon: 'data',
  },
  {
    id: 'business-management',
    category: 'Business Management · ERP & Operations',
    title: 'Unified Operations & Workflow Suite',
    problem: 'Replaces disconnected manual approvals and tracking sheets with one coordinated business portal.',
    description:
      'Modular dashboards covering team tasks, approval workflows, billing summaries, and structured cloud records.',
    features: ['Workflow approvals', 'Cloud database', 'Department portals', 'Audit trails'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Modern business management interface displayed on a laptop screen',
    icon: 'blueprint',
  },
  {
    id: 'ecommerce-apps',
    category: 'E-commerce Applications · Digital Retail',
    title: 'Scalable Online Storefront & Checkout',
    problem: 'Helps brands sell online smoothly without slow product browsing, manual stock checks, or checkout friction.',
    description:
      'Responsive catalogs, smart cart management, secure payment gateway integration, and real-time order updates.',
    features: ['Product catalogs', 'Payment gateways', 'Order tracking', 'Inventory sync'],
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Customer completing a digital e-commerce checkout',
    icon: 'commerce',
  },
  {
    id: 'mobile-apps',
    category: 'Mobile Applications · Android & Cross-Platform',
    title: 'Customer & Field Operations Mobile App',
    problem: 'Gives customers and mobile teams reliable access to services anytime without relying on desktop browsers.',
    description:
      'Intuitive mobile interfaces with instant API synchronization, secure authentication, and notification support.',
    features: ['Cross-platform UI', 'Push alerts', 'API sync', 'Secure login'],
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Smartphone displaying a responsive mobile application',
    icon: 'mobile',
  },
  {
    id: 'analytics-dashboards',
    category: 'Business Analytics · Data & Reporting',
    title: 'Executive Insights & Reporting Dashboard',
    problem: 'Removes manual data compilation delays when teams need clear visibility across business metrics.',
    description:
      'Interactive KPI summaries, date-filtered trend charts, operational breakdowns, and structured report exports.',
    features: ['Interactive charts', 'Live KPI cards', 'CSV/PDF exports', 'API aggregation'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Analytics charts and business reporting dashboard',
    icon: 'marketing',
  },
  {
    id: 'custom-web-apps',
    category: 'Custom Web Applications · Client Portals',
    title: 'Tailored SaaS & Service Web Portal',
    problem: 'Supports specialized business logic and client onboarding steps that off-the-shelf templates cannot handle.',
    description:
      'Responsive web portals engineered with clean modular APIs, strong authentication, and cloud-ready deployment.',
    features: ['Custom portals', 'Modular APIs', 'Responsive UI', 'Cloud hosting'],
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Developer workstation running a custom web application',
    icon: 'code',
  },
]

const lifecycle: {
  icon: IconName
  number: string
  title: string
  text: string
  activities: string[]
}[] = [
  {
    icon: 'search',
    number: '01',
    title: 'Requirement Analysis',
    text: 'Understand business needs, user requirements, project objectives, and delivery scope.',
    activities: ['Business discovery', 'User requirements', 'Scope definition'],
  },
  {
    icon: 'blueprint',
    number: '02',
    title: 'Strategic Architecture',
    text: 'Select suitable technologies and design application architecture, database structure, and API communication.',
    activities: ['Tech selection', 'Database design', 'API structure'],
  },
  {
    icon: 'prototype',
    number: '03',
    title: 'UI/UX Prototyping',
    text: 'Create structured wireframes, interactive prototypes, and responsive user interfaces for early review.',
    activities: ['Wireframes', 'Interactive prototypes', 'Responsive UI'],
  },
  {
    icon: 'cycle',
    number: '04',
    title: 'Agile Development',
    text: 'Develop modular frontend and backend features and integrate APIs, workflows, and cloud databases.',
    activities: ['Frontend & backend', 'API integration', 'Iterative sprints'],
  },
  {
    icon: 'shield',
    number: '05',
    title: 'Quality Assurance & Security',
    text: 'Perform functional testing and validate application performance, responsiveness, APIs, and security.',
    activities: ['Functional & API QA', 'Responsiveness check', 'Security checks'],
  },
  {
    icon: 'rocket',
    number: '06',
    title: 'Deployment & Support',
    text: 'Prepare production deployment, configure hosting infrastructure, and deliver maintenance as agreed.',
    activities: ['Production launch', 'Cloud hosting', 'Ongoing support'],
  },
]

const teamDisciplines: {
  icon: IconName
  department: string
  title: string
  description: string
  focusAreas: string[]
}[] = [
  {
    icon: 'code',
    department: 'ENGINEERING',
    title: 'Full-Stack & Cloud Engineering',
    description:
      'Software engineers collaborating across frontend interfaces, backend APIs, databases, and scalable cloud deployments.',
    focusAreas: ['Web & mobile apps', 'API architecture', 'Cloud infrastructure'],
  },
  {
    icon: 'design',
    department: 'DESIGN',
    title: 'UI/UX & Product Design',
    description:
      'Design specialists translating complex business workflows into intuitive layouts, prototypes, and accessible interfaces.',
    focusAreas: ['User journeys', 'Wireframing', 'Responsive systems'],
  },
  {
    icon: 'quality',
    department: 'DELIVERY & QA',
    title: 'Project Delivery & Quality Assurance',
    description:
      'Coordinators and QA testers aligning client communication, sprint milestones, security validation, and post-launch support.',
    focusAreas: ['Agile coordination', 'End-to-end testing', 'Client support'],
  },
]

function Header({ onOpenCareers }: { onOpenCareers: () => void }) {
  const { theme, resolvedTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const headerRef = useRef<HTMLElement>(null)
  const closeMenuTimerRef = useRef<number | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const clearCloseTimer = useCallback(() => {
    if (closeMenuTimerRef.current !== null) {
      window.clearTimeout(closeMenuTimerRef.current)
      closeMenuTimerRef.current = null
    }
  }, [])

  const openServicesMenu = useCallback(() => {
    clearCloseTimer()
    if (window.innerWidth > 1023) {
      setServicesMenuOpen(true)
    }
  }, [clearCloseTimer])

  const scheduleCloseServicesMenu = useCallback(() => {
    clearCloseTimer()
    closeMenuTimerRef.current = window.setTimeout(() => {
      setServicesMenuOpen(false)
      closeMenuTimerRef.current = null
    }, 140)
  }, [clearCloseTimer])

  const closeServicesMenuImmediate = useCallback(() => {
    clearCloseTimer()
    setServicesMenuOpen(false)
  }, [clearCloseTimer])

  useEffect(() => clearCloseTimer, [clearCloseTimer])

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8)
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (current) setActiveSection(current.target.id)
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.25, 0.5] },
    )
    for (const [, href] of navigation) {
      if (!href.startsWith('#')) continue
      const section = document.querySelector<HTMLElement>(href)
      if (section) observer.observe(section)
    }

    return () => {
      window.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [pathname])

  useEffect(() => {
    if (!servicesMenuOpen && !menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        closeServicesMenuImmediate()
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeServicesMenuImmediate()
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeServicesMenuImmediate, menuOpen, servicesMenuOpen])

  const handleSelectService = useCallback(
    (serviceId: string) => {
      closeServicesMenuImmediate()
      setMenuOpen(false)

      if (pathname !== '/') {
        navigate(`/#service-${serviceId}`)
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('godavari:select-service', { detail: serviceId }),
          )
        }, 120)
        return
      }

      window.dispatchEvent(
        new CustomEvent('godavari:select-service', { detail: serviceId }),
      )
    },
    [closeServicesMenuImmediate, navigate, pathname],
  )

  const handleServicesTriggerClick = useCallback(() => {
    closeServicesMenuImmediate()
    setMenuOpen(false)

    if (pathname !== '/') {
      navigate('/#services')
      return
    }

    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
  }, [closeServicesMenuImmediate, navigate, pathname])

  return (
    <header
      ref={headerRef}
      className={`site-header max-lg:!bg-[#164E8A]${scrolled ? ' site-header--scrolled' : ''}${servicesMenuOpen ? ' site-header--mega-open' : ''}`}
    >
      <div className="header-inner">
        <Link
          className="brand"
          to="/"
          aria-label="Godavari Wave Technologies home"
          onClick={() => {
            setMenuOpen(false)
            closeServicesMenuImmediate()
          }}
        >
          <span className="header-logo-badge">
            <BrandLogo />
          </span>
        </Link>

        {/* Mobile controls: Mobile hamburger menu trigger */}
        <div className="header-mobile-controls">
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => {
              setMenuOpen((open) => !open)
              closeServicesMenuImmediate()
            }}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={23} />
          </button>
        </div>

        <nav
          id="primary-navigation"
          className={`primary-nav max-lg:!bg-[#164E8A]${menuOpen ? ' primary-nav--open' : ''}`}
          aria-label="Main navigation"
        >
          <div className="mobile-nav-search-slot">
            <NavbarSearch
              variant="mobile"
              onSelectService={handleSelectService}
              onOpenCareers={() => {
                setMenuOpen(false)
                onOpenCareers()
              }}
              onNavigate={() => {
                setMenuOpen(false)
                closeServicesMenuImmediate()
              }}
            />
          </div>

          {navigation.map(([label, href]) => {
            const target = href.startsWith('#') && pathname !== '/' ? `/${href}` : href

            if (href === '#services') {
              return (
                <div
                  key={href}
                  className="nav-services-slot"
                  onMouseEnter={openServicesMenu}
                  onMouseLeave={scheduleCloseServicesMenu}
                >
                  <button
                    type="button"
                    className={`nav-services-trigger${servicesMenuOpen ? ' nav-services-trigger--open' : ''}`}
                    aria-expanded={servicesMenuOpen}
                    aria-controls="services-mega-menu"
                    aria-current={
                      pathname === '/' && activeSection === 'services'
                        ? 'location'
                        : undefined
                    }
                    onClick={handleServicesTriggerClick}
                  >
                    <span>{label}</span>
                    <ChevronDown
                      size={14}
                      className={`nav-services-chevron${servicesMenuOpen ? ' rotated' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  <MobileServicesAccordion
                    pathname={pathname}
                    onSelectService={handleSelectService}
                    onNavigateAll={() => {
                      setMenuOpen(false)
                      closeServicesMenuImmediate()
                    }}
                  />
                </div>
              )
            }

            return href === '/careers' ? (
              <Link
                key={href}
                to={href}
                aria-current={pathname === href ? 'page' : undefined}
                onMouseEnter={closeServicesMenuImmediate}
                onClick={() => {
                  setMenuOpen(false)
                  closeServicesMenuImmediate()
                }}
              >
                {label}
              </Link>
            ) : (
              <a
                key={href}
                href={target}
                aria-current={
                  pathname === '/' && activeSection === href.slice(1)
                    ? 'location'
                    : undefined
                }
                onMouseEnter={closeServicesMenuImmediate}
                onClick={() => {
                  setMenuOpen(false)
                  closeServicesMenuImmediate()
                }}
              >
                {label}
              </a>
            )
          })}
          <div className="nav-actions-group">
            <div className="desktop-nav-search-slot">
              <NavbarSearch
                variant="desktop"
                onSelectService={handleSelectService}
                onOpenCareers={() => {
                  closeServicesMenuImmediate()
                  onOpenCareers()
                }}
                onNavigate={closeServicesMenuImmediate}
              />
            </div>
            <ThemeToggle className="header-theme-toggle--desktop max-lg:!hidden" />
            <a
              className="button button--small button--primary nav-cta"
              href={pathname === '/' ? '#contact' : '/#contact'}
              onClick={() => {
                setMenuOpen(false)
                closeServicesMenuImmediate()
              }}
            >
              Get Started <Icon name="arrow" size={16} />
            </a>
          </div>

          {/* Mobile-only Settings Section */}
          {menuOpen && (
            <div className="mobile-nav-settings-section lg:!hidden mt-3.5 pt-3.5 border-t border-white/15">
              <div className="flex items-center gap-2 px-1 mb-2.5 text-xs font-bold uppercase tracking-wider text-white">
                <Settings size={14} className="text-white" aria-hidden="true" />
                <span>Settings</span>
              </div>

              <div className="rounded-xl border border-white/15 bg-[#0f3a69] p-3 shadow-xs backdrop-blur-xs">
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    {resolvedTheme === 'dark' ? (
                      <Moon size={13} className="text-sky-400" aria-hidden="true" />
                    ) : (
                      <Sun size={13} className="text-amber-500" aria-hidden="true" />
                    )}
                    Theme Appearance
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">
                      {theme === 'system' ? `System (${resolvedTheme})` : `${theme} mode`}
                    </span>
                  </div>
                </div>

                <ThemeToggle variant="segmented" className="w-full" />
              </div>
            </div>
          )}
        </nav>
      </div>

      <DesktopServicesMegaMenu
        isOpen={servicesMenuOpen}
        pathname={pathname}
        onSelectService={handleSelectService}
        onClose={closeServicesMenuImmediate}
        onMouseEnter={openServicesMenu}
        onMouseLeave={scheduleCloseServicesMenu}
      />
    </header>
  )
}

function HeroVisual({ mouseOffset }: { mouseOffset?: { x: number; y: number } }) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className="hero-visual"
      aria-label="Interactive 3D digital globe representing Godavari Wave Technologies global network"
    >
      <div className="hero-globe-ambient-glow" aria-hidden="true" />
      <div
        className="visual-orbit visual-orbit--one"
        style={
          mouseOffset && !reducedMotion
            ? {
              transform: `scaleX(1.13) rotate(-23deg) translate3d(${mouseOffset.x * 12}px, ${mouseOffset.y * 12}px, 0)`,
            }
            : undefined
        }
      />
      <div
        className="visual-orbit visual-orbit--two"
        style={
          mouseOffset && !reducedMotion
            ? {
              transform: `scaleX(1.14) rotate(34deg) translate3d(${-mouseOffset.x * 10}px, ${-mouseOffset.y * 10}px, 0)`,
            }
            : undefined
        }
      />

      <HeroScene />

      <div
        className="visual-chip visual-chip--top"
        style={
          mouseOffset && !reducedMotion
            ? {
              transform: `translate3d(${mouseOffset.x * 14}px, ${mouseOffset.y * 14}px, 0)`,
            }
            : undefined
        }
      >
        <span className="chip-dot" />
        Global Delivery Network
      </div>

      <div
        className="visual-chip visual-chip--bottom"
        style={
          mouseOffset && !reducedMotion
            ? {
              transform: `translate3d(${-mouseOffset.x * 12}px, ${-mouseOffset.y * 12}px, 0)`,
            }
            : undefined
        }
      >
        <span className="chip-icon"><Icon name="pin" size={15} /></span>
        Hyderabad Engineering Hub
      </div>
      <span className="visual-plus visual-plus--one">+</span>
      <span className="visual-plus visual-plus--two">+</span>
    </div>
  )
}

function Hero({ heroContent }: { heroContent?: PublicSiteContent['hero'] }) {
  const reducedMotion = useReducedMotion()
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setMouseOffset({ x, y })
  }

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 })
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
  }

  return (
    <section
      className="hero-section relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Upper-right soft ambient glow matching corporate palette with seamless blending */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 z-0 hidden h-[36rem] w-[46rem] max-w-[95vw] rounded-full bg-gradient-to-bl from-blue-200/35 via-sky-100/20 to-transparent blur-3xl md:block dark:from-blue-900/20 dark:via-sky-950/10 dark:to-transparent"
        aria-hidden="true"
      />
      <div
        className="hero-grid-pattern pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />
      <div
        className="hero-corner-glow pointer-events-none absolute -right-20 -top-20 z-0 hidden h-[32rem] w-[44rem] max-w-[90vw] rounded-full md:block"
        aria-hidden="true"
      />
      <div className="container hero-layout z-10">
        <motion.div
          className="hero-copy"
          variants={reducedMotion ? undefined : containerVariants}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
        >
          <motion.span
            className="hero-eyebrow"
            variants={reducedMotion ? undefined : itemVariants}
          >
            <span className="eyebrow-line" />{' '}
            {heroContent?.eyebrow || 'GODAVARI WAVE TECHNOLOGIES · HYDERABAD'}
          </motion.span>
          <motion.h1 variants={reducedMotion ? undefined : itemVariants}>
            Empowering Businesses to{' '}
            <span className="hero-highlight">Go Digital</span> &amp;{' '}
            <span>Grow Global.</span>
          </motion.h1>
          <motion.p variants={reducedMotion ? undefined : itemVariants}>
            {heroContent?.subtitle ||
              'Godavari Wave Technologies is Hyderabad’s trusted digital engineering partner, delivering scalable web platforms, custom enterprise software, cloud infrastructure, and modern mobile applications that drive sustainable growth.'}
          </motion.p>
          <motion.div
            className="hero-actions"
            variants={reducedMotion ? undefined : itemVariants}
          >
            <a className="button button--primary" href="#services">
              Explore Services <Icon name="arrow" size={18} />
            </a>
            <a className="button button--outline" href="#contact">
              Contact Us <Icon name="phone" size={16} />
            </a>
          </motion.div>
          <motion.div
            className="hero-proof"
            variants={reducedMotion ? undefined : itemVariants}
          >
            <div className="proof-item !gap-1.5 whitespace-nowrap rounded-xl border border-[#164E8A]/20 bg-[#F7FAFD]/95 px-2.5 py-[3px] shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#2563EB]/45 hover:bg-white hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <span className="grid h-4 w-4 shrink-0 place-items-center text-[#14B8A6]">
                <Icon name="pin" size={16} />
              </span>
              <span>
                <strong className="!text-[#0B1F3A] text-[10px] font-semibold leading-[1.15] tracking-tight">
                  Hyderabad
                </strong>
                <small className="!text-[#164E8A] text-[9px] font-medium leading-[1.15]">
                  India branch
                </small>
              </span>
            </div>
            <span className="proof-divider" />
            <div className="proof-item">
              <span className="proof-icon"><Icon name="layers" size={17} /></span>
              <span><strong>End-to-end</strong><small>Digital delivery</small></span>
            </div>
            <span className="proof-divider" />
            <div className="proof-item">
              <span className="proof-icon"><Icon name="globe" size={17} /></span>
              <span><strong>Global reach</strong><small>Scalable systems</small></span>
            </div>
          </motion.div>
        </motion.div>
        <HeroVisual mouseOffset={mouseOffset} />
      </div>
      <a className="hero-scroll" href="#about"><span /> Scroll to explore</a>
    </section>
  )
}

function About() {
  return (
    <section className="section about-section" id="about">
      <div className="container about-layout">
        <Reveal className="about-visual">
          <div className="about-visual-card">
            <span className="about-visual-eyebrow">HOW WE THINK</span>
            <h3>Good technology starts with understanding.</h3>
            <p>People first. Clear thinking. Purposeful engineering.</p>
            <div className="about-diagram" aria-hidden="true">
              <div className="diagram-center"><Icon name="spark" size={28} /></div>
              <span className="diagram-node diagram-node--one"><Icon name="target" size={19} /></span>
              <span className="diagram-node diagram-node--two"><Icon name="design" size={19} /></span>
              <span className="diagram-node diagram-node--three"><Icon name="code" size={19} /></span>
              <span className="diagram-node diagram-node--four"><Icon name="rocket" size={19} /></span>
              <i className="diagram-ring diagram-ring--one" />
              <i className="diagram-ring diagram-ring--two" />
            </div>
            <span className="about-visual-foot"><span /> A collaborative engineering approach</span>
          </div>
          <div className="about-side-note">
            <span className="note-icon"><Icon name="globe" size={20} /></span>
            <span><strong>Local perspective</strong><small>Hyderabad, Telangana, India</small></span>
          </div>
        </Reveal>
        <div className="about-copy">
          <SectionHeading
            eyebrow="ABOUT GODAVARI WAVE"
            title="Engineering solutions built around real business needs."
            align="left"
          />
          <p className="about-lead">
            Godavari Wave Technologies takes a practical, transparent approach
            to software engineering. Our Hyderabad branch works closely with
            businesses and startups to understand operational challenges first,
            then build reliable technology around the people who use it.
          </p>
          <p>
            From discovery and UI/UX design to full-stack development and
            ongoing maintenance, we prioritize clear communication, dependable
            execution, and long-term value.
          </p>
          <StaggeredGrid className="mission-vision">
            <RevealItem className="mv-item">
              <span className="mv-icon"><Icon name="target" size={18} /></span>
              <div><h3>Our mission</h3><p>Deliver practical, high-quality software with clarity, care, and real business utility.</p></div>
            </RevealItem>
            <RevealItem className="mv-item">
              <span className="mv-icon"><Icon name="globe" size={18} /></span>
              <div><h3>Our vision</h3><p>Help businesses grow sustainably through thoughtful, dependable digital systems.</p></div>
            </RevealItem>
          </StaggeredGrid>
          <a className="text-link" href="#contact">Let’s talk about your goals <Icon name="arrow" size={17} /></a>
        </div>
      </div>
    </section>
  )
}

function TechnologyStrip() {
  return <ServicesMarquee />
}

function useIsMobileViewport(maxWidth = 767) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${maxWidth}px)`).matches
      : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [maxWidth])

  return isMobile
}

function Services({
  isMobile,
  servicesOverrides,
}: {
  isMobile: boolean
  servicesOverrides?: PublicSiteContent['servicesOverrides']
}) {
  const reducedMotion = useReducedMotion()
  const [servicesSwiper, setServicesSwiper] = useState<SwiperInstance | null>(null)
  const resolvedServices = servicesOverrides?.length
    ? services.map((item) => {
        const match = servicesOverrides.find((ov) => ov.id === item.id)
        return match
          ? {
              ...item,
              title: match.title || item.title,
              description: match.description || item.description,
            }
          : item
      })
    : services

  useEffect(() => {
    let highlightTimer: number | undefined

    const handleSelectService = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const serviceId = customEvent.detail
      if (!serviceId) return

      const targetIndex = services.findIndex((item) => item.id === serviceId)
      if (targetIndex === -1) {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
        return
      }

      if (isMobile) {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
        window.setTimeout(() => {
          servicesSwiper?.slideTo(targetIndex, reducedMotion ? 0 : 400)
        }, 120)
        return
      }

      const cardEl = document.getElementById(`service-${serviceId}`)
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cardEl.classList.add('service-card--highlighted')
        if (highlightTimer) window.clearTimeout(highlightTimer)
        highlightTimer = window.setTimeout(() => {
          cardEl.classList.remove('service-card--highlighted')
        }, 1600)
      } else {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    window.addEventListener('godavari:select-service', handleSelectService)
    return () => {
      window.removeEventListener('godavari:select-service', handleSelectService)
      if (highlightTimer) window.clearTimeout(highlightTimer)
    }
  }, [isMobile, reducedMotion, servicesSwiper])

  const gridVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  }

  return (
    <section className="section services-section" id="services">
      <div className="container">
        <SectionHeading
          eyebrow="WHAT WE DO"
          title="Digital engineering for what’s next."
          description="From a first idea to the next stage of growth, bring the right capabilities together around your goals."
        />
        {isMobile ? (
          <Reveal className="services-mobile-carousel">
            <Swiper
              modules={[A11y, Pagination]}
              onSwiper={setServicesSwiper}
              slidesPerView={1.14}
              spaceBetween={12}
              pagination={{ clickable: true, dynamicBullets: true }}
              watchOverflow
              a11y={{
                prevSlideMessage: 'Previous service',
                nextSlideMessage: 'Next service',
                paginationBulletMessage: 'Go to service {{index}}',
              }}
              breakpoints={{
                440: { slidesPerView: 1.45, spaceBetween: 14 },
                580: { slidesPerView: 2.05, spaceBetween: 14 },
              }}
            >
              {resolvedServices.map((service, index) => (
                <SwiperSlide key={service.id}>
                  <ServiceCard
                    service={service}
                    index={index}
                    disableReveal
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="carousel-controls services-carousel-controls">
              <button
                type="button"
                aria-label="Previous service"
                onClick={() => servicesSwiper?.slidePrev()}
              >
                <Icon name="arrow" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next service"
                onClick={() => servicesSwiper?.slideNext()}
              >
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </Reveal>
        ) : (
          <motion.div
            className="services-grid"
            variants={reducedMotion ? undefined : gridVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.12 }}
          >
            {resolvedServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

function WhyUs() {
  return (
    <section className="section why-section">
      <div className="container">
        <div className="why-heading">
          <SectionHeading
            eyebrow="WHY GODAVARI WAVE · HYDERABAD"
            title="A thoughtful partner, from first conversation to delivery."
            description="Good partnerships are built on shared context, clear communication, and dependable follow-through."
            align="left"
          />
          <a className="button button--outline why-cta" href="#contact">
            Meet your next partner <Icon name="arrow" size={17} />
          </a>
        </div>
        <StaggeredGrid className="advantages-grid">
          {advantages.map((item, index) => (
            <RevealItem className="advantage-card" key={item.title}>
              <span className="advantage-number">0{index + 1}</span>
              <span className="advantage-icon"><Icon name={item.icon} size={23} /></span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </RevealItem>
          ))}
        </StaggeredGrid>
      </div>
    </section>
  )
}

function SolutionCard({
  solution,
  index,
  disableReveal = false,
}: {
  solution: SolutionCapability
  index: number
  disableReveal?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <motion.article
      className="project-card solution-card"
      initial={reducedMotion || disableReveal ? false : { opacity: 0, y: 16 }}
      whileInView={reducedMotion || disableReveal ? undefined : { opacity: 1, y: 0 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      viewport={{ once: true, amount: 0.06 }}
      transition={{
        duration: reducedMotion ? 0 : 0.38,
        delay: reducedMotion || disableReveal ? 0 : (index % 3) * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="solution-media">
        {imageFailed ? (
          <div className="service-image-fallback" aria-hidden="true">
            <Icon name={solution.icon} size={34} />
          </div>
        ) : (
          <img
            src={solution.imageUrl}
            alt={solution.imageAlt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="solution-badge">Solution Capability</span>
      </div>
      <div className="project-info solution-info">
        <span className="project-category">{solution.category}</span>
        <h3>{solution.title}</h3>
        <p className="solution-problem">
          <strong>Problem addressed:</strong> {solution.problem}
        </p>
        <p className="solution-desc">{solution.description}</p>
        <div className="project-tags" aria-label="Key features and capabilities">
          {solution.features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <a className="text-link" href="#contact">
          Discuss a Similar Project <Icon name="arrow" size={16} />
        </a>
      </div>
    </motion.article>
  )
}

function Projects({ isMobile }: { isMobile: boolean }) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)

  return (
    <section className="section projects-section" id="projects">
      <div className="container">
        <SectionHeading
          eyebrow="SOFTWARE SOLUTIONS & CAPABILITIES"
          title="Practical software architectures for modern businesses."
          description="The categories below illustrate the types of systems our engineering team designs and builds—not published client case studies."
        />
        {isMobile ? (
          <Reveal className="projects-carousel">
            <Swiper
              modules={[A11y, Pagination]}
              onSwiper={setSwiper}
              slidesPerView={1.08}
              spaceBetween={12}
              pagination={{ clickable: true, dynamicBullets: true }}
              watchOverflow
              a11y={{
                prevSlideMessage: 'Previous solution capability',
                nextSlideMessage: 'Next solution capability',
                paginationBulletMessage: 'Go to solution {{index}}',
              }}
              breakpoints={{
                480: { slidesPerView: 1.45, spaceBetween: 14 },
                620: { slidesPerView: 2, spaceBetween: 14 },
              }}
            >
              {solutions.map((solution, index) => (
                <SwiperSlide key={solution.id}>
                  <SolutionCard
                    solution={solution}
                    index={index}
                    disableReveal
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="carousel-controls">
              <button
                type="button"
                aria-label="Previous solution capability"
                onClick={() => swiper?.slidePrev()}
              >
                <Icon name="arrow" size={18} />
              </button>
              <button
                type="button"
                aria-label="Next solution capability"
                onClick={() => swiper?.slideNext()}
              >
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="projects-grid solutions-grid">
            {solutions.map((solution, index) => (
              <SolutionCard
                key={solution.id}
                solution={solution}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Lifecycle() {
  return (
    <section className="section lifecycle-section">
      <div className="container">
        <SectionHeading
          eyebrow="HOW WE DELIVER"
          title="A structured six-step development process."
          description="Each phase defines clear engineering activities, milestones, and reviews so clients always know what happens next."
        />
        <StaggeredGrid className="lifecycle-grid">
          {lifecycle.map((step) => (
            <RevealItem className="lifecycle-card" key={step.number}>
              <div className="lifecycle-card-top">
                <span className="lifecycle-icon"><Icon name={step.icon} size={21} /></span>
                <span className="lifecycle-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="lifecycle-activities" aria-label="Key stage activities">
                {step.activities.map((activity) => (
                  <span key={activity}>{activity}</span>
                ))}
              </div>
            </RevealItem>
          ))}
        </StaggeredGrid>
      </div>
    </section>
  )
}

function Leadership({ onOpenCareers }: { onOpenCareers: () => void }) {
  return (
    <section className="section leadership-section" id="team">
      <div className="container">
        <SectionHeading
          eyebrow="TEAM & COLLABORATION"
          title="Cross-functional delivery across engineering, design, and QA."
          description="At our Hyderabad branch, dedicated engineering, UI/UX design, and delivery specialists work together closely on every release."
        />
        <StaggeredGrid className="team-pillars-grid">
          {teamDisciplines.map((pillar) => (
            <RevealItem className="team-pillar-card" key={pillar.title}>
              <div className="team-pillar-top">
                <span className="team-pillar-icon">
                  <Icon name={pillar.icon} size={22} />
                </span>
                <span className="team-pillar-dept">{pillar.department}</span>
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <ul className="team-focus-list">
                {pillar.focusAreas.map((area) => (
                  <li key={area}>
                    <Icon name="check" size={14} />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </StaggeredGrid>
        <div className="team-collab-cta">
          <p>
            Looking to collaborate with our Hyderabad team or join our growing engineering practice?
          </p>
          <div className="team-collab-actions">
            <a className="button button--primary button--small" href="#contact">
              Start a Conversation <Icon name="arrow" size={15} />
            </a>
            <button
              type="button"
              className="button button--outline button--small"
              onClick={onOpenCareers}
            >
              Explore Open Roles
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

const ENQUIRY_POPUP_SESSION_KEY = 'gwt_enquiry_popup_dismissed'

function markEnquiryPopupDismissed() {
  try {
    window.sessionStorage.setItem(ENQUIRY_POPUP_SESSION_KEY, '1')
  } catch {
    // Ignore storage access errors in restricted browsing contexts.
  }
}

function isEnquiryPopupDismissed() {
  try {
    return window.sessionStorage.getItem(ENQUIRY_POPUP_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function Contact({ onSubmitted }: { onSubmitted?: () => void }) {
  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <SectionHeading
          eyebrow="START A CONVERSATION"
          title="Let’s build something meaningful."
          description="Tell us what you’re working on. The Hyderabad team will be glad to hear from you."
        />
        <Reveal className="contact-layout">
          <ContactEnquiryContent onSubmitted={onSubmitted} />
        </Reveal>
      </div>
    </section>
  )
}

function HomePage({ onOpenCareers }: { onOpenCareers: () => void }) {
  const { pathname } = useLocation()
  const isMobile = useIsMobileViewport(767)
  const [siteContent, setSiteContent] = useState<PublicSiteContent | null>(null)
  const [enquiryPopupOpen, setEnquiryPopupOpen] = useState(false)

  useEffect(() => {
    let active = true
    void getPublicSiteContent().then((content) => {
      if (active && content) setSiteContent(content)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/' || isEnquiryPopupDismissed()) {
      return
    }

    const timer = window.setTimeout(() => {
      if (!isEnquiryPopupDismissed()) {
        setEnquiryPopupOpen(true)
      }
    }, 2000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname])

  const handleCloseEnquiryPopup = useCallback(() => {
    markEnquiryPopupDismissed()
    setEnquiryPopupOpen(false)
  }, [])

  const handleEnquirySubmitted = useCallback(() => {
    markEnquiryPopupDismissed()
  }, [])

  return (
    <>
      <main id="main-content">
        <div className="hero-switcher" id="home">
          <div className="hero-switcher-desktop">
            <Hero heroContent={siteContent?.hero} />
          </div>
          <div className="hero-switcher-mobile">
            <MobileHeroCarousel
              heroContent={siteContent?.hero}
              isActive={isMobile}
            />
          </div>
        </div>
        <About />
        <TechnologyStrip />
        <Services
          isMobile={isMobile}
          servicesOverrides={siteContent?.servicesOverrides}
        />
        <WhyUs />
        <Projects isMobile={isMobile} />
        <Lifecycle />
        <Leadership onOpenCareers={onOpenCareers} />
        <Branches branchOverrides={siteContent?.branches} />
        <Contact onSubmitted={handleEnquirySubmitted} />
      </main>
      <EnquiryPopupModal
        isOpen={enquiryPopupOpen}
        onClose={handleCloseEnquiryPopup}
        onSubmitted={handleEnquirySubmitted}
      />
      <Suspense fallback={null}>
        <ChatAssistant />
      </Suspense>
    </>
  )
}

function AppRoutes() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = pathname === '/leads' || pathname.startsWith('/leads/')

  const handleOpenCareers = useCallback(() => {
    navigate('/careers')
  }, [navigate])

  useEffect(() => {
    if (isAdminRoute) return
    window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView()
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    })
  }, [hash, isAdminRoute, pathname])

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#07162c] text-sm font-semibold text-white">
            Loading Admin Console...
          </div>
        }
      >
        <Routes>
          <Route path="/leads" element={<AdminLeadsPage />} />
          <Route path="/leads/*" element={<AdminLeadsPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header onOpenCareers={handleOpenCareers} />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage onOpenCareers={handleOpenCareers} />
          }
        />
        <Route path="/careers" element={<Careers />} />
        <Route
          path="*"
          element={
            <main id="main-content" className="container min-h-[50vh] py-20">
              <h1 className="text-3xl font-bold">Page not found</h1>
              <Link className="mt-6 inline-flex text-blue-600 hover:text-blue-700" to="/">
                Back to Home
              </Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
