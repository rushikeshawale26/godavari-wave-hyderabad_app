import { useCallback, useEffect, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Globe,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareHeart,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import BrandLogo from '../components/BrandLogo'
import ThemeToggle from '../components/ThemeToggle'
import AdminLogin from '../components/admin/AdminLogin'
import { ADMIN_INPUT_BASE } from '../components/admin/adminInputStyles'
import { useAnimatedCounter } from '../components/admin/useAnimatedCounter'
import {
  EnquirySourcesChart,
  JobApplicationStatsChart,
  LeadsOverTimeChart,
  MonthlyTrendsChart,
  ServiceCategoryChart,
  StatusDistributionChart,
  WeeklyAndChatbotCharts,
} from '../components/admin/AdminCharts'
import ApplicationsSection from '../components/admin/ApplicationsSection'
import CareersSection from '../components/admin/CareersSection'
import ChatbotSection from '../components/admin/ChatbotSection'
import {
  AdminContentSection,
  AdminFeedbackSection,
} from '../components/admin/ContentAndFeedbackSection'
import LeadDetailModal from '../components/admin/LeadDetailModal'
import {
  AdminNotificationsSection,
  AdminSettingsSection,
} from '../components/admin/NotificationsAndSettings'
import {
  exportAdminApplicationsCsv,
  exportAdminLeadsCsv,
  getAdminErrorMessage,
  getAdminLeadDetail,
  getAdminLeads,
  getAdminOverview,
  getAdminSession,
  isAdminUnauthorizedError,
  LEAD_STATUS_BADGES,
  logoutAdmin,
  triggerBlobDownload,
  updateAdminLead,
  type AdminLead,
  type AdminOverviewData,
  type AdminUser,
  type LeadPriority,
  type LeadStatus,
} from '../services/adminApi'

type AdminSection =
  | 'overview'
  | 'leads'
  | 'enquiries'
  | 'chatbot'
  | 'careers'
  | 'applications'
  | 'feedback'
  | 'content'
  | 'analytics'
  | 'notifications'
  | 'settings'

const SIDEBAR_ITEMS: {
  id: AdminSection
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads Management', icon: Users },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
  { id: 'chatbot', label: 'Chatbot Conversations', icon: Bot },
  { id: 'careers', label: 'Careers & Job Openings', icon: BriefcaseBusiness },
  { id: 'applications', label: 'Job Applications', icon: UserCheck },
  { id: 'feedback', label: 'Feedback & Reviews', icon: MessageSquareHeart },
  { id: 'content', label: 'Website Content', icon: Globe },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Admin Settings', icon: Settings },
]

const PRIORITY_BADGES: Record<LeadPriority, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30',
  medium:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-sky-300 dark:border-blue-400/30',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15',
}

