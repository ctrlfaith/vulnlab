'use client'

import { useRouter } from 'next/navigation'

// Icons
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/**
 * Shared Navbar
 *
 * Props:
 *   page     — 'notes' | 'search' | 'profile'   (highlights active nav item)
 *   user     — { id, username }                  (displays username)
 *   onLogout — () => void                        (logout handler from parent)
 */
export default function Navbar({ page, user, onLogout }) {
  const router = useRouter()

  // Nav items config
  const navItems = [
    {
      key: 'notes',
      label: 'Notes',
      icon: <IconArrowLeft />,
      onClick: () => router.push('/notes'),
      vuln: false,
    },
    {
      key: 'search',
      label: 'SQLi Lab',
      icon: <IconSearch />,
      onClick: () => router.push('/search'),
      vuln: true,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <IconUser />,
      onClick: () => router.push(`/profile?id=${user?.id}`),
      vuln: false,
    },
  ]

  return (
    <nav className="mb-8 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
        <span className="font-mono text-sm font-black tracking-[0.2em] text-white">VULNLAB</span>
        <span className="hidden font-mono text-xs text-zinc-600 sm:block">
          / {page}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {navItems.filter(({ key }) => key !== page).map(({ key, label, icon, onClick, vuln }) => {
          const isActive = false

          if (vuln) {
            return (
              <button
                key={key}
                onClick={onClick}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all
                  ${isActive
                    ? 'border-red-500/50 bg-red-500/15 text-red-300'
                    : 'border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
                  }`}
                title="SQL Injection lab"
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          }

          // Normal nav item — lime when active
          return (
            <button
              key={key}
              onClick={onClick}
              className={`flex items-center gap-1.5 font-mono text-xs transition-colors
                ${isActive
                  ? 'text-lime-400'
                  : 'text-zinc-500 hover:text-lime-400'
                }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}

        {/* Username display */}
        <span className="hidden font-mono text-xs text-zinc-500 sm:block">
          <span className="text-zinc-600">user:</span>{' '}
          <span className="text-lime-400">{user?.username}</span>
        </span>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400"
        >
          <IconLogout />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  )
}