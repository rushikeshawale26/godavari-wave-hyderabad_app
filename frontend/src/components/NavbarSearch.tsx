import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'

export interface NavbarSearchProps {
  variant?: 'desktop' | 'mobile'
  onSelectService: (serviceId: string) => void
  onOpenCareers: () => void
  onNavigate?: () => void
}

type SearchCategory =
  | 'Section'
  | 'Service'
  | 'Solution'
  | 'Process'
  | 'Careers'
  | 'Contact'

interface SearchItem {
  id: string
  title: string
  category: SearchCategory
  subtitle: string
  href: string
  serviceId?: string
  action?: 'careers'
  keywords: string[]
}

const SEARCH_INDEX: SearchItem[] = [
  {
    id: 'sec-home',
    title: 'Home',
    category: 'Section',
    subtitle: 'Godavari Wave Technologies overview and capabilities',
    href: '#home',
    keywords: ['home', 'hero', 'overview', 'godavari wave', 'software company'],
  },
  {
    id: 'sec-about',
    title: 'About Us',
    category: 'Section',
    subtitle: 'Engineering clarity, digital systems, and long-term partnership',
    href: '#about',
    keywords: ['about', 'company', 'mission', 'hyderabad', 'engineering'],
  },
  {
    id: 'sec-services',
    title: 'All Services',
    category: 'Section',
    subtitle: 'Full spectrum of software, design, cloud, and marketing services',
    href: '#services',
    keywords: ['services', 'capabilities', 'offerings', 'solutions'],
  },
  {
    id: 'sec-technology',
    title: 'Tech Stack & Capabilities',
    category: 'Section',
    subtitle: 'Web, mobile, cloud hosting, security, DevOps, and AI/ML',
    href: '#technology',
    keywords: ['tech stack', 'technology', 'capabilities', 'engineering', 'marquee'],
  },
  {
    id: 'sec-projects',
    title: 'Projects & Software Solutions',
    category: 'Section',
    subtitle: 'Illustrative architectures for modern business platforms',
    href: '#projects',
    keywords: ['projects', 'portfolio', 'solutions', 'architectures', 'platforms'],
  },
  {
    id: 'sec-team',
    title: 'Team & Collaboration',
    category: 'Section',
    subtitle: 'Engineering, UI/UX design, and QA specialists in Hyderabad',
    href: '#team',
    keywords: ['team', 'collaboration', 'leadership', 'qa', 'delivery', 'design'],
  },
  {
    id: 'sec-careers',
    title: 'Careers & Job Openings',
    category: 'Careers',
    subtitle: 'Explore active openings and apply to join our engineering team',
    href: '/careers',
    action: 'careers',
    keywords: ['careers', 'jobs', 'openings', 'hiring', 'internship', 'apply', 'vacancy'],
  },
  {
    id: 'sec-contact',
    title: 'Contact Us',
    category: 'Contact',
    subtitle: 'Hyderabad office address, emails, phone, and enquiry form',
    href: '#contact',
    keywords: [
      'contact',
      'enquiry',
      'email',
      'phone',
      'address',
      'hyderabad',
      'gachibowli',
      'meenakshi tech park',
      'maps',
      '7799822121',
    ],
  },
  {
    id: 'srv-web',
    title: 'Web Design & Development',
    category: 'Service',
    subtitle: 'Responsive websites, business portals, and custom web applications',
    href: '#service-web-development',
    serviceId: 'web-development',
    keywords: ['web', 'website', 'frontend', 'backend', 'portal', 'react', 'responsive'],
  },
  {
    id: 'srv-mobile',
    title: 'Mobile App Development',
    category: 'Service',
    subtitle: 'Android and cross-platform mobile applications designed for usability',
    href: '#service-mobile-app',
    serviceId: 'mobile-app',
    keywords: ['mobile', 'android', 'ios', 'app', 'cross-platform', 'smartphone'],
  },
  {
    id: 'srv-uiux',
    title: 'UI/UX & Graphic Design',
    category: 'Service',
    subtitle: 'User-focused interface design, wireframes, prototypes, and brand visuals',
    href: '#service-ui-ux-design',
    serviceId: 'ui-ux-design',
    keywords: ['ui', 'ux', 'design', 'wireframe', 'prototype', 'graphic', 'interface'],
  },
  {
    id: 'srv-software',
    title: 'Custom Software',
    category: 'Service',
    subtitle: 'Software solutions tailored to businesses and startups',
    href: '#service-custom-software',
    serviceId: 'custom-software',
    keywords: ['custom software', 'tailored', 'saas', 'enterprise', 'automation'],
  },
  {
    id: 'srv-ecommerce',
    title: 'E-commerce Solutions',
    category: 'Service',
    subtitle: 'Online stores and storefronts with payment gateway integrations',
    href: '#service-ecommerce',
    serviceId: 'ecommerce',
    keywords: ['ecommerce', 'e-commerce', 'store', 'shop', 'checkout', 'payment', 'cart'],
  },
  {
    id: 'srv-nfc',
    title: 'NFC Digital Cards',
    category: 'Service',
    subtitle: 'Smart contactless digital business cards for instant contact sharing',
    href: '#service-nfc-digital-cards',
    serviceId: 'nfc-digital-cards',
    keywords: ['nfc', 'digital card', 'contactless', 'business card', 'tap'],
  },
  {
    id: 'srv-marketing',
    title: 'Digital Marketing',
    category: 'Service',
    subtitle: 'SEO and social media campaigns built to grow brand visibility',
    href: '#service-digital-marketing',
    serviceId: 'digital-marketing',
    keywords: ['marketing', 'seo', 'social media', 'growth', 'campaigns', 'search'],
  },
  {
    id: 'srv-cloud',
    title: 'Cloud Hosting & IT Support',
    category: 'Service',
    subtitle: 'Reliable cloud hosting setup, infrastructure, and IT support',
    href: '#service-cloud-hosting',
    serviceId: 'cloud-hosting',
    keywords: ['cloud', 'hosting', 'server', 'infrastructure', 'it support', 'deployment'],
  },
  {
    id: 'srv-maintenance',
    title: 'Maintenance & Support',
    category: 'Service',
    subtitle: 'Proactive updates, bug resolution, and ongoing application care',
    href: '#service-maintenance-support',
    serviceId: 'maintenance-support',
    keywords: ['maintenance', 'support', 'troubleshooting', 'updates', 'care'],
  },
  {
    id: 'srv-crm',
    title: 'CRM & ERP Solutions',
    category: 'Service',
    subtitle: 'Custom CRM and ERP platforms to streamline sales and workflows',
    href: '#service-crm-development',
    serviceId: 'crm-development',
    keywords: ['crm', 'erp', 'sales pipeline', 'operations', 'workflow'],
  },
  {
    id: 'srv-consulting',
    title: 'Technical Consulting',
    category: 'Service',
    subtitle: 'Practical technology planning, architecture, and delivery guidance',
    href: '#service-technical-consulting',
    serviceId: 'technical-consulting',
    keywords: ['consulting', 'advisory', 'architecture', 'planning', 'strategy'],
  },
  {
    id: 'srv-security',
    title: 'Cyber Security',
    category: 'Service',
    subtitle: 'Security-focused reviews and protective controls for business apps',
    href: '#service-cyber-security',
    serviceId: 'cyber-security',
    keywords: ['security', 'cyber', 'cybersecurity', 'audit', 'protection', 'risk'],
  },
  {
    id: 'srv-devops',
    title: 'DevOps & Automation',
    category: 'Service',
    subtitle: 'Automated build, testing, and deployment workflows',
    href: '#service-devops-automation',
    serviceId: 'devops-automation',
    keywords: ['devops', 'automation', 'ci/cd', 'pipeline', 'release'],
  },
  {
    id: 'srv-aiml',
    title: 'AI, ML & Web3',
    category: 'Service',
    subtitle: 'Applied artificial intelligence, machine learning, and Web3 integrations',
    href: '#service-ai-ml-web3',
    serviceId: 'ai-ml-web3',
    keywords: ['ai', 'ml', 'artificial intelligence', 'machine learning', 'web3', 'chatbot'],
  },
  {
    id: 'sol-crm',
    title: 'Customer Relationship Management Platform',
    category: 'Solution',
    subtitle: 'Lead pipelines, contact timelines, and role-based team views',
    href: '#projects',
    keywords: ['crm system', 'leads', 'sales', 'rest api', 'customer management'],
  },
  {
    id: 'sol-erp',
    title: 'Unified Operations & Workflow Suite',
    category: 'Solution',
    subtitle: 'Business management dashboards, approvals, billing, and cloud records',
    href: '#projects',
    keywords: ['business management', 'workflow', 'approvals', 'audit trails', 'portal'],
  },
  {
    id: 'sol-ecommerce',
    title: 'Scalable Online Storefront & Checkout',
    category: 'Solution',
    subtitle: 'Product catalogs, cart, payment gateways, and order tracking',
    href: '#projects',
    keywords: ['storefront', 'catalog', 'inventory', 'online store', 'checkout'],
  },
  {
    id: 'sol-analytics',
    title: 'Executive Insights & Reporting Dashboard',
    category: 'Solution',
    subtitle: 'Interactive KPI charts, trend breakdowns, and CSV/PDF report exports',
    href: '#projects',
    keywords: ['analytics', 'dashboard', 'reporting', 'kpi', 'charts', 'metrics', 'data'],
  },
  {
    id: 'sol-portal',
    title: 'Tailored SaaS & Service Web Portal',
    category: 'Solution',
    subtitle: 'Custom client onboarding, modular APIs, and responsive UI',
    href: '#projects',
    keywords: ['saas', 'web portal', 'client onboarding', 'custom web application'],
  },
]

