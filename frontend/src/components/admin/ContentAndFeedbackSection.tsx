import { useEffect, useState, type FormEvent } from 'react'
import {
  Building2,
  Check,
  Globe,
  LoaderCircle,
  MessageSquareHeart,
  Save,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ADMIN_INPUT_BASE, ADMIN_SURFACE_INPUT } from './adminInputStyles'
import {
  deleteAdminFeedback,
  getAdminErrorMessage,
  getAdminFeedbackStatus,
  getAdminSiteContent,
  isAdminUnauthorizedError,
  updateAdminFeedbackStatus,
  updateAdminSiteContent,
  type FeedbackItem,
  type SiteContentData,
} from '../../services/adminApi'

const DEFAULT_BRANCHES: SiteContentData['branches'] = [
  {
    id: 'hyderabad',
    name: 'Hyderabad Branch',
    region: 'Gachibowli, Telangana',
    description:
      'Our Hyderabad branch is located in the Gachibowli business district.',
    address:
      'Meenakshi Tech Park, Phase 2, Gachibowli, Hyderabad, Telangana 500032',
  },
  {
    id: 'rajahmundry',
    name: 'Head Office',
    region: 'Rajamahendravaram, Andhra Pradesh',
    description:
      'Godavari Wave Technologies’ head office is in Rajamahendravaram.',
    address:
      '3rd Floor, BVR Enclave, Above Yamaha Showroom, Morampudi, Rajamahendravaram, Andhra Pradesh 533103',
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam Branch',
    region: 'Yendada, Visakhapatnam, Andhra Pradesh',
    description:
      'Our Visakhapatnam branch is located in Yendada, Visakhapatnam, Andhra Pradesh.',
    address:
      'KP ICON, opp. MK Gold Coast, Yendada, Visakhapatnam, Andhra Pradesh',
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada Branch',
    region: 'Vijayawada, Andhra Pradesh',
    description:
      'Our Vijayawada branch is located in Vijayawada, Andhra Pradesh.',
    address: 'Vijayawada, Andhra Pradesh',
  },
]

const DEFAULT_SERVICES: SiteContentData['servicesOverrides'] = [
  {
    id: 'web-development',
    title: 'Web Design & Development',
    description:
      'Responsive websites, business portals, and custom web applications.',
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Development',
    description:
      'Android and cross-platform mobile applications designed for usability.',
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX & Graphic Design',
    description:
      'User-focused interface design, prototypes, and graphic assets.',
  },
  {
    id: 'custom-software',
    title: 'Custom Software',
    description:
      'Software solutions tailored to the needs of businesses and startups.',
  },
]

