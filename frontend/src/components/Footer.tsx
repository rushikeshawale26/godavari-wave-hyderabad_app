import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUp, ExternalLink, Mail, MapPin, Phone, Users } from 'lucide-react'
import BrandLogo from './BrandLogo'
import PolicyModal, { type PolicyTab } from './PolicyModal'
import facebookIcon from '../assets/brand/facebook.png'
import instagramIcon from '../assets/brand/instagram.png'
import linkedinIcon from '../assets/brand/linkedin.png'
import whatsappIcon from '../assets/brand/social.png'
import {
  getWebsiteVisitorCount,
  recordWebsiteVisitor,
  type WebsiteVisitorCount,
} from '../services/api'

const QUICK_LINKS = [
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact Us', href: '#contact' },
] as const

interface SocialLinkItem {
  name: string
  icon: string
  href: string
  ariaLabel: string
  tooltip: string
}

const SOCIAL_LINKS: readonly SocialLinkItem[] = [
  {
    name: 'Facebook',
    icon: facebookIcon,
    href: 'https://www.facebook.com/people/Godavari-Wave-Hyd/61595608555722/',
    ariaLabel: 'Follow Godavari Wave Technologies on Facebook',
    tooltip: 'Facebook',
  },
  {
    name: 'Instagram',
    icon: instagramIcon,
    href: 'https://www.instagram.com/godavariwave_hyd/?hl=en',
    ariaLabel: 'Follow Godavari Wave Technologies on Instagram',
    tooltip: 'Instagram',
  },
  {
    name: 'LinkedIn',
    icon: linkedinIcon,
    href: 'https://www.linkedin.com/company/godavari-wave-technologies-pvt-ltd/',
    ariaLabel: 'Connect with Godavari Wave Technologies on LinkedIn',
    tooltip: 'LinkedIn',
  },
  {
    name: 'WhatsApp',
    icon: whatsappIcon,
    href: 'https://wa.me/917799822121',
    ariaLabel: 'Chat with Godavari Wave Technologies on WhatsApp (+91 7799822121)',
    tooltip: 'WhatsApp (+91 7799822121)',
  },
] as const

const VISITOR_ID_STORAGE_KEY = 'godavari-wave-visitor-id'
const VISITOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getOrCreateVisitorId = (): string | null => {
  try {
    const storedId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)
    if (storedId && VISITOR_ID_PATTERN.test(storedId)) return storedId
    if (!window.crypto.randomUUID) return null

    const visitorId = window.crypto.randomUUID()
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId)
    return visitorId
  } catch {
    return null
  }
}

