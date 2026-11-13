import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react'
import BrandLogo from '../BrandLogo'
import { ADMIN_INPUT_BASE } from './adminInputStyles'
import {
  getAdminErrorMessage,
  loginAdmin,
  type AdminUser,
} from '../../services/adminApi'

interface AdminLoginProps {
  sessionNotice?: string | null
  onAuthenticated: (payload: {
    admin: AdminUser
    expiresAt: string | null
  }) => void
}

export default function AdminLogin({
  sessionNotice,
  onAuthenticated,
}: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const trimmedUser = username.trim()
    if (!trimmedUser || !password) {
      setError('Please enter both admin username and password.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const result = await loginAdmin({ username: trimmedUser, password })
      onAuthenticated(result)
    } catch (err) {
      setError(getAdminErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07162c] via-[#0b2447] to-[#0f3566] px-4 py-10 text-slate-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to website
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
            <ShieldCheck size={13} aria-hidden="true" />
            Protected Portal
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-sky-200/20 bg-white shadow-[0_28px_70px_-15px_rgba(3,12,28,0.65)] dark:border-sky-300/20 dark:bg-[#0d1d38]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#0b1f3a] via-[#123b65] to-[#164e8a] px-7 py-6 text-white dark:border-white/10">
            <div className="mb-3 inline-flex items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-sm [&_img]:h-auto [&_img]:w-40">
              <BrandLogo />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Admin Leads Portal
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-sky-100/85">
              Sign in with your administrator credentials to view enquiries,
              chatbot logs, and lead analytics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6" noValidate>
            {sessionNotice && !error && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{sessionNotice}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-username"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter admin username"
                  disabled={submitting}
                  className={`w-full rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium ${ADMIN_INPUT_BASE}`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  disabled={submitting}
                  className={`w-full rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium ${ADMIN_INPUT_BASE}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 dark:text-slate-300 dark:hover:text-sky-300 dark:focus-visible:ring-sky-400/35"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#164e8a] via-[#1d5fa8] to-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-sky-100/70">
          Authorized Godavari Wave Technologies Pvt. Ltd. personnel only.
        </p>
      </div>
    </div>
  )
}