export default function AdminLeadsPage() {
  const reducedMotion = useReducedMotion()
  const [authChecking, setAuthChecking] = useState(true)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)

  // Overview state
  const [overview, setOverview] = useState<AdminOverviewData | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  // Leads & Enquiries state
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [leadsTotal, setLeadsTotal] = useState(0)
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsTotalPages, setLeadsTotalPages] = useState(1)
  const [availableServices, setAvailableServices] = useState<string[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'followup'>(
    'latest',
  )
  const [exportingCsv, setExportingCsv] = useState(false)

  // Selected lead detail modal
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null)

  const handleUnauthorized = useCallback(() => {
    setAdminUser(null)
    setExpiresAt(null)
    setOverview(null)
    setLeads([])
    setSelectedLead(null)
    setSessionNotice(
      'Your admin session expired or was signed out. Please sign in again.',
    )
  }, [])

  // Validate session on mount / refresh
  useEffect(() => {
    let active = true
    void getAdminSession()
      .then((res) => {
        if (!active) return
        setAdminUser(res.admin)
        setExpiresAt(res.expiresAt)
        setSessionNotice(null)
      })
      .catch(() => {
        if (!active) return
        setAdminUser(null)
      })
      .finally(() => {
        if (active) setAuthChecking(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Handle browser back / forward navigation and bfcache restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setAuthChecking(true)
        void getAdminSession()
          .then((res) => {
            setAdminUser(res.admin)
            setExpiresAt(res.expiresAt)
            setSessionNotice(null)
          })
          .catch(() => {
            setAdminUser(null)
            setExpiresAt(null)
            setOverview(null)
            setLeads([])
            setSelectedLead(null)
            setSessionNotice(
              'Your admin session expired or was signed out. Please sign in again.',
            )
          })
          .finally(() => {
            setAuthChecking(false)
          })
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  const effectiveStatusFilter =
    activeSection === 'enquiries' && statusFilter === 'all'
      ? 'new'
      : statusFilter

  // Fetch Overview metrics & charts
  useEffect(() => {
    if (!adminUser) return
    let active = true
    const timer = window.setTimeout(() => {
      setOverviewLoading(true)
      setOverviewError(null)
      void getAdminOverview()
        .then((data) => {
          if (active) setOverview(data)
        })
        .catch((err) => {
          if (!active) return
          if (isAdminUnauthorizedError(err)) {
            handleUnauthorized()
            return
          }
          setOverviewError(getAdminErrorMessage(err))
        })
        .finally(() => {
          if (active) setOverviewLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [adminUser, handleUnauthorized, refreshNonce])

  // Fetch Leads & Enquiries list
  useEffect(() => {
    if (!adminUser) return
    if (activeSection !== 'leads' && activeSection !== 'enquiries') return

    let active = true
    const timer = window.setTimeout(() => {
      setLeadsLoading(true)
      setLeadsError(null)
      void getAdminLeads({
        q: debouncedSearchQuery,
        status: effectiveStatusFilter,
        service: serviceFilter,
        priority: priorityFilter,
        dateFrom,
        dateTo,
        sort: sortOrder,
        page: leadsPage,
        limit: 20,
      })
        .then((data) => {
          if (!active) return
          setLeads(data.leads)
          setLeadsTotal(data.total)
          setLeadsTotalPages(data.totalPages)
          setAvailableServices(data.services)
        })
        .catch((err) => {
          if (!active) return
          if (isAdminUnauthorizedError(err)) {
            handleUnauthorized()
            return
          }
          setLeadsError(getAdminErrorMessage(err))
        })
        .finally(() => {
          if (active) setLeadsLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [
    activeSection,
    adminUser,
    dateFrom,
    dateTo,
    effectiveStatusFilter,
    handleUnauthorized,
    leadsPage,
    priorityFilter,
    refreshNonce,
    debouncedSearchQuery,
    serviceFilter,
    sortOrder,
  ])

  const handleLogout = async () => {
    try {
      await logoutAdmin()
    } catch {
      // Clear local session regardless
    }
    setAdminUser(null)
    setExpiresAt(null)
    setOverview(null)
    setLeads([])
    setSelectedLead(null)
    setSessionNotice('You have signed out cleanly.')
  }

  const handleSectionSelect = (section: AdminSection) => {
    setActiveSection(section)
    setSidebarOpen(false)
    setNotificationsOpen(false)
    if (section === 'enquiries') {
      setStatusFilter('all')
      setLeadsPage(1)
    } else if (section === 'leads') {
      setLeadsPage(1)
    }
  }

  const handleQuickStatusChange = async (
    leadId: string,
    nextStatus: LeadStatus,
  ) => {
    try {
      const updated = await updateAdminLead(leadId, { status: nextStatus })
      setLeads((prev) =>
        prev.map((item) => (item._id === leadId ? updated : item)),
      )
      setRefreshNonce((n) => n + 1)
      toast.success(`Status updated to ${nextStatus}.`)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        handleUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleTogglePriority = async (lead: AdminLead) => {
    const nextPriority: LeadPriority =
      lead.priority === 'high' ? 'medium' : 'high'
    try {
      const updated = await updateAdminLead(lead._id, {
        priority: nextPriority,
        isPriority: nextPriority === 'high',
      })
      setLeads((prev) =>
        prev.map((item) => (item._id === lead._id ? updated : item)),
      )
      setRefreshNonce((n) => n + 1)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        handleUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleExportLeadsCsv = async () => {
    if (exportingCsv) return
    setExportingCsv(true)
    try {
      const blob = await exportAdminLeadsCsv({
        q: searchQuery,
        status: effectiveStatusFilter,
        service: serviceFilter,
        priority: priorityFilter,
        dateFrom,
        dateTo,
        sort: sortOrder,
      })
      triggerBlobDownload(
        blob,
        `godavari-wave-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      toast.success('Filtered leads exported to CSV.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        handleUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setExportingCsv(false)
    }
  }

  const handleExportApplicationsReport = async () => {
    try {
      const blob = await exportAdminApplicationsCsv({})
      triggerBlobDownload(
        blob,
        `godavari-wave-applications-report-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      toast.success('Applications report exported.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        handleUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleOpenLeadById = async (leadId: string) => {
    try {
      const detail = await getAdminLeadDetail(leadId)
      setSelectedLead(detail)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        handleUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07162c] text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-sky-300/20 bg-white/10 px-6 py-4 backdrop-blur-md">
          <LoaderCircle size={20} className="animate-spin text-sky-300" />
          <span className="text-sm font-semibold">
            Verifying administrator session...
          </span>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return (
      <AdminLogin
        sessionNotice={sessionNotice}
        onAuthenticated={({ admin, expiresAt: exp }) => {
          setAdminUser(admin)
          setExpiresAt(exp)
          setSessionNotice(null)
          setRefreshNonce((n) => n + 1)
          toast.success(`Welcome back, ${admin.username}.`)
        }}
      />
    )
  }

  const summary = overview?.summary
  const alertCount =
    (summary?.newEnquiries || 0) +
    (summary?.newApplications || 0) +
    (summary?.followUpsDue || 0)

  const currentSectionTitle =
    SIDEBAR_ITEMS.find((item) => item.id === activeSection)?.label || 'Overview'

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
      className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070f20] dark:text-slate-100"
    >
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Collapsible Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sky-300/15 bg-gradient-to-b from-[#081931] via-[#0b2345] to-[#08172e] text-white transition-[width,transform] duration-250 ease-out lg:static lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <div className="inline-flex rounded-lg bg-white/95 px-2.5 py-1 shadow-xs [&_img]:h-auto [&_img]:w-36">
                <BrandLogo />
              </div>
              <p className="mt-2 text-[10.5px] font-bold uppercase tracking-wider text-sky-300">
                Admin Management
              </p>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-extrabold text-white">
              GW
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-sky-200 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3"
          aria-label="Admin sidebar"
        >
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.id
            const badgeCount =
              item.id === 'enquiries'
                ? summary?.newEnquiries || 0
                : item.id === 'applications'
                  ? summary?.newApplications || 0
                  : item.id === 'notifications'
                    ? alertCount
                    : 0

            return (
              <button
                key={item.id}
                type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => handleSectionSelect(item.id)}
                className={`relative flex w-full items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                } gap-2.5 rounded-xl py-2.5 text-left text-xs font-semibold transition-all duration-150 active:scale-[0.99] ${
                  active
                    ? 'text-white'
                    : 'text-sky-100/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={reducedMotion ? undefined : 'admin-sidebar-active'}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 shadow-md shadow-blue-950/35"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </span>
                {!sidebarCollapsed && badgeCount > 0 && (
                  <span className="relative z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 transition-transform duration-150">
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-3">
          {!sidebarCollapsed && (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-sky-300/20 bg-white/5 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/10"
            >
              <span>Public Website</span>
              <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex w-full items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            } rounded-xl bg-rose-500/20 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-600 hover:text-white`}
          >
            <LogOut size={15} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-[#0b172e]/95">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 lg:hidden dark:border-white/15 dark:bg-white/10 dark:text-white"
              aria-label="Open sidebar menu"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:inline-flex dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-lg dark:text-white">
                {currentSectionTitle}
              </h1>
              <p className="hidden text-[11px] text-slate-500 sm:block dark:text-slate-400">
                Godavari Wave Technologies Pvt. Ltd. · Admin Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setRefreshNonce((n) => n + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              title="Refresh dashboard data"
            >
              <RefreshCw
                size={14}
                className={overviewLoading || leadsLoading ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {alertCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/15 dark:bg-[#0d1c36]"
                  >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Actionable Alerts
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSectionSelect('notifications')}
                      className="text-[11px] font-bold text-blue-600 hover:underline dark:text-sky-300"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSectionSelect('enquiries')}
                      className="flex w-full items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-left font-semibold text-blue-800 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-sky-200"
                    >
                      <span>New enquiries</span>
                      <span className="font-extrabold">
                        {summary?.newEnquiries || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSectionSelect('applications')}
                      className="flex w-full items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200"
                    >
                      <span>New job applications</span>
                      <span className="font-extrabold">
                        {summary?.newApplications || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('followup')
                        handleSectionSelect('leads')
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-left font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200"
                    >
                      <span>Follow-ups due</span>
                      <span className="font-extrabold">
                        {summary?.followUpsDue || 0}
                      </span>
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex dark:border-white/15 dark:bg-white/10">
              <ShieldCheck size={14} className="text-blue-600 dark:text-sky-400" />
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  @{adminUser.username}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {adminUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 dark:bg-white/15 dark:hover:bg-rose-600"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6">
          {overviewError && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200">
              <AlertCircle size={16} />
              <span>{overviewError}</span>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
            >
          {/* ================= 1. OVERVIEW ================= */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {overviewLoading && !overview ? (
                <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                  <LoaderCircle size={22} className="mr-2 animate-spin text-blue-600" />
                  Loading live database analytics...
                </div>
              ) : (
                overview && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <SummaryCard
                        index={0}
                        label="Total Leads"
                        value={overview.summary.totalLeads}
                        note={`${overview.summary.priorityLeads} high priority · ${overview.summary.conversionRate}% converted`}
                        icon={Users}
                        accent="blue"
                      />
                      <SummaryCard
                        index={1}
                        label="New Enquiries"
                        value={overview.summary.newEnquiries}
                        note="Awaiting initial response"
                        icon={Inbox}
                        accent="indigo"
                      />
                      <SummaryCard
                        index={2}
                        label="Pending Leads"
                        value={overview.summary.pendingEnquiries}
                        note={`${overview.summary.followUpsDue} follow-ups due`}
                        icon={Clock3}
                        accent="amber"
                      />
                      <SummaryCard
                        index={3}
                        label="Contacted Leads"
                        value={overview.summary.contactedLeads}
                        note="Active discussions"
                        icon={PhoneCall}
                        accent="sky"
                      />
                      <SummaryCard
                        index={4}
                        label="Converted Leads"
                        value={overview.summary.convertedLeads}
                        note={`${overview.summary.closedLeads} closed`}
                        icon={CheckCircle2}
                        accent="emerald"
                      />
                      <SummaryCard
                        index={5}
                        label="Total Job Applications"
                        value={overview.summary.totalJobApplications}
                        note={`${overview.summary.newApplications} new awaiting review`}
                        icon={UserCheck}
                        accent="cyan"
                      />
                      <SummaryCard
                        index={6}
                        label="Active Job Openings"
                        value={overview.summary.activeJobOpenings}
                        note={`${overview.summary.totalJobOpenings} total openings in DB`}
                        icon={BriefcaseBusiness}
                        accent="indigo"
                      />
                      <SummaryCard
                        index={7}
                        label="Website Visitors"
                        value={overview.summary.totalWebsiteVisitors}
                        note={
                          overview.summary.visitorTrackingEnabled
                            ? `${overview.summary.visitorPeriodDays}-day active tracking`
                            : 'Production visitor tracking inactive in dev'
                        }
                        icon={TrendingUp}
                        accent="blue"
                      />
                      <SummaryCard
                        index={8}
                        label="Chatbot Conversations"
                        value={overview.summary.totalChatbotConversations}
                        note={`${overview.summary.totalChatbotQuestions} questions (${overview.summary.unansweredChatbotQuestions} unanswered)`}
                        icon={Bot}
                        accent="violet"
                      />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <LeadsOverTimeChart data={overview.charts.leadsOverTime} />
                      </div>
                      <div className="lg:col-span-5">
                        <StatusDistributionChart
                          data={overview.charts.statusDistribution}
                        />
                      </div>
                      <div className="lg:col-span-6">
                        <MonthlyTrendsChart data={overview.charts.monthlyTrends} />
                      </div>
                      <div className="lg:col-span-6">
                        <EnquirySourcesChart data={overview.charts.enquirySources} />
                      </div>
                    </div>

                    <JobApplicationStatsChart
                      data={overview.charts.jobApplicationStats}
                    />

                    {/* Recent Activity */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Activity
                            size={17}
                            className="text-blue-600 dark:text-sky-400"
                          />
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            Recent Activity
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSectionSelect('leads')}
                          className="text-xs font-bold text-blue-600 hover:underline dark:text-sky-300"
                        >
                          Manage all leads &rarr;
                        </button>
                      </div>

                      {overview.recentActivity.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">
                          No enquiries, applications, or chatbot conversations recorded yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/10">
                          {overview.recentActivity.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {item.title}
                                </p>
                                <p className="truncate text-slate-500 dark:text-slate-400">
                                  {item.subtitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                  {item.status}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(item.timestamp).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </span>
                                {item.leadId && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLeadById(item.leadId!)}
                                    className="font-bold text-blue-600 hover:underline dark:text-sky-300"
                                  >
                                    Inspect
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ================= 2 & 3. LEADS & ENQUIRIES ================= */}
          {(activeSection === 'leads' || activeSection === 'enquiries') && (
            <div className="space-y-5">
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative min-w-[230px] flex-1">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value)
                        setLeadsPage(1)
                      }}
                      placeholder="Search by customer name, email, phone, company, service, or message..."
                      className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs font-medium ${ADMIN_INPUT_BASE}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExportLeadsCsv}
                    disabled={exportingCsv || leadsTotal === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] to-[#2563eb] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-110 disabled:opacity-50"
                  >
                    {exportingCsv ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Export Filtered CSV
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </label>
                    <select
                      value={effectiveStatusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value)
                        setLeadsPage(1)
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(event) => {
                        setPriorityFilter(event.target.value)
                        setLeadsPage(1)
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Service
                    </label>
                    <select
                      value={serviceFilter}
                      onChange={(event) => {
                        setServiceFilter(event.target.value)
                        setLeadsPage(1)
                      }}
                      className={`max-w-[190px] rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
                    >
                      <option value="all">All Services</option>
                      {availableServices.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
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
                      onChange={(event) => {
                        setDateFrom(event.target.value)
                        setLeadsPage(1)
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
                      onChange={(event) => {
                        setDateTo(event.target.value)
                        setLeadsPage(1)
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
                      onChange={(event) =>
                        setSortOrder(
                          event.target.value as 'latest' | 'oldest' | 'followup',
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${ADMIN_INPUT_BASE}`}
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="followup">Follow-up Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {leadsError && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200">
                  {leadsError}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 text-xs dark:border-white/10">
                  <span className="font-bold text-slate-800 dark:text-white">
                    {activeSection === 'enquiries'
                      ? 'Incoming Enquiries'
                      : 'All Website Leads'}{' '}
                    ({leadsTotal})
                  </span>
                  <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
                    Click Details to manage priority, notes, and follow-up dates
                  </span>
                </div>

                {leadsLoading ? (
                  <div className="flex items-center justify-center py-14 text-sm text-slate-500">
                    <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
                    Loading leads...
                  </div>
                ) : leads.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Inbox size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No matching leads found
                    </p>
                  </div>
                ) : (
                  <div className="admin-animate-fade overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Service &amp; Message</th>
                          <th className="px-4 py-3">Priority / Owner</th>
                          <th className="px-4 py-3">Submitted</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                        {leads.map((lead) => (
                          <tr
                            key={lead._id}
                            className="transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-white/[0.06]"
                          >
                            <td className="px-4 py-3.5 align-top">
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePriority(lead)}
                                  title="Toggle High Priority"
                                  className="mt-0.5 text-slate-300 transition hover:text-amber-500 dark:text-slate-600"
                                >
                                  <Star
                                    size={15}
                                    className={
                                      lead.priority === 'high'
                                        ? 'fill-amber-400 text-amber-400'
                                        : ''
                                    }
                                  />
                                </button>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {lead.name}
                                  </p>
                                  <p className="text-[11px] text-blue-700 dark:text-sky-300">
                                    {lead.email}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {lead.phone}
                                    {lead.company ? ` · ${lead.company}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="max-w-xs px-4 py-3.5 align-top">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {lead.subject}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300">
                                {lead.message}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 align-top text-[11px]">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                                  PRIORITY_BADGES[lead.priority || 'medium']
                                }`}
                              >
                                {lead.priority || 'medium'}
                              </span>
                              <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                {lead.assignedTo || 'Unassigned'}
                              </p>
                              {lead.followUpDate && (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                  <CalendarClock size={12} />
                                  {lead.followUpDate.slice(0, 10)}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 align-top text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(lead.createdAt).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td className="px-4 py-3.5 align-top">
                              <select
                                value={lead.status}
                                onChange={(event) =>
                                  handleQuickStatusChange(
                                    lead._id,
                                    event.target.value as LeadStatus,
                                  )
                                }
                                aria-label={`Lead status for ${lead.name}`}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize focus:outline-none ${LEAD_STATUS_BADGES[lead.status]}`}
                              >
                                <option value="new">New</option>
                                <option value="pending">Pending</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                                <option value="closed">Closed</option>
                              </select>
                            </td>
                            <td className="px-4 py-3.5 text-right align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedLead(lead)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-sky-300"
                              >
                                <Eye size={13} />
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {leadsTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">
                      Page {leadsPage} of {leadsTotalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={leadsPage <= 1}
                        onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40 dark:border-white/15"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={leadsPage >= leadsTotalPages}
                        onClick={() =>
                          setLeadsPage((p) => Math.min(leadsTotalPages, p + 1))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40 dark:border-white/15"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 4. CHATBOT CONVERSATIONS ================= */}
          {activeSection === 'chatbot' && (
            <ChatbotSection
              onUnauthorized={handleUnauthorized}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 5. CAREERS & JOB OPENINGS ================= */}
          {activeSection === 'careers' && (
            <CareersSection
              onUnauthorized={handleUnauthorized}
              onChanged={() => setRefreshNonce((n) => n + 1)}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 6. JOB APPLICATIONS ================= */}
          {activeSection === 'applications' && (
            <ApplicationsSection
              onUnauthorized={handleUnauthorized}
              onChanged={() => setRefreshNonce((n) => n + 1)}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 7. FEEDBACK & REVIEWS ================= */}
          {activeSection === 'feedback' && (
            <AdminFeedbackSection
              onUnauthorized={handleUnauthorized}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 8. WEBSITE CONTENT ================= */}
          {activeSection === 'content' && (
            <AdminContentSection
              onUnauthorized={handleUnauthorized}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 9. ANALYTICS & REPORTS ================= */}
          {activeSection === 'analytics' && overview && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Operational Reports &amp; Export
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Overall conversion rate: {overview.summary.conversionRate}% ·{' '}
                    {overview.summary.totalWebsiteVisitors} tracked visitors
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportLeadsCsv}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <FileSpreadsheet size={14} />
                    Export Leads CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportApplicationsReport}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white"
                  >
                    <Download size={14} />
                    Export Applications CSV
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <LeadsOverTimeChart data={overview.charts.leadsOverTime} />
                </div>
                <div className="lg:col-span-5">
                  <StatusDistributionChart
                    data={overview.charts.statusDistribution}
                  />
                </div>
                <div className="lg:col-span-6">
                  <ServiceCategoryChart data={overview.charts.enquiriesByService} />
                </div>
                <div className="lg:col-span-6">
                  <MonthlyTrendsChart data={overview.charts.monthlyTrends} />
                </div>
              </div>

              <WeeklyAndChatbotCharts
                weekly={overview.charts.weeklyEnquiries}
                chatbot={overview.charts.chatbotUsage}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <EnquirySourcesChart data={overview.charts.enquirySources} />
                <JobApplicationStatsChart
                  data={overview.charts.jobApplicationStats}
                />
              </div>
            </div>
          )}

          {/* ================= 10. NOTIFICATIONS ================= */}
          {activeSection === 'notifications' && (
            <AdminNotificationsSection
              onUnauthorized={handleUnauthorized}
              onNavigateSection={(sec) => handleSectionSelect(sec)}
              onInspectLead={handleOpenLeadById}
              refreshNonce={refreshNonce}
            />
          )}

          {/* ================= 11. ADMIN SETTINGS & RBAC ================= */}
          {activeSection === 'settings' && (
            <AdminSettingsSection
              adminUser={adminUser}
              expiresAt={expiresAt}
              onUnauthorized={handleUnauthorized}
              refreshNonce={refreshNonce}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Lead Inspector Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            key={selectedLead._id}
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onLeadUpdated={(updated) => {
              setSelectedLead(updated)
              setLeads((prev) =>
                prev.map((item) => (item._id === updated._id ? updated : item)),
              )
              setRefreshNonce((n) => n + 1)
            }}
            onLeadDeleted={(deletedId) => {
              setLeads((prev) => prev.filter((item) => item._id !== deletedId))
              setRefreshNonce((n) => n + 1)
            }}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SummaryCard({
  index = 0,
  label,
  value,
  note,
  icon: Icon,
  accent,
}: {
  index?: number
  label: string
  value: number
  note: string
  icon: typeof Users
  accent: 'blue' | 'indigo' | 'amber' | 'sky' | 'emerald' | 'cyan' | 'violet'
}) {
  const reducedMotion = useReducedMotion()
  const animatedValue = useAnimatedCounter(value)
  const accentStyles: Record<typeof accent, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-sky-300',
    indigo:
      'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    emerald:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    violet:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.24,
        delay: reducedMotion ? 0 : Math.min(index * 0.035, 0.28),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/90 hover:shadow-md active:scale-[0.985] dark:border-white/10 dark:bg-[#0d1c36] dark:hover:border-sky-400/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 transition-colors dark:text-white">
            {animatedValue.toLocaleString()}
          </p>
        </div>
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${accentStyles[accent]}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {note}
      </p>
    </motion.div>
  )
}