export default function Footer() {
  const { pathname } = useLocation()
  const [policyOpen, setPolicyOpen] = useState(false)
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTab>('privacy')
  const [visitorCount, setVisitorCount] = useState<WebsiteVisitorCount | null>(null)

  useEffect(() => {
    let active = true
    const refreshCount = async () => {
      try {
        const visitorId = getOrCreateVisitorId()
        const count = visitorId
          ? await recordWebsiteVisitor(visitorId).catch(() =>
              getWebsiteVisitorCount(),
            )
          : await getWebsiteVisitorCount()
        if (active) {
          setVisitorCount(count)
        }
      } catch {
        if (active) setVisitorCount(null)
      }
    }

    void refreshCount()
    const intervalId = window.setInterval(() => {
      void getWebsiteVisitorCount()
        .then((count) => {
          if (active) {
            setVisitorCount(count)
          }
        })
        .catch(() => {
          if (active) setVisitorCount(null)
        })
    }, 60_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const handleOpenPolicy = useCallback((tab: PolicyTab) => {
    setActivePolicyTab(tab)
    setPolicyOpen(true)
  }, [])

  const handleClosePolicy = useCallback(() => {
    setPolicyOpen(false)
  }, [])

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <>
      <footer className="site-footer" id="footer">
        <div className="footer-waves" aria-hidden="true">
          <svg
            className="footer-wave-layer footer-wave-layer--back"
            viewBox="0 0 2400 72"
            preserveAspectRatio="none"
          >
            <path d="M0 36 Q 300 10 600 36 T 1200 36 Q 1500 10 1800 36 T 2400 36 L 2400 72 L 0 72 Z" />
          </svg>
          <svg
            className="footer-wave-layer footer-wave-layer--mid"
            viewBox="0 0 2400 72"
            preserveAspectRatio="none"
          >
            <path d="M0 40 Q 300 16 600 40 T 1200 40 Q 1500 16 1800 40 T 2400 40 L 2400 72 L 0 72 Z" />
          </svg>
          <svg
            className="footer-wave-layer footer-wave-layer--front"
            viewBox="0 0 2400 72"
            preserveAspectRatio="none"
          >
            <path
              className="footer-wave-fill"
              d="M0 46 Q 300 22 600 46 T 1200 46 Q 1500 22 1800 46 T 2400 46 L 2400 72 L 0 72 Z"
            />
            <path
              className="footer-wave-crest"
              d="M0 46 Q 300 22 600 46 T 1200 46 Q 1500 22 1800 46 T 2400 46"
            />
          </svg>
        </div>

        <div className="footer-ocean-body">
          <div className="footer-water-backdrop" aria-hidden="true" />
          <div className="container footer-inner">
            <div className="footer-columns-grid">
              <div className="footer-col footer-col--brand">
                <Link
                  className="footer-brand-logo-link"
                  to="/"
                  aria-label="Godavari Wave Technologies home"
                >
                  <BrandLogo />
                </Link>
                <h2 className="footer-company-name">
                  Godavari Wave Technologies Pvt. Ltd.
                </h2>
                <p className="footer-company-desc">
                  Thoughtful digital engineering and software solutions for
                  businesses ready to grow.
                </p>
                <div
                  className="footer-socials"
                  role="group"
                  aria-label="Official Social Media Profiles"
                >
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      className="footer-social-link"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.ariaLabel}
                      title={social.tooltip}
                    >
                      <img
                        src={social.icon}
                        alt={social.name}
                        className="footer-social-icon"
                        width={24}
                        height={24}
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  ))}
                </div>
              </div>

              <nav className="footer-col footer-col--links" aria-label="Footer">
                <h2 className="footer-col-title">Quick Links</h2>
                <ul className="footer-nav-list">
                  {QUICK_LINKS.map((item) => (
                    <li key={item.label}>
                      {item.href === '/careers' ? (
                        <Link
                          to={item.href}
                          className="footer-nav-item"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <Link
                          to={
                            item.href.startsWith('#') && pathname !== '/'
                              ? `/${item.href}`
                              : item.href
                          }
                          className="footer-nav-item"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="footer-col footer-col--contact">
                <h2 className="footer-col-title">Contact</h2>
                <div className="footer-contact-items">
                  <div className="footer-contact-line">
                    <span className="footer-contact-icon">
                      <MapPin size={15} aria-hidden="true" />
                    </span>
                    <span className="footer-contact-text">
                      <strong>Hyderabad Branch</strong>
                      Meenakshi Tech Park, Phase 2, Gachibowli, Hyderabad,
                      Telangana 500032
                    </span>
                  </div>
                  <a
                    className="footer-contact-line"
                    href="mailto:info@godavariwave.com"
                  >
                    <span className="footer-contact-icon">
                      <Mail size={15} aria-hidden="true" />
                    </span>
                    <span className="footer-contact-text">
                      <strong>General Enquiries</strong>
                      info@godavariwave.com
                    </span>
                  </a>
                  <a
                    className="footer-contact-line"
                    href="mailto:hrgodavariwavetech@gmail.com"
                  >
                    <span className="footer-contact-icon">
                      <Mail size={15} aria-hidden="true" />
                    </span>
                    <span className="footer-contact-text">
                      <strong>HR</strong>
                      hrgodavariwavetech@gmail.com
                    </span>
                  </a>
                  <a
                    className="footer-contact-line"
                    href="tel:+917799822121"
                  >
                    <span className="footer-contact-icon">
                      <Phone size={15} aria-hidden="true" />
                    </span>
                    <span className="footer-contact-text">
                      <strong>Hyderabad Branch Phone</strong>
                      7799822121
                    </span>
                  </a>
                  <a
                    className="footer-map-link"
                    href="https://www.google.com/maps/search/?api=1&query=Meenakshi%20Tech%20Park%2C%20Phase%202%2C%20Gachibowli%2C%20Hyderabad%2C%20Telangana%20500032"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Maps <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            {visitorCount && (
              <div className="footer-visitor-count" aria-live="polite">
                <Users size={15} aria-hidden="true" />
                <span>
                  Unique visitors (last {visitorCount.periodDays} days):
                </span>
                <strong>{visitorCount.count.toLocaleString()}</strong>
              </div>
            )}

            <div className="footer-water-divider" aria-hidden="true" />

            <div className="footer-bottom-bar">
              <p className="footer-bottom-copyright">
                &copy; {new Date().getFullYear()} Godavari Wave Technologies Pvt.
                Ltd. All rights reserved.
              </p>
              <div className="footer-bottom-policies">
                <button
                  type="button"
                  className="footer-policy-link"
                  onClick={() => handleOpenPolicy('privacy')}
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  className="footer-policy-link"
                  onClick={() => handleOpenPolicy('terms')}
                >
                  Terms &amp; Conditions
                </button>
              </div>
              <button
                type="button"
                className="footer-back-to-top-btn"
                onClick={handleScrollToTop}
                aria-label="Back to top of the page"
              >
                Back to top <ArrowUp size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      <PolicyModal
        isOpen={policyOpen}
        activeTab={activePolicyTab}
        onClose={handleClosePolicy}
        onTabChange={setActivePolicyTab}
      />
    </>
  )
}
