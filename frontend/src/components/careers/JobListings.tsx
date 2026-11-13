import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { JobOpening } from '../../services/api'
import JobCard from './JobCard'

interface JobListingsProps {
  openings: JobOpening[]
  loading: boolean
  error: string
  onRetry: () => void
  onViewDetails: (job: JobOpening) => void
  onApply: (job: JobOpening) => void
  onGeneralApplication: () => void
}

export default function JobListings({
  openings,
  loading,
  error,
  onRetry,
  onViewDetails,
  onApply,
  onGeneralApplication,
}: JobListingsProps) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [jobType, setJobType] = useState('')

  const departments = useMemo(
    () => [...new Set(openings.map((job) => job.department))].sort(),
    [openings],
  )
  const jobTypes = useMemo(
    () => [...new Set(openings.map((job) => job.jobType))].sort(),
    [openings],
  )
  const filteredOpenings = useMemo(() => {
    const query = search.trim().toLowerCase()
    return openings.filter((job) => {
      const matchesSearch =
        !query ||
        [job.title, job.department, job.location, job.description, job.experience]
          .some((value) => value.toLowerCase().includes(query))
      return (
        matchesSearch &&
        (!department || job.department === department) &&
        (!jobType || job.jobType === jobType)
      )
    })
  }, [department, jobType, openings, search])

  return (
    <section id="open-positions">
      <div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="mb-2">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Current openings
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Find your next role
            </h2>
          </div>
          <button
            type="button"
            onClick={onGeneralApplication}
            className="mb-2 inline-flex w-fit items-center justify-center rounded-lg border border-blue-600 px-3.5 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950/50"
          >
            Submit General Application
          </button>
          {!loading && !error && (
            <p className="mb-2 hidden text-sm font-semibold text-slate-500 dark:text-slate-400 lg:block">
              {openings.length} {openings.length === 1 ? 'open position' : 'open positions'}
            </p>
          )}
        </div>

        <div className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px]">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search jobs</span>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, location, or keywords"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label>
            <span className="sr-only">Filter by department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">All departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by job type</span>
            <select
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">All job types</option>
              {jobTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {loading && (
          <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-slate-600 dark:bg-slate-900 dark:text-slate-300" role="status">
            Loading current openings…
          </p>
        )}
        {!loading && error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-red-700 dark:text-red-300" role="alert">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && openings.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No open roles right now</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Please check back later for new opportunities.</p>
          </div>
        )}
        {!loading && !error && openings.length > 0 && filteredOpenings.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            No positions match those search filters. Try changing your search.
          </p>
        )}
        {!loading && !error && filteredOpenings.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filteredOpenings.map((job, index) => (
              <JobCard
                key={job._id}
                job={job}
                index={index}
                onViewDetails={onViewDetails}
                onApply={onApply}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
