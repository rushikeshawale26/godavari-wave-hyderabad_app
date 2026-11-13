import { motion, useReducedMotion } from 'motion/react'
import type { AdminOverviewData, LeadStatus } from '../../services/adminApi'
import { useAnimatedCounter } from './useAnimatedCounter'

const STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; stroke: string }
> = {
  new: { label: 'New', color: '#2563eb', stroke: '#2563eb' },
  pending: { label: 'Pending', color: '#f59e0b', stroke: '#f59e0b' },
  contacted: { label: 'Contacted', color: '#0284c7', stroke: '#0284c7' },
  converted: { label: 'Converted', color: '#10b981', stroke: '#10b981' },
  closed: { label: 'Closed', color: '#64748b', stroke: '#64748b' },
}

export function LeadsOverTimeChart({
  data,
}: {
  data: AdminOverviewData['charts']['leadsOverTime']
}) {
  const reducedMotion = useReducedMotion()
  const maxCount = Math.max(1, ...data.map((d) => d.count))
  const width = 620
  const height = 210
  const padX = 24
  const padTop = 18
  const padBottom = 32
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom

  const points = data.map((point, index) => {
    const x =
      data.length > 1
        ? padX + (index / (data.length - 1)) * innerW
        : padX + innerW / 2
    const y = padTop + innerH - (point.count / maxCount) * innerH
    return { ...point, x, y }
  })

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ')

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : ''

  const tickIndices = [0, Math.floor(data.length / 2), Math.max(0, data.length - 1)]

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Leads Received Over Time
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily website enquiries across the last 30 days
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-sky-300">
          Peak: {maxCount} / day
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-52 w-full min-w-[420px]"
          role="img"
          aria-label="30 day leads received line chart"
        >
          <defs>
            <linearGradient id="leadsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + innerH * (1 - ratio)
            return (
              <line
                key={ratio}
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-white/10"
                strokeDasharray="3 3"
              />
            )
          })}

          {areaPath && (
            <motion.path
              d={areaPath}
              fill="url(#leadsAreaGrad)"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.45, delay: 0.1 }}
            />
          )}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0.5 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          )}

          {points.map((pt) => (
            <g key={pt.date}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={pt.count > 0 ? 4 : 2.2}
                fill={pt.count > 0 ? '#1d4ed8' : '#93c5fd'}
                stroke="#ffffff"
                strokeWidth="1.4"
                className="transition-opacity duration-150 hover:opacity-80"
              >
                <title>
                  {pt.date}: {pt.count} {pt.count === 1 ? 'lead' : 'leads'}
                </title>
              </circle>
            </g>
          ))}

          {tickIndices.map((idx) => {
            const pt = points[idx]
            if (!pt) return null
            return (
              <text
                key={pt.date}
                x={pt.x}
                y={height - 10}
                textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                className="fill-slate-500 text-[10px] font-medium dark:fill-slate-400"
              >
                {pt.date.slice(5)}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function StatusDistributionChart({
  data,
}: {
  data: AdminOverviewData['charts']['statusDistribution']
}) {
  const reducedMotion = useReducedMotion()
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const animatedTotal = useAnimatedCounter(total)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const segments = data.reduce<
    {
      status: LeadStatus
      count: number
      fraction: number
      dashLength: number
      offset: number
    }[]
  >((acc, item) => {
    const prevOffset =
      acc.length > 0
        ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength
        : 0
    const fraction = total > 0 ? item.count / total : 0
    const dashLength = fraction * circumference
    acc.push({
      status: item.status,
      count: item.count,
      fraction,
      dashLength,
      offset: prevOffset,
    })
    return acc
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        Lead Status Distribution
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Current pipeline stages across all enquiries
      </p>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              className="text-slate-100 dark:text-white/10"
            />
            {total > 0 &&
              segments.map((seg, idx) =>
                seg.count > 0 ? (
                  <motion.circle
                    key={seg.status}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={STATUS_META[seg.status].stroke}
                    strokeWidth="16"
                    initial={
                      reducedMotion
                        ? false
                        : { strokeDasharray: `0 ${circumference}` }
                    }
                    animate={{
                      strokeDasharray: `${seg.dashLength} ${circumference}`,
                      strokeDashoffset: -seg.offset,
                    }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.6,
                      delay: reducedMotion ? 0 : idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    strokeLinecap="butt"
                  >
                    <title>
                      {STATUS_META[seg.status].label}: {seg.count}
                    </title>
                  </motion.circle>
                ) : null,
              )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {animatedTotal}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Leads
            </span>
          </div>
        </div>

        <div className="grid w-full flex-1 gap-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            return (
              <div
                key={item.status}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/90 px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-slate-100/90 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_META[item.status].color }}
                  />
                  {STATUS_META[item.status].label}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.count}{' '}
                  <span className="font-medium text-slate-400">({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ServiceCategoryChart({
  data,
}: {
  data: AdminOverviewData['charts']['enquiriesByService']
}) {
  const reducedMotion = useReducedMotion()
  const maxVal = Math.max(1, ...data.map((item) => item.count))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        Enquiries by Service Category
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Topics and services visitors enquire about most
      </p>

      {data.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-white/15 dark:text-slate-400">
          No enquiries submitted yet to categorize.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((item, idx) => {
            const pct = Math.max(6, Math.round((item.count / maxVal) * 100))
            return (
              <div key={item.service} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                    {item.service}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#164e8a] via-[#2563eb] to-[#38bdf8]"
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.55,
                      delay: reducedMotion ? 0 : idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MonthlyTrendsChart({
  data,
}: {
  data: AdminOverviewData['charts']['monthlyTrends']
}) {
  const reducedMotion = useReducedMotion()
  const maxVal = Math.max(1, ...data.map((m) => m.total))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Enquiry Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last 6 months total vs converted leads
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
            Enquiries
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Converted
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-6 items-end gap-3 h-44 pt-4">
        {data.map((item, idx) => {
          const totalHeight =
            item.total > 0 ? Math.max(10, Math.round((item.total / maxVal) * 100)) : 4
          const convHeight =
            item.converted > 0
              ? Math.max(8, Math.round((item.converted / maxVal) * 100))
              : 0

          return (
            <div
              key={item.month}
              className="group flex h-full flex-col items-center justify-end gap-1.5"
            >
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <motion.div
                  className="w-4 rounded-t-md bg-gradient-to-t from-blue-700 to-sky-400 transition-opacity duration-150 group-hover:opacity-90"
                  initial={reducedMotion ? false : { height: 0 }}
                  animate={{ height: `${totalHeight}%` }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.5,
                    delay: reducedMotion ? 0 : idx * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  title={`${item.label}: ${item.total} total`}
                />
                {convHeight > 0 && (
                  <motion.div
                    className="w-3 rounded-t-md bg-emerald-500 transition-opacity duration-150 group-hover:opacity-90"
                    initial={reducedMotion ? false : { height: 0 }}
                    animate={{ height: `${convHeight}%` }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.5,
                      delay: reducedMotion ? 0 : idx * 0.04 + 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    title={`${item.label}: ${item.converted} converted`}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white">
                  {item.total}
                </p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {item.label.split(' ')[0]}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EnquirySourcesChart({
  data,
}: {
  data: AdminOverviewData['charts']['enquirySources']
}) {
  const reducedMotion = useReducedMotion()
  const maxVal = Math.max(1, ...data.map((item) => item.count))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        Enquiry Sources
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Recorded lead acquisition channels from submitted enquiries
      </p>

      {data.length === 0 ? (
        <p className="mt-8 text-center text-xs text-slate-400">
          No enquiry source records available yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((item, idx) => {
            const pct = Math.max(8, Math.round((item.count / maxVal) * 100))
            return (
              <div key={item.source} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.source}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8]"
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.55,
                      delay: reducedMotion ? 0 : idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function JobApplicationStatsChart({
  data,
}: {
  data: AdminOverviewData['charts']['jobApplicationStats']
}) {
  const labels: Record<string, string> = {
    new: 'New',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview',
    selected: 'Selected',
    rejected: 'Rejected',
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        Job Application Statistics
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Recruitment funnel stages &amp; most applied roles
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {data.byStatus.map((item) => (
          <div
            key={item.status}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs dark:border-white/10 dark:bg-white/5 dark:hover:border-sky-400/20"
          >
            <p className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
              {item.count}
            </p>
            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
              {labels[item.status] || item.status}
            </p>
          </div>
        ))}
      </div>

      {data.byPosition.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Top Applied Positions
          </p>
          {data.byPosition.map((pos) => (
            <div
              key={pos.position}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                {pos.position}
              </span>
              <span className="ml-2 font-bold tabular-nums text-blue-700 dark:text-sky-300">
                {pos.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WeeklyAndChatbotCharts({
  weekly,
  chatbot,
}: {
  weekly: AdminOverviewData['charts']['weeklyEnquiries']
  chatbot: AdminOverviewData['charts']['chatbotUsage']
}) {
  const reducedMotion = useReducedMotion()
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count))
  const totalQ = chatbot.answeredQuestions + chatbot.unansweredQuestions
  const animatedSessions = useAnimatedCounter(chatbot.totalSessions)
  const animatedResolved = useAnimatedCounter(chatbot.answeredQuestions)
  const animatedUnanswered = useAnimatedCounter(chatbot.unansweredQuestions)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Weekly Enquiry Volume
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Past 8 weeks incoming enquiry counts
        </p>
        <div className="mt-5 grid h-36 grid-cols-8 items-end gap-2">
          {weekly.map((item, idx) => {
            const h =
              item.count > 0
                ? Math.max(10, Math.round((item.count / maxWeekly) * 100))
                : 4
            return (
              <div
                key={item.label}
                className="group flex h-full flex-col items-center justify-end gap-1"
              >
                <motion.div
                  className="w-full max-w-[26px] rounded-t-md bg-gradient-to-t from-[#164e8a] to-[#38bdf8] transition-opacity duration-150 group-hover:opacity-90"
                  initial={reducedMotion ? false : { height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.48,
                    delay: reducedMotion ? 0 : idx * 0.035,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  title={`${item.label}: ${item.count}`}
                />
                <span className="text-[10px] font-bold text-slate-800 dark:text-white">
                  {item.count}
                </span>
                <span className="truncate text-[9px] text-slate-400">
                  {item.label.replace('Wk ', '')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Chatbot Usage &amp; Resolution Report
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Answered vs unanswered / handoff queries across {chatbot.totalSessions}{' '}
          sessions
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5 sm:p-3 dark:bg-white/5">
            <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {animatedSessions}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 sm:text-[10.5px]">
              Sessions
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5 sm:p-3 dark:bg-emerald-500/15">
            <p className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
              {animatedResolved}
            </p>
            <p className="text-[10px] font-semibold text-emerald-700 sm:text-[10.5px] dark:text-emerald-300">
              Resolved
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5 sm:p-3 dark:bg-amber-500/15">
            <p className="text-xl font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
              {animatedUnanswered}
            </p>
            <p className="text-[10px] font-semibold text-amber-700 sm:text-[10.5px] dark:text-amber-300">
              Unanswered
            </p>
          </div>
        </div>
        {totalQ > 0 && (
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-500/30">
            <motion.div
              className="h-full bg-emerald-500"
              initial={reducedMotion ? false : { width: 0 }}
              animate={{
                width: `${Math.round((chatbot.answeredQuestions / totalQ) * 100)}%`,
              }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