export function AdminFeedbackSection({
  onUnauthorized,
  refreshNonce,
}: {
  onUnauthorized: () => void
  refreshNonce: number
}) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [message, setMessage] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      void getAdminFeedbackStatus()
        .then((res) => {
          if (!active) return
          setItems(res.items)
          setMessage(res.message)
        })
        .catch((err) => {
          if (!active) return
          if (isAdminUnauthorizedError(err)) {
            onUnauthorized()
            return
          }
          toast.error(getAdminErrorMessage(err))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [onUnauthorized, refreshNonce])

  const handleModerate = async (
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    try {
      const updated = await updateAdminFeedbackStatus(id, status)
      setItems((prev) => prev.map((f) => (f._id === id ? updated : f)))
      toast.success(`Feedback marked as ${status}.`)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminFeedback(id)
      setItems((prev) => prev.filter((f) => f._id !== id))
      setConfirmDeleteId(null)
      toast.success('Feedback deleted.')
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500 dark:border-white/10 dark:bg-[#0d1c36]">
          <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
          Loading feedback submissions...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <MessageSquareHeart
            size={34}
            className="mx-auto text-blue-600 dark:text-sky-400"
          />
          <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            Feedback &amp; Reviews
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {message ||
              'No customer feedback or reviews submitted yet. Chatbot messages are never disguised as reviews and are managed under Chatbot Conversations.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 text-xs shadow-xs dark:border-white/10 dark:bg-[#0d1c36]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.customerName}
                  </p>
                  {item.serviceRelated && (
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-sky-300">
                      {item.serviceRelated}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase dark:bg-white/10">
                  {item.status}
                </span>
              </div>

              {item.rating && (
                <div className="mt-2 flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: item.rating }).map((_, idx) => (
                    <Star key={idx} size={13} className="fill-amber-400" />
                  ))}
                </div>
              )}

              <p className="mt-2.5 leading-relaxed text-slate-700 dark:text-slate-200">
                {item.comment}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleModerate(item._id, 'approved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(item._id, 'rejected')}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
                {confirmDeleteId === item._id ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg bg-rose-600 px-2.5 py-1 font-bold text-white"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item._id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminContentSection({
  onUnauthorized,
  refreshNonce,
}: {
  onUnauthorized: () => void
  refreshNonce: number
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eyebrow, setEyebrow] = useState(
    'GODAVARI WAVE TECHNOLOGIES · HYDERABAD',
  )
  const [subtitle, setSubtitle] = useState(
    'Godavari Wave Technologies is Hyderabad’s trusted digital engineering partner, delivering scalable web platforms, custom enterprise software, cloud infrastructure, and modern mobile applications that drive sustainable growth.',
  )
  const [branches, setBranches] =
    useState<SiteContentData['branches']>(DEFAULT_BRANCHES)
  const [services, setServices] =
    useState<SiteContentData['servicesOverrides']>(DEFAULT_SERVICES)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      void getAdminSiteContent()
        .then((content) => {
          if (!active) return
          if (content.hero?.eyebrow) setEyebrow(content.hero.eyebrow)
          if (content.hero?.subtitle) setSubtitle(content.hero.subtitle)
          if (content.branches?.length) setBranches(content.branches)
          if (content.servicesOverrides?.length) {
            setServices(content.servicesOverrides)
          }
        })
        .catch((err) => {
          if (!active) return
          if (isAdminUnauthorizedError(err)) {
            onUnauthorized()
            return
          }
          toast.error(getAdminErrorMessage(err))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [onUnauthorized, refreshNonce])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      await updateAdminSiteContent({
        hero: { eyebrow: eyebrow.trim(), subtitle: subtitle.trim() },
        branches,
        servicesOverrides: services,
      })
      toast.success('Website content configuration saved successfully.')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500 dark:border-white/10 dark:bg-[#0d1c36]">
        <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
        Loading website content configuration...
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Globe size={16} className="text-blue-600 dark:text-sky-400" />
              Hero &amp; Corporate Messaging
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Manage verified copy for the existing public homepage modules.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] to-[#2563eb] px-4 py-2 font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Content Changes'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
              Hero Eyebrow Text
            </label>
            <input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700 dark:text-slate-200">
              Hero Introduction Summary
            </label>
            <textarea
              rows={3}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
            />
          </div>
        </div>
      </div>

      {/* Branches */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Building2 size={16} className="text-blue-600 dark:text-sky-400" />
          Branch Information (Verified Locations)
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <input
                value={branch.name}
                aria-label={`${branch.name} display name`}
                onChange={(e) =>
                  setBranches((prev) =>
                    prev.map((b, i) =>
                      i === idx ? { ...b, name: e.target.value } : b,
                    ),
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 font-bold ${ADMIN_SURFACE_INPUT}`}
              />
              <input
                value={branch.region}
                aria-label={`${branch.name} region`}
                onChange={(e) =>
                  setBranches((prev) =>
                    prev.map((b, i) =>
                      i === idx ? { ...b, region: e.target.value } : b,
                    ),
                  )
                }
                placeholder="City, state or region"
                className={`w-full rounded-lg px-3 py-1.5 ${ADMIN_SURFACE_INPUT}`}
              />
              <textarea
                rows={2}
                value={branch.description}
                onChange={(e) =>
                  setBranches((prev) =>
                    prev.map((b, i) =>
                      i === idx ? { ...b, description: e.target.value } : b,
                    ),
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 ${ADMIN_SURFACE_INPUT}`}
              />
              <textarea
                rows={2}
                value={branch.address}
                onChange={(e) =>
                  setBranches((prev) =>
                    prev.map((b, i) =>
                      i === idx ? { ...b, address: e.target.value } : b,
                    ),
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 ${ADMIN_SURFACE_INPUT}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Services Descriptions */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
          Core Service Summaries
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((srv, idx) => (
            <div
              key={srv.id}
              className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <input
                value={srv.title}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s, i) =>
                      i === idx ? { ...s, title: e.target.value } : s,
                    ),
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 font-bold ${ADMIN_SURFACE_INPUT}`}
              />
              <textarea
                rows={2}
                value={srv.description}
                onChange={(e) =>
                  setServices((prev) =>
                    prev.map((s, i) =>
                      i === idx ? { ...s, description: e.target.value } : s,
                    ),
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 ${ADMIN_SURFACE_INPUT}`}
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}
