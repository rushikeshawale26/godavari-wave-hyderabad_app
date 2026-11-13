import axios from 'axios'

const adminHttp = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
})

export type LeadStatus =
  | 'new'
  | 'pending'
  | 'contacted'
  | 'converted'
  | 'closed'

export type LeadPriority = 'high' | 'medium' | 'low'

export type ApplicationStatus =
  | 'new'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'

export type AdminRole = 'admin' | 'super_admin' | 'hr_manager' | 'sales_manager'

export const LEAD_STATUS_BADGES: Record<LeadStatus, string> = {
  new: 'border-blue-300/70 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-sky-300',
  pending:
    'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300',
  contacted:
    'border-sky-300/70 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300',
  converted:
    'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  closed:
    'border-slate-300/70 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-300',
}

export const APPLICATION_STATUS_BADGES: Record<ApplicationStatus, string> = {
  new: 'border-blue-300/70 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-sky-300',
  shortlisted:
    'border-indigo-300/70 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-300',
  interview_scheduled:
    'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300',
  selected:
    'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected:
    'border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300',
}

export interface AdminUser {
  _id: string
  username: string
  role: AdminRole
  permissions: string[]
  isActive: boolean
  createdAt: string | null
}

export interface LeadNote {
  _id?: string
  text: string
  addedBy: string
  createdAt: string
}

export interface AdminLead {
  _id: string
  name: string
  email: string
  phone: string
  company: string
  subject: string
  message: string
  status: LeadStatus
  priority: LeadPriority
  isPriority: boolean
  source?: string
  assignedTo: string
  followUpDate: string | null
  followUpNote: string
  notes: LeadNote[]
  createdAt: string
  updatedAt: string
}

export interface AdminJobOpening {
  _id: string
  title: string
  department: string
  location: string
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
  experience: string
  description: string
  responsibilities: string[]
  requirements: string[]
  qualifications: string
  vacancies: number
  deadline: string | null
  isActive: boolean
  isExpired?: boolean
  applicationCount?: number
  createdAt: string
  updatedAt: string
}

export interface AdminJobApplication {
  _id: string
  fullName: string
  email: string
  phone: string
  position: string
  experience: string
  education: string
  address: string
  resumeUrl: string
  resumeFileName: string
  hasResumeFile: boolean
  coverLetter: string
  status: ApplicationStatus
  interviewDate: string | null
  notes: LeadNote[]
  createdAt: string
}

export interface FeedbackItem {
  _id: string
  customerName: string
  email: string
  serviceRelated: string
  comment: string
  rating: number | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface SiteContentData {
  hero: {
    eyebrow: string
    subtitle: string
  }
  branches: {
    id: string
    name: string
    region: string
    description: string
    address: string
  }[]
  servicesOverrides: {
    id: string
    title: string
    description: string
  }[]
  projectsOverrides: {
    id: string
    category: string
    title: string
    problem: string
    description: string
  }[]
}

export interface AdminActivityLog {
  _id: string
  actorUsername: string
  action: string
  targetType: string
  targetId: string
  summary: string
  createdAt: string
}

export interface AdminOverviewData {
  summary: {
    totalLeads: number
    newEnquiries: number
    pendingEnquiries: number
    contactedLeads: number
    convertedLeads: number
    closedLeads: number
    priorityLeads: number
    followUpsDue: number
    conversionRate: number
    totalJobApplications: number
    newApplications: number
    activeJobOpenings: number
    totalJobOpenings: number
    totalWebsiteVisitors: number
    visitorPeriodDays: number
    visitorTrackingEnabled: boolean
    totalChatbotConversations: number
    totalChatbotQuestions: number
    unansweredChatbotQuestions: number
  }
  charts: {
    leadsOverTime: { date: string; count: number }[]
    weeklyEnquiries: { label: string; count: number }[]
    monthlyTrends: {
      month: string
      label: string
      total: number
      converted: number
    }[]
    enquiriesByService: { service: string; count: number }[]
    enquirySources: { source: string; count: number }[]
    statusDistribution: { status: LeadStatus; count: number }[]
    jobApplicationStats: {
      byStatus: { status: ApplicationStatus; count: number }[]
      byPosition: { position: string; count: number }[]
    }
    chatbotUsage: {
      answeredQuestions: number
      unansweredQuestions: number
      totalSessions: number
    }
  }
  recentActivity: {
    id: string
    type: 'lead' | 'chatbot' | 'career'
    leadId?: string
    conversationId?: string
    title: string
    subtitle: string
    status: string
    timestamp: string
  }[]
}

export interface AdminNotificationsData {
  newLeads: {
    _id: string
    name: string
    subject: string
    company: string
    createdAt: string
    status: string
  }[]
  pendingLeads: {
    _id: string
    name: string
    subject: string
    createdAt: string
    status: string
  }[]
  followUpReminders: {
    _id: string
    name: string
    subject: string
    followUpDate: string
    followUpNote: string
    assignedTo: string
    status: string
  }[]
  newApplications: {
    _id: string
    fullName: string
    position: string
    email: string
    createdAt: string
    status: string
  }[]
  adminActivity: AdminActivityLog[]
}

export interface LeadsFilterParams {
  q?: string
  status?: string
  service?: string
  priority?: string | boolean
  dateFrom?: string
  dateTo?: string
  sort?: 'latest' | 'oldest' | 'followup'
  page?: number
  limit?: number
}

export interface ChatTurnRecord {
  _id?: string
  role: 'user' | 'assistant'
  content: string
  source?: 'ai' | 'fallback'
  isFallback?: boolean
  needsHumanSupport?: boolean
  failedOrUnanswered?: boolean
  createdAt: string
}

export interface ChatConversationRecord {
  _id: string
  sessionId: string
  messages: ChatTurnRecord[]
  userQuestionsCount: number
  unansweredCount: number
  lastQuestion: string
  lastReply: string
  lastMessageAt: string
  createdAt: string
}

export interface FrequentQuestionItem {
  question: string
  count: number
  lastAskedAt: string
}

export interface UnansweredQuestionItem {
  conversationId: string
  sessionId: string
  question: string
  response: string
  source: 'ai' | 'fallback'
  createdAt: string
}

export const isAdminUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401

export const getAdminErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.'
    }
    if (!error.response) {
      return 'Unable to reach the server. Please verify the backend is running.'
    }
  }
  return 'An unexpected error occurred.'
}

