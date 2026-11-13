import { AnimatePresence, motion } from 'motion/react'
import {
  Bot,
  Check,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  getApiErrorMessage,
  getChatStatus,
  sendChatMessages,
  type ChatMessage,
} from '../services/api'

interface ConversationMessage extends ChatMessage {
  id: string
  createdAt: Date
  needsHumanSupport?: boolean
  supportQuestion?: string
  retryQuestion?: string
  isFallback?: boolean
  source?: 'ai' | 'fallback'
}

const HR_EMAIL = 'hrgodavariwavetech@gmail.com'
const HUMAN_REQUEST_PATTERN =
  /\b(?:talk|speak|connect|contact|reach).{0,35}\b(?:human|person|someone|hr|support|team)\b|\b(?:human|person|hr|support|team).{0,35}\b(?:help|assist|speak|talk|contact|connect)\b|\b(?:real person|human assistance|human support)\b/i

const suggestions = [
  'What services does Godavari Wave provide?',
  'Do you develop mobile applications?',
  'Do you provide custom software solutions?',
  'What technologies do you work with?',
  'How can I start a project?',
  'How can I contact the Hyderabad office?',
  'Are there any current job openings?',
]

const createWelcomeMessage = (): ConversationMessage => ({
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello! I can help with Godavari Wave’s services, current openings, project enquiries, and verified contact details.',
  createdAt: new Date(),
})

const CHAT_SESSION_STORAGE_KEY = 'godavari-wave-chat-session-id'

