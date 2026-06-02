'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'

// Icons
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

// SQLi payload presets
const SQLI_PAYLOADS = [
  { label: "Dump all", payload: "' OR 1=1 #" },
  { label: "Always true", payload: "' OR 'a'='a'#" },
  { label: "Comment out", payload: "test'#" },
  { label: "Union probe", payload: "' OR (1=0) UNION SELECT id,username,password,email,createdAt,createdAt,id FROM User -- " },
]

// Result Card
function ResultCard({ note, index }) {
  const isPublic = note.isPublic
  const date = new Date(note.createdAt)
  const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div
      className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur transition-all duration-300 hover:border-lime-500/30 hover:shadow-lg hover:shadow-lime-500/5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest ${isPublic ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
          {isPublic ? <IconGlobe /> : <IconLock />}
          {isPublic ? 'public' : 'private'}
        </span>
        <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 font-mono text-[10px] text-red-400 uppercase tracking-widest">
          id:{note.id}
        </span>
      </div>

      <h3 className="mb-1.5 font-mono text-sm font-semibold text-white line-clamp-1">
        {note.title}
      </h3>

      {/* XSS: dangerouslySetInnerHTML intentional */}
      <div
        className="text-xs text-zinc-400 leading-relaxed line-clamp-2"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <span className="font-mono text-[10px] text-zinc-600">@{note.author?.username ?? 'unknown'}</span>
        <span className="font-mono text-[10px] text-zinc-600">{formatted}</span>
      </div>
    </div>
  )
}

// Main Page
export default function SearchPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [isSqli, setIsSqli] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) {
      router.push('/')
      return
    }
    void (async () => {
      setUser(JSON.parse(stored))
    })()
    inputRef.current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (q = query) => {
    if (!q.trim()) return
    setStatus('loading')
    setResults([])

    const sqliPatterns = /('|--|#|OR\s+\d|UNION|SELECT|DROP|INSERT)/i
    setIsSqli(sqliPatterns.test(q))

    try {
      const data = await api.search(q)
      setResults(Array.isArray(data) ? data : data.results ?? [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/')
  }

  const handlePayload = (payload) => {
    setQuery(payload)
    void handleSearch(payload)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white selection:bg-lime-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a20_1px,transparent_1px),linear-gradient(to_bottom,#27272a20_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-lime-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8">

        {/* NAVBAR */}
        <Navbar page="search" user={user} onLogout={handleLogout} />

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-black tracking-widest text-white">SEARCH</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            endpoint: <span className="text-cyan-400">GET /search?q=</span>
            <span className="ml-2 text-red-400/70">⚠ SQL Injection vulnerable</span>
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className={`mb-4 flex gap-2 rounded-2xl border p-1.5 backdrop-blur transition-colors duration-300 ${isSqli && status === 'done' ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/70'}`}>
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
              <IconSearch />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search notes... or try ' OR 1=1 #"
              className="w-full rounded-xl border border-transparent bg-zinc-800/60 py-3 pl-10 pr-4 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-zinc-700 focus:bg-zinc-800"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={status === 'loading'}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 px-5 font-mono text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/30 disabled:opacity-60"
          >
            {status === 'loading' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <IconSearch />
            )}
            Run
          </button>
        </div>

        {/* QUICK PAYLOADS */}
        <div className="mb-8">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">Quick payloads</p>
          <div className="flex flex-wrap gap-2">
            {SQLI_PAYLOADS.map(({ label, payload }) => (
              <button
                key={label}
                onClick={() => handlePayload(payload)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 font-mono text-xs text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
              >
                <IconZap /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* SQLi ALERT */}
        {isSqli && status === 'done' && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">SQL Injection Detected</span>
            </div>
            <p className="font-mono text-xs text-red-300/70">
              Payload: <span className="text-red-300">{query}</span>
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              Query ran via <span className="text-red-400">$queryRawUnsafe</span> — no sanitization
            </p>
          </div>
        )}

        {/* RESULTS */}
        {status === 'done' && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">
                {results.length > 0
                  ? <><span className="text-lime-400 font-bold">{results.length}</span> result{results.length > 1 ? 's' : ''} found</>
                  : 'No results'}
              </span>
              {isSqli && results.length > 0 && (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
                  dumped via SQLi
                </span>
              )}
            </div>
            {results.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((note, i) => (
                  <ResultCard key={`result-${i}`} note={note} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 py-16 text-center">
                <span className="mb-3 font-mono text-4xl">🔍</span>
                <p className="font-mono text-sm text-zinc-500">No notes matched your query</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-mono text-sm text-red-400">
            [ERR] Search failed — check backend connection
          </div>
        )}

        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 py-20 text-center">
            <span className="mb-3 font-mono text-4xl opacity-40">⌕</span>
            <p className="font-mono text-sm text-zinc-600">Type a query and press Enter or Run</p>
            <p className="mt-1 font-mono text-xs text-zinc-700">Try a SQLi payload above to dump all notes</p>
          </div>
        )}

        <div className="mt-16">
          <Footer />
        </div>
      </div>
    </div>
  )
}