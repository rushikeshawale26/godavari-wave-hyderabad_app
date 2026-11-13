import { useEffect, useState } from 'react'
import { ArrowRight, BriefcaseBusiness } from 'lucide-react'
import JobApplicationForm from '../components/careers/JobApplicationForm'
import JobDetails from '../components/careers/JobDetails'
import JobListings from '../components/careers/JobListings'
import {
  getApiErrorMessage,
  getJobOpenings,
  type JobOpening,
} from '../services/api'

export default function Careers() {
  const [openings, setOpenings] = useState<JobOpening[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null)
  const [applicationPosition, setApplicationPosition] = useState('')
  const [view, setView] = useState<'openings' | 'details' | 'application'>(
    'openings',
  )
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    getJobOpenings()
      .then((jobs) => {
        if (active) setOpenings(jobs)
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (view === 'openings') return

    const targetId =
      view === 'application' ? 'job-application' : 'career-job-details'
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [view])

  const retryOpenings = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  const applyForJob = (job: JobOpening) => {
    setApplicationPosition(job.title)
    setSelectedJob(null)
    setView('application')
  }

  const applyGenerally = () => {
    setApplicationPosition('General application')
    setSelectedJob(null)
    setView('application')
  }

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <section
        aria-labelledby="careers-page-title"
        className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-slate-900/80 dark:text-blue-300">
            <BriefcaseBusiness size={14} aria-hidden="true" />
            Careers at Godavari Wave
          </p>
          <h1
            id="careers-page-title"
            className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"
          >
            Build meaningful work with a team that moves forward.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            Explore current opportunities at Godavari Wave Technologies and find
            a role where you can grow your craft while creating useful digital
            experiences.
          </p>
          <a
            href="#open-positions"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Explore current openings
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section
        aria-label="Career opportunities"
        className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      >
        {view === 'openings' && (
          <JobListings
            openings={openings}
            loading={loading}
            error={error}
            onRetry={retryOpenings}
            onViewDetails={(job) => {
              setSelectedJob(job)
              setView('details')
            }}
            onApply={applyForJob}
            onGeneralApplication={applyGenerally}
          />
        )}
        {view === 'details' && selectedJob && (
          <div
            id="career-job-details"
            className="mx-auto max-w-3xl scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <JobDetails
              job={selectedJob}
              onClose={() => {
                setSelectedJob(null)
                setView('openings')
              }}
              onApply={applyForJob}
            />
          </div>
        )}
        {view === 'application' && (
          <div className="mx-auto max-w-4xl scroll-mt-8">
            <JobApplicationForm
              openings={openings}
              initialPosition={applicationPosition}
              onBack={() => setView('openings')}
            />
          </div>
        )}
      </section>
    </main>
  )
}
