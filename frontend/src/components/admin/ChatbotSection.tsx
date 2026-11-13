import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  AlertTriangle,
  Bot,
  Calendar,
  LoaderCircle,
  MessageSquare,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import {
  getAdminChatConversationById,
  getAdminChatConversations,
  getAdminErrorMessage,
  isAdminUnauthorizedError,
  type ChatConversationRecord,
  type FrequentQuestionItem,
  type UnansweredQuestionItem,
} from '../../services/adminApi'

import { ADMIN_INPUT_BASE } from './adminInputStyles'

interface ChatbotSectionProps {
  onUnauthorized: () => void
  refreshNonce: number
}

export default function ChatbotSection({
  onUnauthorized,
  refreshNonce,
}: ChatbotSectionProps) {
  const reducedMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversationRecord[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [frequentQuestions, setFrequentQuestions] = useState<
    FrequentQuestionItem[]
  >([])
  const [unansweredQuestions, setUnansweredQuestions] = useState<
    UnansweredQuestionItem[]
  >([])

  const [selectedConvo, setSelectedConvo] =
    useState<ChatConversationRecord | null>(null)
  const [loadingConvo, setLoadingConvo] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void getAdminChatConversations({
        q: query,
        dateFrom,
        dateTo,
        onlyUnanswered,
        page,
      })
        .then((data) => {
          if (!active) return
          setConversations(data.conversations)
          setTotal(data.total)
          setTotalPages(data.totalPages)
          setFrequentQuestions(data.frequentQuestions)
          setUnansweredQuestions(data.unansweredQuestions)
        })
        .catch((err) => {
          if (!active) return
          if (isAdminUnauthorizedError(err)) {
            onUnauthorized()
            return
          }
          setError(getAdminErrorMessage(err))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [dateFrom, dateTo, onUnauthorized, onlyUnanswered, page, query, refreshNonce])

  const openSessionTranscript = async (id: string) => {
    setLoadingConvo(true)
    try {
      const convo = await getAdminChatConversationById(id)
      setSelectedConvo(convo)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      setError(getAdminErrorMessage(err))
    } finally {
      setLoadingConvo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Search Questions & Sessions
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search visitor questions, answers, or session ID..."
              className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value)
              setPage(1)
            }}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${ADMIN_INPUT_BASE}`}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value)
              setPage(1)
            }}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${ADMIN_INPUT_BASE}`}
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-[#08152b] dark:text-slate-200">
          <input
            type="checkbox"
            checked={onlyUnanswered}
            onChange={(event) => {
              setOnlyUnanswered(event.target.checked)
              setPage(1)
            }}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Unanswered / Needs Follow-up Only
        </label>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Sessions Grouped Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Visitor Chatbot Sessions ({total})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Non-sensitive visitor session transcripts stored with privacy redaction
            </p>
          </div>
          {loadingConvo && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-sky-300">
              <LoaderCircle size={14} className="animate-spin" />
              Loading transcript...
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-500">
            <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
            Loading chatbot conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No chatbot conversations recorded yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Visitor questions submitted through the website assistant will appear here grouped by session.
            </p>
          </div>
        ) : (
          <div className="admin-animate-fade overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Session ID</th>
                  <th className="px-5 py-3">Latest Visitor Question</th>
                  <th className="px-5 py-3">Questions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last Active</th>
                  <th className="px-5 py-3 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {conversations.map((convo) => (
                  <tr
                    key={convo._id}
                    className="transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-white/[0.06]"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {convo.sessionId.slice(0, 14)}
                    </td>
                    <td className="max-w-xs px-5 py-3.5">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {convo.lastQuestion || '—'}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {convo.lastReply}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {convo.userQuestionsCount}
                    </td>
                    <td className="px-5 py-3.5">
                      {convo.unansweredCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          <AlertTriangle size={12} />
                          {convo.unansweredCount} needs review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Answered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(convo.lastMessageAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openSessionTranscript(convo._id)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-sky-300"
                      >
                        View Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs dark:border-white/10">
            <span className="text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 disabled:opacity-40 dark:border-white/15 dark:text-slate-200"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 disabled:opacity-40 dark:border-white/15 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Insights Grid: FAQ & Unanswered Questions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles size={16} className="text-blue-600 dark:text-sky-400" />
            Frequently Asked Questions
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Most common visitor queries from stored sessions
          </p>

          {frequentQuestions.length === 0 ? (
            <p className="mt-6 text-center text-xs text-slate-400">
              No visitor questions recorded yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {frequentQuestions.map((item) => (
                <li
                  key={item.question}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs dark:bg-white/5"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {item.question}
                  </span>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-sky-300">
                    {item.count}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <AlertTriangle size={16} className="text-amber-500" />
            Unanswered or Handoff Questions
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Questions requiring team follow-up or absent from website info
          </p>

          {unansweredQuestions.length === 0 ? (
            <p className="mt-6 text-center text-xs text-slate-400">
              No unanswered chatbot questions flagged.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {unansweredQuestions.map((item, index) => (
                <li
                  key={`${item.conversationId}-${index}`}
                  className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 text-xs dark:border-amber-400/25 dark:bg-amber-500/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">
                      “{item.question}”
                    </p>
                    <button
                      type="button"
                      onClick={() => openSessionTranscript(item.conversationId)}
                      className="shrink-0 text-[11px] font-bold text-blue-700 hover:underline dark:text-sky-300"
                    >
                      Session
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    Bot: {item.response}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      <AnimatePresence>
        {selectedConvo && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedConvo(null)
            }}
          >
            <motion.div
              initial={
                reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 8 }
              }
              transition={{
                duration: reducedMotion ? 0 : 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#0d1c36]"
            >
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#0b1f3a] to-[#164e8a] px-6 py-4 text-white dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  Chatbot Session Transcript
                </h3>
                <p className="font-mono text-[11px] text-sky-200">
                  Session: {selectedConvo.sessionId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConvo(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close transcript"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-5">
              {selectedConvo.messages.map((turn, idx) => (
                <div
                  key={turn._id || idx}
                  className={`flex gap-3 rounded-2xl p-3.5 text-xs ${
                    turn.role === 'user'
                      ? 'bg-blue-50/80 dark:bg-blue-500/15'
                      : 'border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      turn.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#0b1f3a] text-sky-300'
                    }`}
                  >
                    {turn.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {turn.role === 'user' ? 'Visitor' : 'Website Assistant'}
                      </span>
                      {turn.source && turn.role === 'assistant' && (
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-300">
                          {turn.source}
                        </span>
                      )}
                      {turn.failedOrUnanswered && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                          Needs Follow-up
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200">
                      {turn.content}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(turn.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