export const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export const getAdminSession = async (): Promise<{
  admin: AdminUser
  expiresAt: string | null
}> => {
  const { data } = await adminHttp.get<{
    data: { admin: AdminUser; expiresAt: string | null }
  }>('/api/admin/auth/me')
  return data.data
}

export const loginAdmin = async (payload: {
  username: string
  password: string
}): Promise<{ admin: AdminUser; expiresAt: string | null }> => {
  const { data } = await adminHttp.post<{
    data: { admin: AdminUser; expiresAt: string | null }
  }>('/api/admin/auth/login', payload)
  return data.data
}

export const logoutAdmin = async (): Promise<void> => {
  await adminHttp.post('/api/admin/auth/logout')
}

export const updateAdminPassword = async (payload: {
  currentPassword: string
  newPassword: string
}): Promise<string> => {
  const { data } = await adminHttp.put<{ message: string }>(
    '/api/admin/auth/password',
    payload,
  )
  return data.message
}

export const getAdminOverview = async (): Promise<AdminOverviewData> => {
  const { data } = await adminHttp.get<{ data: AdminOverviewData }>(
    '/api/admin/overview',
  )
  return data.data
}

export const getAdminNotifications =
  async (): Promise<AdminNotificationsData> => {
    const { data } = await adminHttp.get<{ data: AdminNotificationsData }>(
      '/api/admin/notifications',
    )
    return data.data
  }

export const getAdminLeads = async (
  params: LeadsFilterParams,
): Promise<{
  leads: AdminLead[]
  total: number
  page: number
  totalPages: number
  services: string[]
}> => {
  const queryParams: Record<string, string | number> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.status && params.status !== 'all') queryParams.status = params.status
  if (params.service && params.service !== 'all') {
    queryParams.service = params.service
  }
  if (params.priority && params.priority !== 'all') {
    queryParams.priority = String(params.priority)
  }
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo
  if (params.sort) queryParams.sort = params.sort
  if (params.page) queryParams.page = params.page
  if (params.limit) queryParams.limit = params.limit

  const { data } = await adminHttp.get<{
    data: {
      leads: AdminLead[]
      total: number
      page: number
      totalPages: number
      services: string[]
    }
  }>('/api/admin/leads', { params: queryParams })
  return data.data
}

export const exportAdminLeadsCsv = async (
  params: LeadsFilterParams,
): Promise<Blob> => {
  const queryParams: Record<string, string> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.status && params.status !== 'all') queryParams.status = params.status
  if (params.service && params.service !== 'all') {
    queryParams.service = params.service
  }
  if (params.priority && params.priority !== 'all') {
    queryParams.priority = String(params.priority)
  }
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo
  if (params.sort) queryParams.sort = params.sort

  const { data } = await adminHttp.get<Blob>('/api/admin/leads/export', {
    params: queryParams,
    responseType: 'blob',
  })
  return data
}

