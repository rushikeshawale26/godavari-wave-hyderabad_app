import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  BriefcaseBusiness,
  Calendar,
  Edit3,
  LoaderCircle,
  MapPin,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ADMIN_INPUT_BASE } from './adminInputStyles'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  createAdminJob,
  deleteAdminJob,
  getAdminErrorMessage,
  getAdminJobs,
  isAdminUnauthorizedError,
  toggleAdminJobStatus,
  updateAdminJob,
  type AdminJobOpening,
} from '../../services/adminApi'

interface CareersSectionProps {
  onUnauthorized: () => void
  onChanged: () => void
  refreshNonce: number
}

interface JobFormState {
  title: string
  department: string
  location: string
  jobType: AdminJobOpening['jobType']
  experience: string
  description: string
  responsibilitiesText: string
  requirementsText: string
  qualifications: string
  vacancies: number
  deadline: string
  isActive: boolean
}

const emptyJobForm = (): JobFormState => ({
  title: '',
  department: '',
  location: 'Hyderabad',
  jobType: 'Full-time',
  experience: 'Fresher',
  description: '',
  responsibilitiesText: '',
  requirementsText: '',
  qualifications: '',
  vacancies: 1,
  deadline: '',
  isActive: true,
})

const jobToForm = (job: AdminJobOpening): JobFormState => ({
  title: job.title,
  department: job.department,
  location: job.location || 'Hyderabad',
  jobType: job.jobType,
  experience: job.experience || 'Fresher',
  description: job.description,
  responsibilitiesText: (job.responsibilities || []).join('\n'),
  requirementsText: (job.requirements || []).join('\n'),
  qualifications: job.qualifications || '',
  vacancies: job.vacancies || 1,
  deadline: job.deadline ? job.deadline.slice(0, 10) : '',
  isActive: job.isActive,
})

