import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { JobOpening } from '../../services/api'

interface JobCardProps {
  job: JobOpening
  index?: number
  onViewDetails: (job: JobOpening) => void
  onApply: (job: JobOpening) => void
}

export default function JobCard({
  job,
  index = 0,
  onViewDetails,
  onApply,
}: JobCardProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.34,
        delay: reducedMotion ? 0 : Math.min(index * 0.045, 0.25),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={reducedMotion ? undefined : { scale: 0.99 }}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <BriefcaseBusiness size={19} />
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {job.jobType}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{job.title}</h3>
      <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">{job.department}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{job.location}</span>
        <span>{job.experience}</span>
        {typeof job.vacancies === 'number' && job.vacancies > 0 && (
          <span>
            {job.vacancies} {job.vacancies === 1 ? 'opening' : 'openings'}
          </span>
        )}
        {job.deadline && (
          <span>
            Apply by {new Date(job.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-3 leading-5 text-slate-600 dark:text-slate-300">
        {job.description}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button
          type="button"
          onClick={() => onViewDetails(job)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-700 transition-all duration-150 hover:border-blue-500 hover:text-blue-700 active:scale-[0.97] dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
        >
          View details
        </button>
        <button
          type="button"
          onClick={() => onApply(job)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white transition-all duration-150 hover:bg-blue-700 active:scale-[0.97] dark:hover:bg-blue-500"
        >
          Apply Now <ArrowRight size={16} />
        </button>
      </div>
    </motion.article>
  )
}