export const getAdminLeadDetail = async (id: string): Promise<AdminLead> => {
  const { data } = await adminHttp.get<{ data: { lead: AdminLead } }>(
    `/api/admin/leads/${id}`,
  )
  return data.data.lead
}

export const updateAdminLead = async (
  id: string,
  payload: Partial<{
    status: LeadStatus
    priority: LeadPriority
    isPriority: boolean
    assignedTo: string
    followUpDate: string | null
    followUpNote: string
  }>,
): Promise<AdminLead> => {
  const { data } = await adminHttp.patch<{ data: { lead: AdminLead } }>(
    `/api/admin/leads/${id}`,
    payload,
  )
  return data.data.lead
}

export const addAdminLeadNote = async (
  id: string,
  text: string,
): Promise<AdminLead> => {
  const { data } = await adminHttp.post<{ data: { lead: AdminLead } }>(
    `/api/admin/leads/${id}/notes`,
    { text },
  )
  return data.data.lead
}

export const deleteAdminLead = async (id: string): Promise<void> => {
  await adminHttp.delete(`/api/admin/leads/${id}`)
}

// Jobs & Careers Management
export const getAdminJobs = async (params: {
  q?: string
  department?: string
  jobType?: string
  status?: string
}): Promise<{ jobs: AdminJobOpening[]; departments: string[] }> => {
  const queryParams: Record<string, string> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.department && params.department !== 'all') {
    queryParams.department = params.department
  }
  if (params.jobType && params.jobType !== 'all') {
    queryParams.jobType = params.jobType
  }
  if (params.status && params.status !== 'all') {
    queryParams.status = params.status
  }
  const { data } = await adminHttp.get<{
    data: { jobs: AdminJobOpening[]; departments: string[] }
  }>('/api/admin/jobs', { params: queryParams })
  return data.data
}

export const createAdminJob = async (payload: {
  title: string
  department: string
  location: string
  jobType: AdminJobOpening['jobType']
  experience: string
  description: string
  responsibilities: string[]
  requirements: string[]
  qualifications: string
  vacancies: number
  deadline: string | null
  isActive: boolean
}): Promise<AdminJobOpening> => {
  const { data } = await adminHttp.post<{ data: { opening: AdminJobOpening } }>(
    '/api/admin/jobs',
    payload,
  )
  return data.data.opening
}

export const updateAdminJob = async (
  id: string,
  payload: Partial<{
    title: string
    department: string
    location: string
    jobType: AdminJobOpening['jobType']
    experience: string
    description: string
    responsibilities: string[]
    requirements: string[]
    qualifications: string
    vacancies: number
    deadline: string | null
    isActive: boolean
  }>,
): Promise<AdminJobOpening> => {
  const { data } = await adminHttp.put<{ data: { opening: AdminJobOpening } }>(
    `/api/admin/jobs/${id}`,
    payload,
  )
  return data.data.opening
}

export const toggleAdminJobStatus = async (
  id: string,
  isActive: boolean,
): Promise<AdminJobOpening> => {
  const { data } = await adminHttp.patch<{ data: { opening: AdminJobOpening } }>(
    `/api/admin/jobs/${id}/status`,
    { isActive },
  )
  return data.data.opening
}

export const deleteAdminJob = async (id: string): Promise<void> => {
  await adminHttp.delete(`/api/admin/jobs/${id}`)
}

// Job Applications Management
export const getAdminApplications = async (params: {
  q?: string
  status?: string
  position?: string
  dateFrom?: string
  dateTo?: string
  sort?: 'latest' | 'oldest'
  page?: number
}): Promise<{
  applications: AdminJobApplication[]
  total: number
  page: number
  totalPages: number
  positions: string[]
}> => {
  const queryParams: Record<string, string | number> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.status && params.status !== 'all') queryParams.status = params.status
  if (params.position && params.position !== 'all') {
    queryParams.position = params.position
  }
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo
  if (params.sort) queryParams.sort = params.sort
  if (params.page) queryParams.page = params.page

  const { data } = await adminHttp.get<{
    data: {
      applications: AdminJobApplication[]
      total: number
      page: number
      totalPages: number
      positions: string[]
    }
  }>('/api/admin/applications', { params: queryParams })
  return data.data
}

export const exportAdminApplicationsCsv = async (params: {
  q?: string
  status?: string
  position?: string
  dateFrom?: string
  dateTo?: string
}): Promise<Blob> => {
  const queryParams: Record<string, string> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.status && params.status !== 'all') queryParams.status = params.status
  if (params.position && params.position !== 'all') {
    queryParams.position = params.position
  }
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo

  const { data } = await adminHttp.get<Blob>('/api/admin/applications/export', {
    params: queryParams,
    responseType: 'blob',
  })
  return data
}

