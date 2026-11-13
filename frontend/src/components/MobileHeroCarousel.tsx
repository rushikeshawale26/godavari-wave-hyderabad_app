import { memo, useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Autoplay, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import { useReducedMotion } from 'motion/react'
import { ArrowRight, Globe2, Layers3, MapPin, Phone } from 'lucide-react'
import type { PublicSiteContent } from '../services/api'
import 'swiper/css'
import 'swiper/css/pagination'

interface HeroSlide {
  id: string
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  secondaryLabel?: string
  secondaryHref?: string
  imageUrl: string
  imageAlt: string
}

const MOBILE_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'company-intro',
    eyebrow: 'GODAVARI WAVE · HYDERABAD',
    title: 'Empowering Businesses to Go Digital & Grow Global.',
    description:
      'Hyderabad’s trusted digital engineering partner delivering scalable web platforms, enterprise software, and cloud solutions.',
    ctaLabel: 'Explore Services',
    ctaHref: '#services',
    secondaryLabel: 'Contact Us',
    secondaryHref: '#contact',
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Global digital network visualization representing worldwide engineering reach',
  },
  {
    id: 'digital-solutions',
    eyebrow: 'DIGITAL SOLUTIONS',
    title: 'Custom Software Built Around Your Business.',
    description:
      'Tailored CRM & ERP systems, responsive portals, and modern e-commerce platforms engineered for sustainable growth.',
    ctaLabel: 'View Projects',
    ctaHref: '#projects',
    secondaryLabel: 'Enquire Now',
    secondaryHref: '#contact',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Software engineering workspace with web application code',
  },
  {
    id: 'technology-services',
    eyebrow: 'TECHNOLOGY SERVICES',
    title: 'Mobile Apps, Cloud, Cyber Security & AI.',
    description:
      'End-to-end Android and cross-platform mobile apps, UI/UX design, DevOps automation, and AI/ML solutions.',
    ctaLabel: 'Our Capabilities',
    ctaHref: '#technology',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Analytics and technology performance metrics dashboard',
  },
  {
    id: 'business-growth',
    eyebrow: 'COLLABORATIVE DELIVERY',
    title: 'A Thoughtful Path from Idea to Impact.',
    description:
      'Six-step agile delivery with transparent sprints, rigorous QA, and dedicated long-term engineering support.',
    ctaLabel: 'Start a Project',
    ctaHref: '#contact',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Engineering team collaborating on digital product strategy',
  },
]

const MobileHeroCarousel = memo(function MobileHeroCarousel({
  heroContent,
  isActive,
}: {
  heroContent?: PublicSiteContent['hero']
  isActive: boolean
}) {
  const reducedMotion = useReducedMotion()
  const [failedSlides, setFailedSlides] = useState<Record<string, boolean>>({})
  const swiperRef = useRef<SwiperInstance | null>(null)
  const slides = MOBILE_HERO_SLIDES.map((slide, index) =>
    index === 0
      ? {
          ...slide,
          eyebrow: heroContent?.eyebrow || slide.eyebrow,
          description: heroContent?.subtitle || slide.description,
        }
      : slide,
  )

  useEffect(() => {
    const autoplay = swiperRef.current?.autoplay
    if (!autoplay) return

    if (isActive && !reducedMotion) {
      autoplay.start()
    } else {
      autoplay.stop()
    }
  }, [isActive, reducedMotion])

  const handleImageError = (id: string) => {
    setFailedSlides((prev) => ({ ...prev, [id]: true }))
  }

  const pauseAutoplay = () => {
    if (!reducedMotion) {
      swiperRef.current?.autoplay?.pause()
    }
  }

  const resumeAutoplay = () => {
    if (!reducedMotion) {
      swiperRef.current?.autoplay?.resume()
    }
  }

  return (
    <section
      className="mobile-hero-section"
      aria-label="Godavari Wave Technologies highlights"
    >
      <div
        className="mobile-hero-carousel-wrap"
        onTouchStart={pauseAutoplay}
        onTouchEnd={resumeAutoplay}
        onTouchCancel={resumeAutoplay}
      >
        <Swiper
          modules={[A11y, Autoplay, Pagination]}
          onSwiper={(instance) => {
            swiperRef.current = instance
            if (!isActive || reducedMotion) {
              instance.autoplay?.stop()
            }
          }}
          slidesPerView={1}
          spaceBetween={0}
          loop
          grabCursor
          speed={reducedMotion ? 0 : 800}
          autoplay={
            reducedMotion
              ? false
              : {
                  delay: 6500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                  waitForTransition: true,
                }
          }
          pagination={{ clickable: true }}
          a11y={{
            prevSlideMessage: 'Previous highlight slide',
            nextSlideMessage: 'Next highlight slide',
            paginationBulletMessage: 'Go to slide {{index}}',
          }}
          className="mobile-hero-swiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <article className="mobile-hero-slide">
                {!failedSlides[slide.id] && (
                  <img
                    className="mobile-hero-slide-bg"
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    loading={index === 0 && isActive ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => handleImageError(slide.id)}
                  />
                )}
                <div className="mobile-hero-slide-overlay" aria-hidden="true" />
                <div className="mobile-hero-slide-content">
                  <span className="mobile-hero-eyebrow">{slide.eyebrow}</span>
                  {index === 0 ? (
                    <h1 className="mobile-hero-title">{slide.title}</h1>
                  ) : (
                    <h2 className="mobile-hero-title">{slide.title}</h2>
                  )}
                  <p className="mobile-hero-desc">{slide.description}</p>
                  <div className="mobile-hero-actions">
                    <a
                      className="button button--primary mobile-hero-cta"
                      href={slide.ctaHref}
                    >
                      <span>{slide.ctaLabel}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </a>
                    {slide.secondaryLabel && slide.secondaryHref && (
                      <a
                        className="button mobile-hero-secondary"
                        href={slide.secondaryHref}
                      >
                        <Phone size={14} aria-hidden="true" />
                        <span>{slide.secondaryLabel}</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Compact mobile trust bar directly beneath the carousel */}
      <div className="container">
        <div className="mobile-hero-proof" aria-label="Company highlights">
          <div className="mobile-proof-chip">
            <MapPin size={14} aria-hidden="true" />
            <span>Hyderabad Branch</span>
          </div>
          <div className="mobile-proof-chip">
            <Layers3 size={14} aria-hidden="true" />
            <span>End-to-End Delivery</span>
          </div>
          <div className="mobile-proof-chip">
            <Globe2 size={14} aria-hidden="true" />
            <span>Global Solutions</span>
          </div>
        </div>
      </div>
    </section>
  )
})

export default MobileHeroCarousel
