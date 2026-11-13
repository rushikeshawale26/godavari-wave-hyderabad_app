import axios from 'axios'

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

export interface JobOpening {
  _id: string
  title: string
  department: string
  location: string
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
  experience: string
  description: string
  responsibilities?: string[]
  requirements: string[]
  qualifications?: string
  vacancies?: number
  deadline?: string | null
}

export interface PublicBranch {
  _id: string
  city: string
  isHeadquarters: boolean
  address: string
  phones: string[]
  imageUrl: string
  lat: number
  lng: number
  region: string
  openTime: string
  closeTime: string
}

export interface EnquiryPayload {
  name: string
  email: string
  phone: string
  company: string
  subject: string
  message: string
}

export interface JobApplicationPayload {
  fullName: string
  email: string
  phone: string
  position: string
  experience: string
  education?: string
  address?: string
  resumeUrl?: string
  coverLetter?: string
  resumeFile?: {
    fileName: string
    mimeType: string
    base64Data: string
  }
}

export interface PublicSiteContent {
  hero?: {
    eyebrow?: string
    subtitle?: string
  }
  branches?: {
    id: string
    name: string
    region?: string
    description?: string
    address?: string
  }[]
  servicesOverrides?: {
    id: string
    title: string
    description?: string
  }[]
  projectsOverrides?: {
    id: string
    category?: string
    title: string
    problem?: string
    description?: string
  }[]
}

export const getPublicBranches = async (): Promise<PublicBranch[]> => {
  const { data } = await api.get<{
    success: boolean
    data?: PublicBranch[]
    message?: string
  }>('/api/branches')

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Unable to load branch locations')
  }
  return data.data
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  success: boolean
  data: {
    reply: string
    needsHumanSupport?: boolean
    isFallback?: boolean
    source?: 'ai' | 'fallback'
  }
}

export interface ChatStatus {
  configured: boolean
  fallbackAvailable?: boolean
  whatsappNumber: string | null
}

export interface WebsiteVisitorCount {
  count: number
  periodDays: number
}

interface WebsiteVisitorCountResponse {
  success: boolean
  data: WebsiteVisitorCount & { trackingEnabled?: boolean }
}

export const getJobOpenings = async (): Promise<JobOpening[]> => {
  const { data } = await api.get<{
    success: boolean
    data?: { openings?: JobOpening[] }
    message?: string
  }>('/api/job-openings')

  if (!data.success || !Array.isArray(data.data?.openings)) {
    throw new Error(data.message || 'Unable to load current job openings')
  }
  return data.data.openings
}

export const getChatStatus = async (): Promise<ChatStatus> => {
  const { data } = await api.get<{ data: ChatStatus }>(
    '/api/chat/status',
  )
  return data.data
}

export const sendChatMessages = async (
  messages: ChatMessage[],
  sessionId?: string,
): Promise<{
  reply: string
  needsHumanSupport: boolean
  isFallback: boolean
  source: 'ai' | 'fallback'
}> => {
  const { data } = await api.post<ChatReply>('/api/chat', {
    messages,
    ...(sessionId ? { sessionId } : {}),
  })
  const isFallback = data.data.isFallback ?? data.data.source === 'fallback'
  return {
    reply: data.data.reply,
    needsHumanSupport: data.data.needsHumanSupport ?? false,
    isFallback,
    source: data.data.source ?? (isFallback ? 'fallback' : 'ai'),
  }
}

export const getWebsiteVisitorCount = async (): Promise<WebsiteVisitorCount> => {
  const { data } = await api.get<WebsiteVisitorCountResponse>(
    '/api/website-visitors',
  )
  return data.data
}

export const recordWebsiteVisitor = async (
  visitorId: string,
): Promise<WebsiteVisitorCount> => {
  const { data } = await api.post<WebsiteVisitorCountResponse>(
    '/api/website-visitors/visit',
    { visitorId },
  )
  return data.data
}

export const submitEnquiry = async (payload: EnquiryPayload) => {
  const { data } = await api.post('/api/enquiries', payload)
  return data
}

export const submitJobApplication = async (
  payload: JobApplicationPayload,
) => {
  const { data } = await api.post('/api/job-applications', payload)
  return data
}

export const getPublicSiteContent = async (): Promise<PublicSiteContent | null> => {
  try {
    const { data } = await api.get<{ data?: { content?: PublicSiteContent } }>(
      '/api/content',
    )
    return data.data?.content ?? null
  } catch {
    return null
  }
}

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (error.code === 'ECONNABORTED') {
      return 'The request took too long. Please try again.'
    }
    if (!error.response) {
      return 'Unable to reach the server. Please try again later.'
    }
  }
  return 'Something went wrong. Please try again.'
}
