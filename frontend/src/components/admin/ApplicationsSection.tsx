import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  CalendarClock,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  LoaderCircle,
  Mail,
  Phone,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ADMIN_INPUT_BASE, ADMIN_SURFACE_INPUT } from './adminInputStyles'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  APPLICATION_STATUS_BADGES,
  deleteAdminApplication,
  downloadAdminApplicationResume,
  exportAdminApplicationsCsv,
  getAdminApplications,
  getAdminErrorMessage,
  isAdminUnauthorizedError,
  triggerBlobDownload,
  updateAdminApplication,
  type AdminJobApplication,
  type ApplicationStatus,
} from '../../services/adminApi'

interface ApplicationsSectionProps {
  onUnauthorized: () => void
  onChanged: () => void
  refreshNonce: number
}

const APP_STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ApplicationsSection({
  onUnauthorized,
  onChanged,
  refreshNonce,
}: ApplicationsSectionProps) {
  const reducedMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [statusFilter, setStatusFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applications, setApplications] = useState<AdminJobApplication[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedApp, setSelectedApp] = useState<AdminJobApplication | null>(
    null,
  )
  const [interviewDate, setInterviewDate] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void getAdminApplications({
        q: debouncedQuery,
        status: statusFilter,
        position: positionFilter,
        dateFrom,
        dateTo,
        sort: sortOrder,
        page,
      })
        .then((data) => {
          if (!active) return
          setApplications(data.applications)
          setTotal(data.total)
          setTotalPages(data.totalPages)
          setPositions(data.positions)
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
  }, [
    dateFrom,
    dateTo,
    onUnauthorized,
    page,
    positionFilter,
    debouncedQuery,
    refreshNonce,
    sortOrder,
    statusFilter,
  ])

  const openInspector = (app: AdminJobApplication) => {
    setSelectedApp(app)
    setInterviewDate(app.interviewDate ? app.interviewDate.slice(0, 10) : '')
    setNoteDraft('')
    setConfirmDelete(false)
  }

  const handleStatusChange = async (
    id: string,
    nextStatus: ApplicationStatus,
  ) => {
    try {
      const updated = await updateAdminApplication(id, { status: nextStatus })
      setApplications((prev) => prev.map((a) => (a._id === id ? updated : a)))
      if (selectedApp?._id === id) setSelectedApp(updated)
      onChanged()
      toast.success('Application status updated.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedApp || savingDetail) return

    setSavingDetail(true)
    try {
      const updated = await updateAdminApplication(selectedApp._id, {
        status: selectedApp.status,
        interviewDate: interviewDate || null,
        ...(noteDraft.trim() ? { note: noteDraft.trim() } : {}),
      })
      setSelectedApp(updated)
      setNoteDraft('')
      setApplications((prev) =>
        prev.map((a) => (a._id === updated._id ? updated : a)),
      )
      onChanged()
      toast.success('Application details saved.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setSavingDetail(false)
    }
  }

  const handleDownloadResume = async (app: AdminJobApplication) => {
    try {
      const blob = await downloadAdminApplicationResume(app._id)
      triggerBlobDownload(blob, app.resumeFileName || `resume-${app.fullName}`)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleExportCsv = async () => {
    try {
      const blob = await exportAdminApplicationsCsv({
        q: query,
        status: statusFilter,
        position: positionFilter,
        dateFrom,
        dateTo,
      })
      triggerBlobDownload(
        blob,
        `godavari-wave-applications-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      toast.success('Applications exported to CSV.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleDeleteApp = async () => {
    if (!selectedApp) return
    try {
      await deleteAdminApplication(selectedApp._id)
      setSelectedApp(null)
      onChanged()
      toast.success('Application removed.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search applicant name, email, phone, position, or qualification..."
              className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={total === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] to-[#2563eb] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-110 disabled:opacity-50"
          >
            <Download size={14} />
            Export Applications CSV
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="all">All Statuses</option>
              {APP_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Position
            </label>
            <select
              value={positionFilter}
              onChange={(e) => {
                setPositionFilter(e.target.value)
                setPage(1)
              }}
              className={`max-w-[200px] rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="all">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sort
            </label>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as 'latest' | 'oldest')
              }
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="border-b border-slate-100 px-5 py-3.5 text-xs font-bold text-slate-800 dark:border-white/10 dark:text-white">
          Submitted Job Applications ({total})
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-500">
            <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <User size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No job applications found
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Applications submitted from the Careers page are stored in MongoDB and listed here.
            </p>
          </div>
        ) : (
          <div className="admin-animate-fade overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Position &amp; Qualification</th>
                  <th className="px-4 py-3">Resume</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    className="transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-white/[0.06]"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {app.fullName}
                      </p>
                      <p className="text-[11px] text-blue-700 dark:text-sky-300">
                        {app.email}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {app.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {app.position}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Exp: {app.experience || 'Fresher'}
                        {app.education ? ` · ${app.education}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {app.hasResumeFile ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(app)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-sky-300"
                        >
                          <FileDown size={13} />
                          Download
                        </button>
                      ) : app.resumeUrl && /^https?:\/\//i.test(app.resumeUrl.trim()) ? (
                        <a
                          href={app.resumeUrl.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline dark:text-sky-300"
                        >
                          Open Link <ExternalLink size={12} />
                        </a>
                      ) : app.resumeUrl ? (
                        <span className="text-rose-500 dark:text-rose-300">
                          Unsafe link blocked
                        </span>
                      ) : (
                        <span className="text-slate-400">Not attached</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(app.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(
                            app._id,
                            e.target.value as ApplicationStatus,
                          )
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold focus:outline-none ${APPLICATION_STATUS_BADGES[app.status]}`}
                      >
                        {APP_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right align-top">
                      <button
                        type="button"
                        onClick={() => openInspector(app)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                      >
                        <Eye size={13} />
                        View
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
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applicant Details Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedApp(null)
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
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#0d1c36]"
            >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0b1f3a] to-[#164e8a] px-6 py-4 text-white">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedApp.fullName}
                </h3>
                <p className="text-xs text-sky-200">
                  Applied for {selectedApp.position}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close applicant details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-6 text-xs">
              <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 font-semibold">
                  <Mail size={14} className="text-blue-600" />
                  <a href={`mailto:${selectedApp.email}`} className="hover:underline">
                    {selectedApp.email}
                  </a>
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <Phone size={14} className="text-blue-600" />
                  <a href={`tel:${selectedApp.phone}`} className="hover:underline">
                    {selectedApp.phone}
                  </a>
                </p>
                <p>
                  <strong>Experience:</strong> {selectedApp.experience || 'Fresher'}
                </p>
                <p>
                  <strong>Education:</strong> {selectedApp.education || '—'}
                </p>
                {selectedApp.address && (
                  <p className="sm:col-span-2">
                    <strong>Address:</strong> {selectedApp.address}
                  </p>
                )}
              </div>

              {selectedApp.coverLetter && (
                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                  <p className="mb-1 font-bold uppercase tracking-wider text-slate-400">
                    Cover Note
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200">
                    {selectedApp.coverLetter}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSaveDetails}
                className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold">Status</label>
                    <select
                      value={selectedApp.status}
                      onChange={(e) =>
                        setSelectedApp((s) =>
                          s
                            ? {
                                ...s,
                                status: e.target.value as ApplicationStatus,
                              }
                            : s,
                        )
                      }
                      className={`w-full rounded-xl px-3 py-2 font-semibold ${ADMIN_SURFACE_INPUT}`}
                    >
                      {APP_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 font-bold">
                      <CalendarClock size={13} /> Interview Date
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_SURFACE_INPUT}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold">
                    Add HR Evaluation Note
                  </label>
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Interview feedback or follow-up note..."
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_SURFACE_INPUT}`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingDetail}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingDetail ? 'Saving...' : 'Save Application Update'}
                  </button>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 font-bold text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-lg border px-3 py-1.5 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteApp}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {selectedApp.notes && selectedApp.notes.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold uppercase tracking-wider text-slate-400">
                    HR Notes
                  </p>
                  {selectedApp.notes.map((n, i) => (
                    <div
                      key={n._id || i}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                    >
                      <p>{n.text}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {n.addedBy} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
