import { useState, type FormEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Building2,
  CalendarClock,
  Check,
  LoaderCircle,
  Mail,
  MessageSquarePlus,
  Phone,
  Star,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ADMIN_INPUT_BASE, ADMIN_SURFACE_INPUT } from './adminInputStyles'
import {
  addAdminLeadNote,
  deleteAdminLead,
  getAdminErrorMessage,
  isAdminUnauthorizedError,
  LEAD_STATUS_BADGES,
  updateAdminLead,
  type AdminLead,
  type LeadPriority,
  type LeadStatus,
} from '../../services/adminApi'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

interface LeadDetailModalProps {
  lead: AdminLead
  onClose: () => void
  onLeadUpdated: (lead: AdminLead) => void
  onLeadDeleted: (leadId: string) => void
  onUnauthorized: () => void
}

export default function LeadDetailModal({
  lead,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
  onUnauthorized,
}: LeadDetailModalProps) {
  const reducedMotion = useReducedMotion()
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [priority, setPriority] = useState<LeadPriority>(
    lead.priority || (lead.isPriority ? 'high' : 'medium'),
  )
  const [assignedTo, setAssignedTo] = useState<string>(lead.assignedTo || '')
  const [followUpDate, setFollowUpDate] = useState<string>(
    lead.followUpDate ? lead.followUpDate.slice(0, 10) : '',
  )
  const [followUpNote, setFollowUpNote] = useState<string>(
    lead.followUpNote || '',
  )
  const [saving, setSaving] = useState(false)

  const [noteDraft, setNoteDraft] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      const updated = await updateAdminLead(lead._id, {
        status,
        priority,
        isPriority: priority === 'high',
        assignedTo: assignedTo.trim(),
        followUpDate: followUpDate || null,
        followUpNote: followUpNote.trim(),
      })
      onLeadUpdated(updated)
      toast.success('Lead details saved.')
    } catch (error) {
      if (isAdminUnauthorizedError(error)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = noteDraft.trim()
    if (!trimmed || addingNote) return

    setAddingNote(true)
    try {
      const updated = await addAdminLeadNote(lead._id, trimmed)
      setNoteDraft('')
      onLeadUpdated(updated)
      toast.success('Internal note added.')
    } catch (error) {
      if (isAdminUnauthorizedError(error)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(error))
    } finally {
      setAddingNote(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteAdminLead(lead._id)
      onLeadDeleted(lead._id)
      toast.success('Lead deleted.')
      onClose()
    } catch (error) {
      if (isAdminUnauthorizedError(error)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-detail-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={
          reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }
        }
        transition={{
          duration: reducedMotion ? 0 : 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#0d1c36]"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#0b1f3a] via-[#123b65] to-[#164e8a] px-6 py-5 text-white dark:border-white/10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="lead-detail-title"
                className="truncate text-lg font-bold text-white"
              >
                {lead.name}
              </h2>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${LEAD_STATUS_BADGES[status]}`}
              >
                {status}
              </span>
              {priority === 'high' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                  <Star size={12} className="fill-amber-300 text-amber-300" />
                  High Priority
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-sky-100/85">
              Submitted{' '}
              {new Date(lead.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="grid gap-6 overflow-y-auto p-6 md:grid-cols-12">
          {/* Customer Info + Message */}
          <div className="space-y-4 md:col-span-6">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contact Information
              </h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="mt-0.5 shrink-0 text-blue-600 dark:text-sky-400" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="break-all font-medium text-blue-700 hover:underline dark:text-sky-300"
                  >
                    {lead.email}
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="mt-0.5 shrink-0 text-blue-600 dark:text-sky-400" />
                  <a
                    href={`tel:${lead.phone}`}
                    className="font-medium text-slate-800 hover:underline dark:text-slate-100"
                  >
                    {lead.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 size={15} className="mt-0.5 shrink-0 text-blue-600 dark:text-sky-400" />
                  <span className="text-slate-700 dark:text-slate-200">
                    {lead.company || 'No company provided'}
                  </span>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Interested Service / Subject
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {lead.subject}
              </p>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {lead.message}
              </p>
            </div>

            {/* Internal Admin Notes */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MessageSquarePlus size={14} />
                Internal Admin Notes ({lead.notes?.length || 0})
              </h3>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  maxLength={2000}
                  placeholder="Add an internal note..."
                  className={`w-full min-w-0 rounded-xl px-3 py-2 text-xs font-medium ${ADMIN_INPUT_BASE}`}
                />
                <button
                  type="submit"
                  disabled={addingNote || !noteDraft.trim()}
                  className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingNote ? 'Saving...' : 'Add'}
                </button>
              </form>

              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                {(!lead.notes || lead.notes.length === 0) && (
                  <p className="py-2 text-xs text-slate-400">
                    No internal notes added yet.
                  </p>
                )}
                {[...(lead.notes || [])].reverse().map((note, idx) => (
                  <div
                    key={note._id || `${note.createdAt}-${idx}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-[#09172e]"
                  >
                    <p className="text-slate-800 dark:text-slate-100">
                      {note.text}
                    </p>
                    <p className="mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                      {note.addedBy} ·{' '}
                      {new Date(note.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow & Follow-Up Controls */}
          <div className="space-y-4 md:col-span-6">
            <form
              onSubmit={handleSaveDetails}
              className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lead Status & Follow-Up
                </h3>
                <select
                  aria-label="Lead priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as LeadPriority)
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-bold focus:outline-none ${
                    priority === 'high'
                      ? 'border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-200'
                      : priority === 'low'
                        ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-300'
                        : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/35 dark:bg-blue-500/15 dark:text-sky-300'
                  }`}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Lead Status
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as LeadStatus)}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-semibold ${ADMIN_SURFACE_INPUT}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <UserCheck size={14} className="text-blue-600 dark:text-sky-400" />
                  Assigned Team Member
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. Delivery Lead / Sales Team"
                  className={`w-full rounded-xl px-3 py-2 text-sm font-medium ${ADMIN_SURFACE_INPUT}`}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <CalendarClock size={14} className="text-blue-600 dark:text-sky-400" />
                  Follow-up Date & Reminder
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-medium ${ADMIN_SURFACE_INPUT}`}
                />
                <textarea
                  rows={3}
                  value={followUpNote}
                  onChange={(event) => setFollowUpNote(event.target.value)}
                  maxLength={500}
                  placeholder="Next action or reminder note..."
                  className={`mt-2 w-full rounded-xl px-3 py-2 text-xs font-medium ${ADMIN_SURFACE_INPUT}`}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] to-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save Lead Updates
                  </>
                )}
              </button>
            </form>

            {/* Delete Zone */}
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-400/25 dark:bg-rose-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200">
                    Delete Enquiry
                  </h4>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-200/75">
                    Permanently remove this enquiry and its notes.
                  </p>
                </div>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-200"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