const CATEGORY_BADGE_CLASSES: Record<SearchCategory, string> = {
  Section: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30',
  Service: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30',
  Solution: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/30',
  Process: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-400/30',
  Careers: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
  Contact: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/30',
}

function rankSearchResults(rawQuery: string): SearchItem[] {
  const normalized = rawQuery.trim().toLowerCase()
  if (!normalized) return []

  const tokens = normalized.split(/\s+/).filter(Boolean)

  const scored: { item: SearchItem; score: number }[] = []

  for (const item of SEARCH_INDEX) {
    const titleLower = item.title.toLowerCase()
    const subtitleLower = item.subtitle.toLowerCase()
    const keywordsText = item.keywords.join(' ').toLowerCase()
    const categoryLower = item.category.toLowerCase()
    const haystack = `${titleLower} ${categoryLower} ${keywordsText} ${subtitleLower}`

    const allTokensMatch = tokens.every((token) => haystack.includes(token))
    if (!allTokensMatch) continue

    let score = 0
    if (titleLower.startsWith(normalized)) score += 100
    else if (titleLower.includes(normalized)) score += 60
    if (keywordsText.includes(normalized)) score += 35
    if (categoryLower.includes(normalized)) score += 20
    for (const token of tokens) {
      if (titleLower.includes(token)) score += 15
      if (keywordsText.includes(token)) score += 8
    }

    scored.push({ item, score })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((entry) => entry.item)
}

export default function NavbarSearch({
  variant = 'desktop',
  onSelectService,
  onOpenCareers,
  onNavigate,
}: NavbarSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const trimmedQuery = query.trim()
  const results = useMemo(() => rankSearchResults(query), [query])
  const safeActiveIndex = activeIndex < results.length ? activeIndex : 0

  useEffect(() => {
    if (!isOpen) return

    const handleOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      setIsOpen(false)
      setQuery('')
      onNavigate?.()

      if (item.action === 'careers') {
        onOpenCareers()
        return
      }

      if (item.serviceId) {
        onSelectService(item.serviceId)
        return
      }

      if (item.href.startsWith('#')) {
        if (pathname !== '/') {
          navigate(`/${item.href}`)
          return
        }
        document
          .getElementById(item.href.slice(1))
          ?.scrollIntoView({ behavior: 'smooth' })
        return
      }

      navigate(item.href)
    },
    [navigate, onNavigate, onOpenCareers, onSelectService, pathname],
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setIsOpen(false)
    setActiveIndex(0)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (event.key === 'ArrowDown') {
      if (!isOpen && trimmedQuery) setIsOpen(true)
      if (results.length > 0) {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % results.length)
      }
      return
    }

    if (event.key === 'ArrowUp') {
      if (results.length > 0) {
        event.preventDefault()
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
      }
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!trimmedQuery) return
      if (results.length > 0) {
        const chosen = results[safeActiveIndex] ?? results[0]
        handleSelectItem(chosen)
      } else {
        setIsOpen(true)
      }
    }
  }

  const showDropdown = isOpen && trimmedQuery.length > 0

  return (
    <div
      ref={containerRef}
      className={
        variant === 'mobile'
          ? 'navbar-search navbar-search--mobile relative w-full'
          : 'navbar-search navbar-search--desktop relative'
      }
    >
      <div
        className={`group flex items-center gap-2 rounded-xl border shadow-xs transition-all duration-200 ${
          variant === 'mobile'
            ? 'w-full border-sky-300/60 bg-white px-3.5 py-2 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-sky-400/30 dark:bg-slate-900/90'
            : 'w-[148px] lg:w-[166px] xl:w-[208px] border-sky-300/60 bg-white px-3 py-1.5 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-sky-400/30 dark:bg-slate-900/90'
        }`}
      >
        <Search
          size={15}
          className="shrink-0 text-sky-700/75 transition-colors group-focus-within:text-[#0284c7] dark:text-sky-300"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (trimmedQuery) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search services, projects..."
          aria-label="Search services, projects, and website sections"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && results[safeActiveIndex]
              ? `${listboxId}-opt-${results[safeActiveIndex].id}`
              : undefined
          }
          className="w-full min-w-0 bg-transparent text-[12.5px] font-medium text-[#0b1f3a] placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0b1f3a] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className={`navbar-search-dropdown z-50 overflow-hidden rounded-2xl border border-blue-200/80 bg-white/98 shadow-[0_20px_48px_-12px_rgba(11,31,58,0.28)] backdrop-blur-xl dark:border-[#8DD8FF]/25 dark:bg-[#0B1F3A]/98 dark:shadow-[0_24px_54px_-12px_rgba(0,0,0,0.72)] ${
            variant === 'mobile'
              ? 'mt-2 w-full'
              : 'absolute right-0 top-[calc(100%+12px)] w-[340px]'
          }`}
        >
          {results.length > 0 ? (
            <div className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto p-1.5 dark:divide-white/10">
              {results.map((item, idx) => {
                const isActive = idx === safeActiveIndex
                return (
                  <button
                    key={item.id}
                    id={`${listboxId}-opt-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectItem(item)}
                    className={`flex w-full items-start justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-[#164E8A]/45'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE_CLASSES[item.category]}`}
                        >
                          {item.category}
                        </span>
                        <span className="truncate text-[13px] font-semibold text-[#0B1F3A] dark:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-600 dark:text-slate-300">
                        {item.subtitle}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className={`mt-1 shrink-0 transition-transform ${
                        isActive
                          ? 'translate-x-0.5 text-blue-600 dark:text-[#8DD8FF]'
                          : 'text-slate-400 dark:text-slate-400'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-center">
              <p className="text-[13px] font-semibold text-[#0B1F3A] dark:text-white">
                No results found for &ldquo;{trimmedQuery}&rdquo;
              </p>
              <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-300">
                Try searching for web development, mobile apps, CRM, cloud, or careers.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectItem({
                      id: 'quick-services',
                      title: 'All Services',
                      category: 'Section',
                      subtitle: '',
                      href: '#services',
                      keywords: [],
                    })
                  }
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-[11.5px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-[#8DD8FF]/30 dark:bg-[#164E8A]/40 dark:text-[#8DD8FF] dark:hover:bg-[#164E8A]/65"
                >
                  Browse Services
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectItem({
                      id: 'quick-contact',
                      title: 'Contact Us',
                      category: 'Contact',
                      subtitle: '',
                      href: '#contact',
                      keywords: [],
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Contact Team
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
