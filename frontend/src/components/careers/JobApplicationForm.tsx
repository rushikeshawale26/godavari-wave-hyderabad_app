import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, FileUp, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getApiErrorMessage,
  submitJobApplication,
  type JobOpening,
} from '../../services/api'

interface JobApplicationFormProps {
  openings: JobOpening[]
  initialPosition: string
  onBack: () => void
}

const MAX_RESUME_BYTES = 3 * 1024 * 1024

export default function JobApplicationForm({
  openings,
  initialPosition,
  onBack,
}: JobApplicationFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [resumeFilePayload, setResumeFilePayload] = useState<{
    fileName: string
    mimeType: string
    base64Data: string
  } | null>(null)
  const submissionLock = useRef(false)

  const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setResumeFilePayload(null)
      return
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const lowerName = file.name.toLowerCase()
    if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
      toast.error('Please upload a PDF, DOC, or DOCX resume file.')
      event.target.value = ''
      setResumeFilePayload(null)
      return
    }

    if (file.size > MAX_RESUME_BYTES) {
      toast.error('Resume file must be under 3 MB.')
      event.target.value = ''
      setResumeFilePayload(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setResumeFilePayload({
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          base64Data: reader.result,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionLock.current || submitting) return

    const form = event.currentTarget
    const values = new FormData(form)
    const phone = String(values.get('phone') ?? '').trim()
    const phoneInput = form.querySelector<HTMLInputElement>('[name="phone"]')
    if (phoneInput) {
      const digitCount = phone.replace(/\D/g, '').length
      phoneInput.setCustomValidity(
        digitCount < 7 || digitCount > 15
          ? 'Enter a phone number with 7 to 15 digits.'
          : '',
      )
    }
    if (!form.reportValidity()) return

    submissionLock.current = true
    setSubmitting(true)
    setErrorMessage('')

    try {
      await submitJobApplication({
        fullName: String(values.get('fullName') ?? '').trim(),
        email: String(values.get('email') ?? '').trim(),
        phone,
        position: String(values.get('position') ?? '').trim(),
        experience: String(values.get('experience') ?? '').trim() || 'Fresher',
        education: String(values.get('education') ?? '').trim(),
        address: String(values.get('address') ?? '').trim(),
        resumeUrl: String(values.get('resumeUrl') ?? '').trim(),
        coverLetter: String(values.get('coverLetter') ?? '').trim(),
        ...(resumeFilePayload ? { resumeFile: resumeFilePayload } : {}),
      })
      setSubmitted(true)
      setResumeFilePayload(null)
      form.reset()
      toast.success('Application submitted successfully!')
    } catch (error) {
      const msg = getApiErrorMessage(error)
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      submissionLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <section id="job-application">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      >
        Back to current openings
      </button>
      <div className="mb-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          Job application
        </p>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          Take the next step.
        </h2>
        <p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">
          Submit your details and resume directly to our recruitment team.
        </p>
      </div>

      {submitted ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold">Application received</h3>
              <p className="mt-1 text-sm leading-6 opacity-90">
                Thank you for applying to Godavari Wave Technologies. Your application has been saved for our HR review team.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  onBack()
                }}
                className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                View other openings
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Full name <span className="text-red-500">*</span>
              <input
                name="fullName"
                autoComplete="name"
                required
                maxLength={120}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email <span className="text-red-500">*</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Mobile number <span className="text-red-500">*</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                maxLength={24}
                onInput={(event) => event.currentTarget.setCustomValidity('')}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Position <span className="text-red-500">*</span>
              {openings.length > 0 ? (
                <select
                  name="position"
                  key={initialPosition}
                  defaultValue={initialPosition}
                  required
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select a position</option>
                  <option value="General application">General application</option>
                  {openings.map((opening) => (
                    <option key={opening._id} value={opening.title}>
                      {opening.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="position"
                  key={initialPosition}
                  defaultValue={initialPosition}
                  required
                  maxLength={160}
                  placeholder="Position you’re interested in"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              )}
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Experience
              <input
                name="experience"
                maxLength={120}
                placeholder="e.g. Fresher or 2 years"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Education / qualification <span className="text-red-500">*</span>
              <input
                name="education"
                autoComplete="off"
                maxLength={200}
                required
                placeholder="e.g. B.Tech in Computer Science"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
              Current address <span className="text-red-500">*</span>
              <textarea
                name="address"
                autoComplete="street-address"
                rows={2}
                maxLength={500}
                required
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Upload Resume (PDF, DOC, DOCX · max 3 MB)
              <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <FileUp size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeFileChange}
                  className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300"
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Or Resume / Portfolio Link
              <input
                name="resumeUrl"
                type="url"
                maxLength={400}
                placeholder="https://drive.google.com/..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
              Cover note (optional)
              <textarea
                name="coverLetter"
                rows={3}
                maxLength={1500}
                placeholder="Briefly share your key skills, projects, or availability..."
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-blue-500"
          >
            {submitting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      )}
    </section>
  )
}
