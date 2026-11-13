import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import ContactEnquiryContent from './ContactEnquiryContent'

interface EnquiryPopupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitted: () => void
}

export default function EnquiryPopupModal({
  isOpen,
  onClose,
  onSubmitted,
}: EnquiryPopupModalProps) {
  const reducedMotion = useReducedMotion()
  const closeAfterSubmitRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    return () => {
      if (closeAfterSubmitRef.current !== null) {
        window.clearTimeout(closeAfterSubmitRef.current)
      }
    }
  }, [])

  const handleSubmitted = () => {
    onSubmitted()
    if (closeAfterSubmitRef.current !== null) {
      window.clearTimeout(closeAfterSubmitRef.current)
    }
    closeAfterSubmitRef.current = window.setTimeout(() => {
      onClose()
    }, 1100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="enquiry-popup-backdrop"
          role="presentation"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.24, ease: 'easeOut' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            className="enquiry-popup-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-popup-title"
            initial={
              reducedMotion ? false : { opacity: 0, scale: 0.94, y: 18 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 14 }
            }
            transition={{
              duration: reducedMotion ? 0.12 : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <button
              type="button"
              className="enquiry-popup-close"
              onClick={onClose}
              aria-label="Close enquiry popup"
            >
              <X size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <div className="contact-layout enquiry-popup-layout">
              <ContactEnquiryContent
                headingId="enquiry-popup-title"
                onSubmitted={handleSubmitted}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
