import { ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import type { JobOpening } from '../../services/api'

interface JobDetailsProps {
  job: JobOpening
  onClose: () => void
  onApply: (job: JobOpening) => void
}

export default function JobDetails({ job, onClose, onApply }: JobDetailsProps) {
  return (
    <section aria-labelledby="job-details-title">
      <button
        type="button"
        onClick={onClose}
        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      >
        <ArrowLeft size={16} /> Back to current openings
      </button>
      <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        {job.department} · {job.jobType}
      </p>
      <h2 id="job-details-title" className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
        {job.title}
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <MapPin size={16} /> {job.location} <span>·</span> {job.experience}
        {typeof job.vacancies === 'number' && job.vacancies > 0 && (
          <>
            <span>·</span>
            <span>
              {job.vacancies} {job.vacancies === 1 ? 'vacancy' : 'vacancies'}
            </span>
          </>
        )}
        {job.deadline && (
          <>
            <span>·</span>
            <span>Apply by {new Date(job.deadline).toLocaleDateString()}</span>
          </>
        )}
      </p>
      <div className="mt-5">
        <h3 className="font-bold text-slate-900 dark:text-white">About the role</h3>
        <p className="mt-1 whitespace-pre-line leading-6 text-slate-600 dark:text-slate-300">{job.description}</p>
      </div>
      {job.responsibilities && job.responsibilities.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Key responsibilities</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-600 dark:text-slate-300">
            {job.responsibilities.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {job.requirements.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Required skills</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-600 dark:text-slate-300">
            {job.requirements.map((requirement, index) => <li key={`${index}-${requirement}`}>{requirement}</li>)}
          </ul>
        </div>
      )}
      {job.qualifications && (
        <div className="mt-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Qualifications</h3>
          <p className="mt-1 whitespace-pre-line leading-6 text-slate-600 dark:text-slate-300">
            {job.qualifications}
          </p>
        </div>
      )}
        <button
          type="button"
          onClick={() => onApply(job)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          Apply for this role <ArrowRight size={17} />
        </button>
    </section>
  )
}
