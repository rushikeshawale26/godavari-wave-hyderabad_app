import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getApiErrorMessage, submitEnquiry } from '../services/api'

interface ContactEnquiryContentProps {
  headingId?: string
  onSubmitted?: () => void
}

export default function ContactEnquiryContent({
  headingId,
  onSubmitted,
}: ContactEnquiryContentProps) {
  const [submitting, setSubmitting] = useState(false)
  const submissionLock = useRef(false)
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionLock.current) return
    const form = event.currentTarget
    if (!form.reportValidity()) {
      toast.error('Please complete the required fields with valid information.')
      return
    }

    const values = new FormData(form)
    submissionLock.current = true
    const loadingToast = toast.loading('Sending your enquiry…')
    setSubmitting(true)
    setStatus(null)
    try {
      await submitEnquiry({
        name: String(values.get('name') ?? '').trim(),
        email: String(values.get('email') ?? '').trim(),
        phone: String(values.get('phone') ?? '').trim(),
        company: String(values.get('company') ?? '').trim(),
        subject: String(values.get('subject') ?? '').trim(),
        message: String(values.get('message') ?? '').trim(),
      })
      const message = 'Thanks for reaching out. Your enquiry has been sent.'
      setStatus({ kind: 'success', message })
      toast.success(message, { id: loadingToast })
      form.reset()
      onSubmitted?.()
    } catch (error) {
      const message = getApiErrorMessage(error)
      setStatus({ kind: 'error', message })
      toast.error(message, { id: loadingToast })
    } finally {
      submissionLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <>
      <aside className="contact-details hidden md:block">
        <span className="contact-kicker">HYDERABAD BRANCH</span>
        <h3>We’re here to help move your ideas forward.</h3>
        <p className="contact-intro">
          Share a little about your goals and we’ll help you find a good next step.
        </p>
        <div className="contact-info-list">
          <div className="contact-info-item">
            <span>
              <MapPin size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <strong>Office location</strong>
              <p>
                Meenakshi Tech Park, Phase 2, Gachibowli, Hyderabad, Telangana
                500032
              </p>
            </div>
          </div>
          <div className="contact-info-item">
            <span>
              <Mail size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <strong>General enquiries</strong>
              <p>
                <a href="mailto:info@godavariwave.com">info@godavariwave.com</a>
              </p>
            </div>
          </div>
          <div className="contact-info-item">
            <span>
              <Mail size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <strong>HR email</strong>
              <p>
                <a href="mailto:hrgodavariwavetech@gmail.com">
                  hrgodavariwavetech@gmail.com
                </a>
              </p>
            </div>
          </div>
          <div className="contact-info-item">
            <span>
              <Phone size={18} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <strong>Phone</strong>
              <p>
                <a href="tel:+917799822121">7799822121</a>
              </p>
            </div>
          </div>
        </div>
        <a
          className="map-link"
          href="https://www.google.com/maps/search/?api=1&query=Meenakshi%20Tech%20Park%2C%20Phase%202%2C%20Gachibowli%2C%20Hyderabad%2C%20Telangana%20500032"
          target="_blank"
          rel="noreferrer"
        >
          Explore Hyderabad on the map{' '}
          <ExternalLink size={16} strokeWidth={1.9} aria-hidden="true" />
        </a>
        <div className="contact-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>
      <form
        className="contact-form max-md:w-full max-md:min-w-0"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-heading">
          <h3 id={headingId}>Send us an enquiry</h3>
          <p>
            Fields marked <span>*</span> are required.
          </p>
        </div>
        <div className="form-grid">
          <label>
            Full name <span>*</span>
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Your name"
            />
          </label>
          <label>
            Email address <span>*</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </label>
          <label>
            Phone number <span>*</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+91"
            />
          </label>
          <label>
            Company
            <input
              name="company"
              autoComplete="organization"
              placeholder="Company name"
            />
          </label>
        </div>
        <label>
          Subject <span>*</span>
          <input
            name="subject"
            required
            maxLength={160}
            placeholder="What can we help with?"
          />
        </label>
        <label>
          Message <span>*</span>
          <textarea
            name="message"
            rows={4}
            required
            maxLength={4000}
            placeholder="Tell us a little about your project or question…"
          />
        </label>
        {status && (
          <p
            className={`form-feedback form-feedback--${status.kind}`}
            role={status.kind === 'error' ? 'alert' : 'status'}
          >
            {status.kind === 'success' && (
              <Check size={17} strokeWidth={2.2} aria-hidden="true" />
            )}
            {status.message}
          </p>
        )}
        <button
          className="button button--primary form-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Sending enquiry…' : 'Submit enquiry'}
          {!submitting && (
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <p className="form-note">
          Your details will be used to respond to this enquiry.
        </p>
      </form>
    </>
  )
}
