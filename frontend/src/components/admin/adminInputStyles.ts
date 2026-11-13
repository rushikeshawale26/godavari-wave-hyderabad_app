/**
 * Shared theme-aware input, select, and textarea utility strings for Admin UI.
 * Keeps light mode crisp and ensures dark mode focused/hovered/active states
 * never revert to white backgrounds.
 */
export const ADMIN_INPUT_BASE =
  'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#08152b] dark:text-slate-50 dark:placeholder:text-slate-400 dark:hover:border-sky-400/35 dark:focus:border-sky-400 dark:focus:bg-[#0c1d3a] dark:focus:ring-sky-400/25'

export const ADMIN_SURFACE_INPUT =
  'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#08152b] dark:text-slate-50 dark:placeholder:text-slate-400 dark:hover:border-sky-400/35 dark:focus:border-sky-400 dark:focus:bg-[#0c1d3a] dark:focus:ring-sky-400/25'