export default function CareersSection({
  onUnauthorized,
  onChanged,
  refreshNonce,
}: CareersSectionProps) {
  const reducedMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [department, setDepartment] = useState('all')
  const [jobType, setJobType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<AdminJobOpening[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [formState, setFormState] = useState<JobFormState>(emptyJobForm())
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void getAdminJobs({
        q: debouncedQuery,
        department,
        jobType,
        status: statusFilter,
      })
        .then((res) => {
          if (!active) return
          setJobs(res.jobs)
          setDepartments(res.departments)
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
  }, [department, jobType, onUnauthorized, debouncedQuery, refreshNonce, statusFilter])

  const openCreateModal = () => {
    setEditingJobId(null)
    setFormState(emptyJobForm())
    setEditorOpen(true)
  }

  const openEditModal = (job: AdminJobOpening) => {
    setEditingJobId(job._id)
    setFormState(jobToForm(job))
    setEditorOpen(true)
  }

  const handleSaveJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const parseLines = (raw: string) =>
      raw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)

    const payload = {
      title: formState.title.trim(),
      department: formState.department.trim(),
      location: formState.location.trim() || 'Hyderabad',
      jobType: formState.jobType,
      experience: formState.experience.trim() || 'Fresher',
      description: formState.description.trim(),
      responsibilities: parseLines(formState.responsibilitiesText),
      requirements: parseLines(formState.requirementsText),
      qualifications: formState.qualifications.trim(),
      vacancies: Math.max(1, Number(formState.vacancies) || 1),
      deadline: formState.deadline || null,
      isActive: formState.isActive,
    }

    if (!payload.title || !payload.department || !payload.description) {
      toast.error('Job title, department, and description are required.')
      return
    }

    setSaving(true)
    try {
      if (editingJobId) {
        await updateAdminJob(editingJobId, payload)
        toast.success('Job opening updated.')
      } else {
        await createAdminJob(payload)
        toast.success('Job opening created and published if active.')
      }
      setEditorOpen(false)
      onChanged()
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (job: AdminJobOpening) => {
    try {
      const updated = await toggleAdminJobStatus(job._id, !job.isActive)
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isActive: updated.isActive } : j,
        ),
      )
      onChanged()
      toast.success(
        `Job opening ${updated.isActive ? 'activated' : 'deactivated'}.`,
      )
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteAdminJob(id)
      setConfirmDeleteId(null)
      onChanged()
      toast.success('Job opening deleted.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <div className="min-w-[210px] flex-1">
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Search Job Openings
            </label>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, department, location..."
                className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs font-medium ${ADMIN_INPUT_BASE}`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Type
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
            >
              <option value="all">All Openings</option>
              <option value="active">Active on Website</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired Deadline</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] to-[#2563eb] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-110"
        >
          <Plus size={15} />
          Add Job Opening
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500 dark:border-white/10 dark:bg-[#0d1c36]">
          <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
          Loading job openings...
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-white/15 dark:bg-[#0d1c36]">
          <BriefcaseBusiness size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
            No job openings match these filters
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Click &ldquo;Add Job Opening&rdquo; to publish a new role directly to the website Careers page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job, idx) => {
            const visibleLive = job.isActive && !job.isExpired
            return (
              <motion.article
                key={job._id}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.28,
                  delay: reducedMotion ? 0 : Math.min(idx * 0.04, 0.24),
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                          visibleLive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : job.isExpired
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {visibleLive
                          ? 'Active (Live on Careers)'
                          : job.isExpired
                            ? 'Expired Deadline'
                            : 'Inactive (Hidden)'}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-sky-300">
                        {job.department} · {job.jobType}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                      <Users size={12} />
                      {job.applicationCount || 0} applicants
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {job.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location}
                    </span>
                    <span>Exp: {job.experience}</span>
                    <span>Vacancies: {job.vacancies || 1}</span>
                    {job.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        Deadline: {job.deadline.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(job)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(job)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                        job.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                      }`}
                    >
                      <Power size={12} />
                      {job.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  {confirmDeleteId === job._id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/15 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={deleting}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(job._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      {/* Add / Edit Job Modal */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditorOpen(false)
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
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#0d1c36]"
            >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0b1f3a] to-[#164e8a] px-6 py-4 text-white">
              <h2 className="text-base font-bold text-white">
                {editingJobId ? 'Edit Job Opening' : 'Add New Job Opening'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close job editor"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveJob}
              className="space-y-4 overflow-y-auto p-6 text-xs"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Job Title *
                  </label>
                  <input
                    required
                    value={formState.title}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, title: e.target.value }))
                    }
                    placeholder="e.g. Full-Stack React & Node Developer"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Department *
                  </label>
                  <input
                    required
                    value={formState.department}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, department: e.target.value }))
                    }
                    placeholder="e.g. Engineering"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Job Type
                  </label>
                  <select
                    value={formState.jobType}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        jobType: e.target.value as AdminJobOpening['jobType'],
                      }))
                    }
                    className={`w-full rounded-xl px-3 py-2 font-semibold ${ADMIN_INPUT_BASE}`}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Location
                  </label>
                  <input
                    value={formState.location}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, location: e.target.value }))
                    }
                    placeholder="Hyderabad"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Experience
                  </label>
                  <input
                    value={formState.experience}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, experience: e.target.value }))
                    }
                    placeholder="e.g. 1–3 Years / Fresher"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                      Vacancies
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formState.vacancies}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          vacancies: Number(e.target.value) || 1,
                        }))
                      }
                      className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formState.deadline}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, deadline: e.target.value }))
                      }
                      className={`w-full rounded-xl px-2 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Describe the role, goals, and team context..."
                  className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Responsibilities (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formState.responsibilitiesText}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        responsibilitiesText: e.target.value,
                      }))
                    }
                    placeholder="Build responsive UI modules&#10;Collaborate on API reviews"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                    Required Skills (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formState.requirementsText}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        requirementsText: e.target.value,
                      }))
                    }
                    placeholder="React & TypeScript&#10;Node.js & MongoDB"
                    className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
                  Qualifications
                </label>
                <input
                  value={formState.qualifications}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      qualifications: e.target.value,
                    }))
                  }
                  placeholder="e.g. B.Tech / MCA or equivalent practical experience"
                  className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
                />
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, isActive: e.target.checked }))
                  }
                  className="rounded text-blue-600"
                />
                Publish immediately on the public Careers page (Active)
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 dark:border-white/15 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingJobId ? 'Save Changes' : 'Publish Role'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