const generateChatSessionId = (): string => {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  } catch {
    // Fallback when crypto.randomUUID is unavailable
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const getOrCreateChatSessionId = (): string => {
  try {
    const existing = window.sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing
    const created = generateChatSessionId()
    window.sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return generateChatSessionId()
  }
}

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const [availability, setAvailability] = useState<
    'checking' | 'ready' | 'fallback' | 'not-configured' | 'error'
  >('checking')
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([
    createWelcomeMessage(),
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageSequence = useRef(0)
  const requestInFlight = useRef(false)
  const sessionIdRef = useRef<string>(getOrCreateChatSessionId())

  useEffect(() => {
    let active = true
    void getChatStatus()
      .then(({ configured, fallbackAvailable, whatsappNumber: verifiedNumber }) => {
        if (active) {
          setAvailability(
            configured ? 'ready' : fallbackAvailable ? 'fallback' : 'not-configured',
          )
          setWhatsappNumber(verifiedNumber)
        }
      })
      .catch(() => {
        if (active) setAvailability('error')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const submitMessage = async (value: string, isRetry = false) => {
    const content = value.trim()
    if (!content || requestInFlight.current || isTyping) return
    if (content.length > 1200) {
      toast.error('Please keep your message under 1,200 characters.')
      return
    }

    const latestMessage = messages[messages.length - 1]
    if (
      !isRetry &&
      latestMessage?.role === 'user' &&
      latestMessage.content.trim().toLowerCase() === content.toLowerCase()
    ) {
      setDraft('')
      return
    }

    requestInFlight.current = true
    const nextMessages = isRetry
      ? messages.filter(
          (message) =>
            !(message.role === 'assistant' && message.retryQuestion === content),
        )
      : [
          ...messages,
          {
            id: `visitor-${++messageSequence.current}`,
            role: 'user' as const,
            content,
            createdAt: new Date(),
          },
        ].slice(-11)
    setMessages(nextMessages)
    setDraft('')

    if (HUMAN_REQUEST_PATTERN.test(content)) {
      const assistantMessage: ConversationMessage = {
        id: `assistant-${++messageSequence.current}`,
        role: 'assistant',
        content: whatsappNumber
          ? 'Would you like to connect with our HR / Support Team on WhatsApp?'
          : `Our WhatsApp number is not configured yet. You can contact HR at ${HR_EMAIL} or call our Hyderabad office at 7799822121.`,
        createdAt: new Date(),
        needsHumanSupport: true,
        supportQuestion: content,
        isFallback: true,
        source: 'fallback',
      }
      setMessages((current) =>
        [...current, assistantMessage].slice(-11),
      )
      requestInFlight.current = false
      return
    }

    setIsTyping(true)

    try {
      const history = nextMessages
        .filter(
          (message) =>
            message.id !== 'welcome' &&
            !message.id.startsWith('assistant-error-'),
        )
        .slice(-8)
        .map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        }))
      const result = await sendChatMessages(history, sessionIdRef.current)
      setAvailability(result.isFallback ? 'fallback' : 'ready')
      const assistantMessage: ConversationMessage = {
        id: `assistant-${++messageSequence.current}`,
        role: 'assistant',
        content: result.reply,
        createdAt: new Date(),
        needsHumanSupport: result.needsHumanSupport,
        supportQuestion: result.needsHumanSupport ? content : undefined,
        isFallback: result.isFallback,
        source: result.source,
      }
      setMessages((current) =>
        [...current, assistantMessage].slice(-11),
      )
    } catch (error) {
      const message = getApiErrorMessage(error)
      setAvailability((current) => current === 'checking' ? 'error' : current)
      const errorMessage: ConversationMessage = {
        id: `assistant-error-${++messageSequence.current}`,
        role: 'assistant',
        content: message,
        createdAt: new Date(),
        retryQuestion: content,
      }
      setMessages((current) =>
        [...current, errorMessage].slice(-11),
      )
    } finally {
      requestInFlight.current = false
      setIsTyping(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitMessage(draft)
  }

  const clearConversation = () => {
    const nextSessionId = generateChatSessionId()
    sessionIdRef.current = nextSessionId
    try {
      window.sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextSessionId)
    } catch {
      // Ignore storage write errors
    }
    setMessages([createWelcomeMessage()])
    setDraft('')
    toast.success('Conversation cleared.')
  }

  const statusText = {
    checking: 'Checking assistant',
    ready: 'AI assistant available',
    fallback: 'Quick guide active (AI offline)',
    'not-configured': 'Assistant setup required',
    error: 'Assistant status unavailable',
  }[availability]
  const hasVisibleAssistantError = messages.some(
    (message) => Boolean(message.retryQuestion),
  )

  return (
    <div className="chat-assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="chat-window"
            role="dialog"
            aria-modal="false"
            aria-labelledby="chat-title"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <header className="chat-header">
              <span className="chat-avatar"><Bot size={21} aria-hidden="true" /></span>
              <div className="chat-heading">
                <h2 id="chat-title">Website assistant</h2>
                <span className={`chat-status chat-status--${availability}`}>
                  <i /> {statusText}
                </span>
              </div>
              <div className="chat-header-actions">
                <button
                  type="button"
                  className="chat-header-button"
                  onClick={clearConversation}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="chat-header-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                >
                  <ChevronDown size={19} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
              {messages.map((message) => (
                <div
                  className={`chat-message chat-message--${message.role}`}
                  key={message.id}
                >
                  {message.role === 'assistant' && (
                    <span className="chat-message-avatar"><Sparkles size={14} aria-hidden="true" /></span>
                  )}
                  <div className="chat-message-content">
                    <p>{message.content}</p>
                    <div className="chat-message-meta">
                      <time dateTime={message.createdAt.toISOString()}>
                        {formatTime(message.createdAt)}
                      </time>
                      {message.role === 'assistant' && message.isFallback && (
                        <span
                          className="chat-source-badge"
                          title="Verified quick guide fallback response (AI unavailable)"
                        >
                          Quick guide
                        </span>
                      )}
                    </div>
                    {message.needsHumanSupport && (
                      <div className="chat-support-action">
                        {whatsappNumber ? (
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                              `Hello, I need assistance with: ${message.supportQuestion || 'my question'}\n\nReference: Godavari Wave website support.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle size={15} aria-hidden="true" />
                            Connect on WhatsApp
                            <ExternalLink size={13} aria-hidden="true" />
                          </a>
                        ) : (
                          <>
                            <span>
                              WhatsApp support is not configured with a verified
                              number yet.
                            </span>
                            <a
                              href={`mailto:${HR_EMAIL}?subject=${encodeURIComponent(
                                'Website support request',
                              )}&body=${encodeURIComponent(
                                `Hello HR team,\n\nI need assistance with: ${message.supportQuestion || 'my question'}\n\nReference: Godavari Wave website support.`,
                              )}`}
                            >
                              Email HR instead
                            </a>
                          </>
                        )}
                      </div>
                    )}
                    {message.retryQuestion && (
                      <button
                        type="button"
                        className="chat-retry-button"
                        disabled={isTyping}
                        onClick={() =>
                          void submitMessage(message.retryQuestion || '', true)
                        }
                      >
                        Retry
                      </button>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <span className="chat-message-avatar chat-message-avatar--user">
                      <Check size={14} aria-hidden="true" />
                    </span>
                  )}
                </div>
              ))}
              {messages.length === 1 && (
                <div className="chat-suggestions">
                  <span>Suggested questions</span>
                  {suggestions.map((question) => (
                    <button
                      type="button"
                      key={question}
                      disabled={isTyping}
                      onClick={() => void submitMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
              {isTyping && (
                <div className="chat-typing" role="status" aria-label="Assistant is typing">
                  <span /><span /><span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {availability === 'not-configured' && !hasVisibleAssistantError && (
              <p className="chat-setup-note">
                AI replies are unavailable until the backend has a valid OpenAI API key. You can still reach us through the contact form.
              </p>
            )}
            {availability === 'error' && !hasVisibleAssistantError && (
              <p className="chat-setup-note">
                The assistant service is unavailable. Please use the contact form instead.
              </p>
            )}
            <form className="chat-composer" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="chat-message">
                Ask the website assistant
              </label>
              <textarea
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void submitMessage(draft)
                  }
                }}
                placeholder="Ask us a question…"
                rows={1}
                maxLength={1200}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="chat-send"
                aria-label="Send message"
                disabled={!draft.trim() || isTyping}
              >
                {isTyping ? (
                  <LoaderCircle className="chat-send-spinner" size={18} aria-hidden="true" />
                ) : (
                  <Send size={17} aria-hidden="true" />
                )}
              </button>
              <span className="chat-privacy-note">Please don’t share sensitive personal information.</span>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button
        className={`chat-launcher${isOpen ? ' chat-launcher--open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Close website assistant' : 'Open website assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        {isOpen ? <X size={21} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
      </motion.button>
    </div>
  )
}
