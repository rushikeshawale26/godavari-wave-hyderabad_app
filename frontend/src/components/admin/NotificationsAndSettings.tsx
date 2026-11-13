import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  Bell,
  Briefcase,
  CalendarClock,
  Inbox,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ADMIN_INPUT_BASE } from './adminInputStyles'
import {
  createAdminAccount,
  getAdminAccounts,
  getAdminActivityLogs,
  getAdminErrorMessage,
  getAdminNotifications,
  isAdminUnauthorizedError,
  updateAdminAccount,
  updateAdminPassword,
  type AdminActivityLog,
  type AdminNotificationsData,
  type AdminRole,
  type AdminUser,
} from '../../services/adminApi'

export function AdminNotificationsSection({
  onUnauthorized,
  onNavigateSection,
  onInspectLead,
  refreshNonce,
}: {
  onUnauthorized: () => void
  onNavigateSection: (sec: 'enquiries' | 'applications' | 'leads') => void
  onInspectLead: (id: string) => void
  refreshNonce: number
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminNotificationsData | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      void getAdminNotifications()
        .then((res) => {
          if (active) setData(res)
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-sm text-slate-500 dark:border-white/10 dark:bg-[#0d1c36]">
        <LoaderCircle size={20} className="mr-2 animate-spin text-blue-600" />
        Loading notifications &amp; follow-up reminders...
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 text-xs">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Inbox size={16} className="text-blue-600 dark:text-sky-400" />
            New &amp; Pending Enquiries ({data.newLeads.length + data.pendingLeads.length})
          </h3>
          <button
            type="button"
            onClick={() => onNavigateSection('enquiries')}
            className="font-bold text-blue-600 hover:underline dark:text-sky-300"
          >
            Open Enquiries
          </button>
        </div>
        {data.newLeads.length === 0 && data.pendingLeads.length === 0 ? (
          <p className="py-6 text-center text-slate-400">All incoming enquiries are reviewed.</p>
        ) : (
          <ul className="space-y-2">
            {[...data.newLeads, ...data.pendingLeads].map((lead) => (
              <li
                key={lead._id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {lead.name}
                  </p>
                  <p className="truncate text-slate-500 dark:text-slate-400">
                    {lead.subject}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectLead(lead._id)}
                  className="shrink-0 font-bold text-blue-600 hover:underline dark:text-sky-300"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
            New Job Applications ({data.newApplications.length})
          </h3>
          <button
            type="button"
            onClick={() => onNavigateSection('applications')}
            className="font-bold text-blue-600 hover:underline dark:text-sky-300"
          >
            Open Applications
          </button>
        </div>
        {data.newApplications.length === 0 ? (
          <p className="py-6 text-center text-slate-400">No new unreviewed job applications.</p>
        ) : (
          <ul className="space-y-2">
            {data.newApplications.map((app) => (
              <li
                key={app._id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {app.fullName}
                  </p>
                  <p className="truncate text-slate-500 dark:text-slate-400">
                    {app.position} · {app.email}
                  </p>
                </div>
                <span className="shrink-0 text-[10.5px] text-slate-400">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <CalendarClock size={16} className="text-amber-500" />
          Follow-up Reminders ({data.followUpReminders.length})
        </h3>
        {data.followUpReminders.length === 0 ? (
          <p className="py-6 text-center text-slate-400">No upcoming or overdue follow-up reminders.</p>
        ) : (
          <ul className="space-y-2">
            {data.followUpReminders.map((item) => (
              <li
                key={item._id}
                className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3.5 py-2.5 dark:border-amber-400/25 dark:bg-amber-500/10"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.name} · {item.subject}
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Due {item.followUpDate.slice(0, 10)}
                    {item.followUpNote ? ` — ${item.followUpNote}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectLead(item._id)}
                  className="shrink-0 font-bold text-blue-700 hover:underline dark:text-sky-300"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Bell size={16} className="text-blue-600 dark:text-sky-400" />
          Recent Admin Activity
        </h3>
        {data.adminActivity.length === 0 ? (
          <p className="py-6 text-center text-slate-400">No admin actions recorded yet.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {data.adminActivity.map((log) => (
              <li
                key={log._id}
                className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {log.summary}
                </p>
                <p className="mt-0.5 text-[10.5px] text-slate-400">
                  @{log.actorUsername} ·{' '}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function AdminSettingsSection({
  adminUser,
  expiresAt,
  onUnauthorized,
  refreshNonce,
}: {
  adminUser: AdminUser
  expiresAt: string | null
  onUnauthorized: () => void
  refreshNonce: number
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const canManageAdmins =
    adminUser.role === 'admin' ||
    adminUser.role === 'super_admin' ||
    adminUser.permissions.includes('*') ||
    adminUser.permissions.includes('admins:manage')

  const [accounts, setAccounts] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AdminActivityLog[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newAccountPassword, setNewAccountPassword] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('hr_manager')
  const [creatingAccount, setCreatingAccount] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      if (canManageAdmins) {
        void getAdminActivityLogs()
          .then((res) => {
            if (active) setLogs(res)
          })
          .catch((err) => {
            if (!active) return
            if (isAdminUnauthorizedError(err)) {
              onUnauthorized()
              return
            }
            toast.error(getAdminErrorMessage(err))
          })

        void getAdminAccounts()
          .then((res) => {
            if (active) setAccounts(res)
          })
          .catch((err) => {
            if (!active) return
            if (isAdminUnauthorizedError(err)) {
              onUnauthorized()
              return
            }
            toast.error(getAdminErrorMessage(err))
          })
      }
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [canManageAdmins, onUnauthorized, refreshNonce])

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (updatingPassword) return
    if (!currentPassword || newPassword.length < 8) {
      toast.error('Enter your current password and a new password (8+ chars).')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setUpdatingPassword(true)
    try {
      const msg = await updateAdminPassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(msg)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (creatingAccount) return

    const defaultPermsByRole: Record<AdminRole, string[]> = {
      admin: ['*'],
      super_admin: ['*'],
      hr_manager: ['careers:manage', 'chatbot:view'],
      sales_manager: ['leads:manage', 'chatbot:view'],
    }

    setCreatingAccount(true)
    try {
      const created = await createAdminAccount({
        username: newUsername.trim(),
        password: newAccountPassword,
        role: newRole,
        permissions: defaultPermsByRole[newRole],
      })
      setAccounts((prev) => [...prev, created])
      setNewUsername('')
      setNewAccountPassword('')
      toast.success(`Admin account @${created.username} created.`)
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleToggleAccount = async (account: AdminUser) => {
    try {
      const updated = await updateAdminAccount(account._id, {
        isActive: !account.isActive,
      })
      setAccounts((prev) =>
        prev.map((a) => (a._id === account._id ? updated : a)),
      )
      toast.success(
        `@${updated.username} ${updated.isActive ? 'activated' : 'deactivated'}.`,
      )
    } catch (err) {
      if (isAdminUnauthorizedError(err)) {
        onUnauthorized()
        return
      }
      toast.error(getAdminErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck size={16} className="text-blue-600 dark:text-sky-400" />
            Administrator Session &amp; RBAC Profile
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-bold uppercase tracking-wider text-slate-400">
                Username
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                @{adminUser.username}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wider text-slate-400">
                Role &amp; Permissions
              </dt>
              <dd className="mt-0.5 font-semibold capitalize text-slate-900 dark:text-white">
                {adminUser.role.replace('_', ' ')} (
                {adminUser.permissions.join(', ')})
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wider text-slate-400">
                Account Created
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                {adminUser.createdAt
                  ? new Date(adminUser.createdAt).toLocaleString()
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wider text-slate-400">
                Session Expires
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                {expiresAt
                  ? new Date(expiresAt).toLocaleString()
                  : 'Browser session (expires when browser closes)'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <KeyRound size={15} className="text-blue-600 dark:text-sky-400" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              autoComplete="new-password"
              className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
            />
            <button
              type="submit"
              disabled={updatingPassword}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {updatingPassword ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>

      {canManageAdmins && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <UserPlus size={15} className="text-blue-600 dark:text-sky-400" />
              Add Authorized Team Admin Account
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <input
                required
                minLength={3}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username (e.g. hr_hyderabad)"
                className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
              />
              <input
                required
                minLength={8}
                type="password"
                value={newAccountPassword}
                onChange={(e) => setNewAccountPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                className={`w-full rounded-xl px-3 py-2 font-medium ${ADMIN_INPUT_BASE}`}
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRole)}
                className={`w-full rounded-xl px-3 py-2 font-semibold ${ADMIN_INPUT_BASE}`}
              >
                <option value="hr_manager">HR Manager (Careers &amp; Chatbot)</option>
                <option value="sales_manager">Sales Manager (Leads &amp; Chatbot)</option>
                <option value="admin">Full Administrator</option>
              </select>
              <button
                type="submit"
                disabled={creatingAccount}
                className="rounded-xl bg-[#164e8a] px-4 py-2 font-bold text-white hover:bg-[#1d5fa8] disabled:opacity-60"
              >
                {creatingAccount ? 'Creating...' : 'Provision Account'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              Admin Accounts ({accounts.length})
            </h3>
            <ul className="space-y-2">
              {accounts.map((acc) => (
                <li
                  key={acc._id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      @{acc.username}
                    </p>
                    <p className="text-[10.5px] uppercase text-slate-500">
                      {acc.role.replace('_', ' ')} ·{' '}
                      {acc.isActive ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                  {acc._id !== adminUser._id && (
                    <button
                      type="button"
                      onClick={() => handleToggleAccount(acc)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 font-bold hover:bg-slate-100 dark:border-white/15"
                    >
                      {acc.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {canManageAdmins && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#0d1c36]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Activity size={16} className="text-blue-600 dark:text-sky-400" />
            Security &amp; Admin Activity Logs
          </h3>
          {logs.length === 0 ? (
            <p className="py-4 text-center text-slate-400">
              Activity logs will appear here as actions occur.
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
                >
                  <div>
                    <span className="mr-2 rounded-md bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-sky-300">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {log.summary}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400">
                    @{log.actorUsername} ·{' '}
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