export const updateAdminApplication = async (
  id: string,
  payload: Partial<{
    status: ApplicationStatus
    interviewDate: string | null
    note: string
  }>,
): Promise<AdminJobApplication> => {
  const { data } = await adminHttp.patch<{
    data: { application: AdminJobApplication }
  }>(`/api/admin/applications/${id}`, payload)
  return data.data.application
}

export const downloadAdminApplicationResume = async (
  id: string,
): Promise<Blob> => {
  const { data } = await adminHttp.get<Blob>(
    `/api/admin/applications/${id}/resume`,
    { responseType: 'blob' },
  )
  return data
}

export const deleteAdminApplication = async (id: string): Promise<void> => {
  await adminHttp.delete(`/api/admin/applications/${id}`)
}

// Chatbot
export const getAdminChatConversations = async (params: {
  q?: string
  dateFrom?: string
  dateTo?: string
  onlyUnanswered?: boolean
  page?: number
}): Promise<{
  conversations: ChatConversationRecord[]
  total: number
  page: number
  totalPages: number
  frequentQuestions: FrequentQuestionItem[]
  unansweredQuestions: UnansweredQuestionItem[]
}> => {
  const queryParams: Record<string, string | number> = {}
  if (params.q?.trim()) queryParams.q = params.q.trim()
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom
  if (params.dateTo) queryParams.dateTo = params.dateTo
  if (params.onlyUnanswered) queryParams.onlyUnanswered = 'true'
  if (params.page) queryParams.page = params.page

  const { data } = await adminHttp.get<{
    data: {
      conversations: ChatConversationRecord[]
      total: number
      page: number
      totalPages: number
      frequentQuestions: FrequentQuestionItem[]
      unansweredQuestions: UnansweredQuestionItem[]
    }
  }>('/api/admin/chatbot/conversations', { params: queryParams })
  return data.data
}

export const getAdminChatConversationById = async (
  id: string,
): Promise<ChatConversationRecord> => {
  const { data } = await adminHttp.get<{
    data: { conversation: ChatConversationRecord }
  }>(`/api/admin/chatbot/conversations/${id}`)
  return data.data.conversation
}

// Feedback & Content
export const getAdminFeedbackStatus = async (): Promise<{
  supported: boolean
  items: FeedbackItem[]
  message: string
}> => {
  const { data } = await adminHttp.get<{
    data: { supported: boolean; items: FeedbackItem[]; message: string }
  }>('/api/admin/feedback')
  return data.data
}

export const updateAdminFeedbackStatus = async (
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<FeedbackItem> => {
  const { data } = await adminHttp.patch<{ data: { feedback: FeedbackItem } }>(
    `/api/admin/feedback/${id}`,
    { status },
  )
  return data.data.feedback
}

export const deleteAdminFeedback = async (id: string): Promise<void> => {
  await adminHttp.delete(`/api/admin/feedback/${id}`)
}

export const getAdminSiteContent = async (): Promise<SiteContentData> => {
  const { data } = await adminHttp.get<{ data: { content: SiteContentData } }>(
    '/api/admin/content',
  )
  return data.data.content
}

export const updateAdminSiteContent = async (
  payload: Partial<SiteContentData>,
): Promise<SiteContentData> => {
  const { data } = await adminHttp.put<{ data: { content: SiteContentData } }>(
    '/api/admin/content',
    payload,
  )
  return data.data.content
}

// RBAC Admin Accounts & Activity Logs
export const getAdminAccounts = async (): Promise<AdminUser[]> => {
  const { data } = await adminHttp.get<{ data: { admins: AdminUser[] } }>(
    '/api/admin/accounts',
  )
  return data.data.admins
}

export const createAdminAccount = async (payload: {
  username: string
  password: string
  role: AdminRole
  permissions: string[]
}): Promise<AdminUser> => {
  const { data } = await adminHttp.post<{ data: { admin: AdminUser } }>(
    '/api/admin/accounts',
    payload,
  )
  return data.data.admin
}

export const updateAdminAccount = async (
  id: string,
  payload: Partial<{ isActive: boolean; role: AdminRole }>,
): Promise<AdminUser> => {
  const { data } = await adminHttp.patch<{ data: { admin: AdminUser } }>(
    `/api/admin/accounts/${id}`,
    payload,
  )
  return data.data.admin
}

export const getAdminActivityLogs = async (): Promise<AdminActivityLog[]> => {
  const { data } = await adminHttp.get<{ data: { logs: AdminActivityLog[] } }>(
    '/api/admin/activity-logs',
  )
  return data.data.logs
}
