import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'

export type PolicyTab = 'privacy' | 'terms'

interface PolicyModalProps {
  isOpen: boolean
  activeTab: PolicyTab
  onClose: () => void
  onTabChange: (tab: PolicyTab) => void
}

export default function PolicyModal({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
}: PolicyModalProps) {
  const [lastUpdated] = useState('October 2024')

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="dialog-backdrop"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          className="policy-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          {/* Modal Header */}
          <div className="policy-modal-header">
            <div className="policy-modal-heading">
              <span className="policy-modal-kicker">
                GODAVARI WAVE TECHNOLOGIES PVT. LTD.
              </span>
              <h2 id="policy-modal-title">
                {activeTab === 'privacy'
                  ? 'Privacy Policy'
                  : 'Terms & Conditions'}
              </h2>
              <p className="policy-modal-meta">
                Last updated: {lastUpdated} &bull; Applicable to Godavari Wave
                Technologies and Hyderabad Branch operations
              </p>
            </div>
            <button
              type="button"
              className="policy-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="policy-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              className={`policy-tab-btn ${activeTab === 'privacy' ? 'policy-tab-btn--active' : ''}`}
              onClick={() => onTabChange('privacy')}
            >
              <ShieldCheck size={16} />
              <span>Privacy Policy</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              className={`policy-tab-btn ${activeTab === 'terms' ? 'policy-tab-btn--active' : ''}`}
              onClick={() => onTabChange('terms')}
            >
              <FileText size={16} />
              <span>Terms &amp; Conditions</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="policy-modal-content">
            {activeTab === 'privacy' ? (
              <div className="policy-prose">
                <section>
                  <h3>1. Introduction &amp; Commitment</h3>
                  <p>
                    Godavari Wave Technologies Pvt. Ltd. (&ldquo;Godavari Wave&rdquo;,
                    &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is
                    committed to safeguarding the privacy and confidentiality of our
                    website visitors, clients, partners, and job applicants. This
                    Privacy Policy outlines how we collect, store, utilize, and protect
                    your personal information across our website and Hyderabad
                    branch communications.
                  </p>
                </section>

                <section>
                  <h3>2. Information We Collect</h3>
                  <p>
                    We collect personal information that you voluntarily furnish
                    when contacting us or submitting an application through our
                    website:
                  </p>
                  <ul>
                    <li>
                      <strong>Contact Inquiries:</strong> Full name, corporate email
                      address, telephone number, company name, and project briefs
                      submitted through our contact forms or email channels.
                    </li>
                    <li>
                      <strong>Career Applications:</strong> The careers form
                      prepares an email draft with the details you enter. The
                      website does not receive the application; the details are
                      shared with HR only if you review and send the email
                      yourself. You may attach your resume before sending.
                    </li>
                    <li>
                      <strong>Anonymous Visitor Count:</strong> With browser
                      storage available, a random visitor ID is kept in local
                      storage and converted to a keyed hash before it is stored
                      on our server. The hash is used only to count unique
                      visitors during the configured counting period and is not
                      linked to form details or a visitor's name. Raw visitor IDs
                      are not stored on the server.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3>3. How We Use Your Information</h3>
                  <p>Your information is used exclusively to:</p>
                  <ul>
                    <li>
                      Respond promptly to your service inquiries, request for
                      proposals (RFPs), and technical engineering consultations.
                    </li>
                    <li>
                      Evaluate career applications and contact candidates
                      regarding open engineering and technology positions.
                    </li>
                    <li>
                      Maintain website security, prevent malicious activity, and
                      optimize technical delivery across desktop and mobile devices.
                    </li>
                  </ul>
                  <p>
                    We never sell, rent, lease, or monetize your personal
                    information to third parties or marketing brokers.
                  </p>
                </section>

                <section>
                  <h3>4. Data Security &amp; Retention</h3>
                  <p>
                    We implement modern industry-standard administrative,
                    technical, and physical security measures to protect your
                    data from unauthorized access, alteration, disclosure, or
                    destruction. Inquiries and candidate submissions are retained
                    only for the duration necessary to satisfy the purpose of
                    communication or regulatory obligations.
                  </p>
                </section>

                <section>
                  <h3>5. Your Rights &amp; Contact Information</h3>
                  <p>
                    You maintain the right to request access to, correction of,
                    or deletion of your submitted personal records at any time.
                    For any privacy inquiries or data requests, please contact our
                    data compliance team at{' '}
                    <a href="mailto:info@godavariwave.com">
                      info@godavariwave.com
                    </a>
                    .
                  </p>
                </section>
              </div>
            ) : (
              <div className="policy-prose">
                <section>
                  <h3>1. Acceptance of Terms</h3>
                  <p>
                    By accessing or browsing this website of Godavari Wave
                    Technologies Pvt. Ltd. (including our Hyderabad branch portal),
                    you agree to adhere to and be bound by these Terms &amp;
                    Conditions, our Privacy Policy, and all relevant statutory
                    laws and regulations of India. If you do not agree with any of
                    these terms, you are advised not to continue using this site.
                  </p>
                </section>

                <section>
                  <h3>2. Corporate Scope &amp; Technology Services</h3>
                  <p>
                    Godavari Wave Technologies Pvt. Ltd. specializes in custom
                    software development, web and mobile application engineering,
                    cloud hosting architectures, UI/UX design, digital marketing,
                    and IT consulting. Website content is provided for informational
                    purposes to introduce our engineering capabilities and facilitate
                    client collaboration. Formal engineering deliverables, service-level
                    agreements (SLAs), and project milestones are governed by
                    individual written master service agreements (MSAs).
                  </p>
                </section>

                <section>
                  <h3>3. Intellectual Property Rights</h3>
                  <p>
                    All visual designs, brand assets, logos, code snippets,
                    trademarks, interactive 3D presentations, text copy, and
                    media assets appearing on this website are the proprietary
                    intellectual property of Godavari Wave Technologies Pvt. Ltd.
                    No materials may be reproduced, distributed, altered, or
                    republished without our explicit prior written consent.
                  </p>
                </section>

                <section>
                  <h3>4. User Conduct &amp; Form Submissions</h3>
                  <p>
                    Users agree not to submit fraudulent, malicious, or defamatory
                    content through our contact or career submission forms. You may
                    not attempt to compromise the integrity, security, or
                    availability of our web servers, database infrastructure, or
                    network nodes.
                  </p>
                </section>

                <section>
                  <h3>5. Disclaimer of Warranties &amp; Limitation of Liability</h3>
                  <p>
                    While we endeavor to keep all information accurate and
                    current, website materials are provided on an &ldquo;as is&rdquo;
                    and &ldquo;as available&rdquo; basis without warranties of any
                    kind. In no event shall Godavari Wave Technologies Pvt. Ltd.
                    or its directors, engineers, or branch representatives be
                    liable for any indirect, consequential, or incidental damages
                    arising from website use.
                  </p>
                </section>

                <section>
                  <h3>6. Governing Law &amp; Jurisdiction</h3>
                  <p>
                    These terms are governed by and construed in accordance with the
                    laws of the Republic of India. Any legal disputes arising under
                    these terms shall be subject to the exclusive jurisdiction of the
                    competent courts of Andhra Pradesh and Telangana, India.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="policy-modal-footer">
            <div className="policy-verified-note">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Official Policy &bull; Godavari Wave Technologies Pvt. Ltd.</span>
            </div>
            <button
              type="button"
              className="button button--primary policy-confirm-btn"
              onClick={onClose}
            >
              I Understand &amp; Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
