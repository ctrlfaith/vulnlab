'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'

// Icons
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconSave() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', email: '' })
  const [saveStatus, setSaveStatus] = useState(null) 
  const [errorMsg, setErrorMsg] = useState('')
  const [isOwnProfile, setIsOwnProfile] = useState(true)

  const fetchProfile = async (id) => {
    setLoading(true)
    try {
      const data = await api.getProfile(id)
      setProfile(data)
      setForm({ username: data.username ?? '', email: data.email ?? '' })
    } catch {
      setErrorMsg('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) {
      router.push('/')
      return
    }
    void (async () => {
      const me = JSON.parse(stored)
      setCurrentUser(me)

      // BROKEN ACCESS CONTROL: id comes from URL param, not enforced server-side
      const targetId = searchParams.get('id') ?? me.id
      setIsOwnProfile(String(targetId) === String(me.id))
      await fetchProfile(targetId)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      // IDOR: API accepts any id — no ownership check
      await api.updateProfile(profile.id, form)
      setProfile({ ...profile, ...form })
      setSaveStatus('success')
      setEditing(false)
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/')
  }

  // ID switcher for BAC demo
  const [switchId, setSwitchId] = useState('')
  const handleSwitch = () => {
    if (!switchId.trim()) return
    const id = switchId.trim()
    setSwitchId('')
    void (async () => {
      const me = currentUser
      setIsOwnProfile(String(id) === String(me?.id))
      await fetchProfile(id)
      window.history.pushState({}, '', `/profile?id=${id}`)
    })()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white selection:bg-lime-500/30">
      {/* Grid bg */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a20_1px,transparent_1px),linear-gradient(to_bottom,#27272a20_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-lime-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8">

        {/* NAVBAR */}
        <Navbar page="profile" user={currentUser} onLogout={handleLogout} />

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-black tracking-widest text-white">PROFILE</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            endpoint: <span className="text-cyan-400">GET /users/:id</span>
            <span className="ml-2 text-red-400/70">⚠ Broken Access Control</span>
          </p>
        </div>

        {/* BAC DEMO — ID Switcher */}
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">
              Broken Access Control — A01
            </span>
          </div>
          <p className="mb-3 font-mono text-xs text-zinc-500">
            API <span className="text-red-400">GET /users/:id</span> ไม่ตรวจสอบว่า id ตรงกับ user ที่ login อยู่ — เปลี่ยน id เพื่อดู profile คนอื่นได้เลย
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={switchId}
              onChange={e => setSwitchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSwitch()}
              placeholder="Enter user id..."
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-red-500/50 focus:bg-zinc-800"
            />
            <button
              onClick={handleSwitch}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-mono text-xs font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20"
            >
              Switch
            </button>
          </div>
        </div>

        {/* NOT OWN PROFILE WARNING */}
        {!isOwnProfile && !loading && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3">
            <p className="font-mono text-xs text-yellow-400">
              ⚠ Viewing profile of <span className="font-bold text-yellow-300">@{profile?.username}</span> — not your account
            </p>
          </div>
        )}

        {/* PROFILE CARD */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400" />
              <span className="font-mono text-xs text-zinc-600">Loading profile...</span>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-mono text-sm text-red-400">
            [ERR] {errorMsg}
          </div>
        ) : profile ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur">
            {/* Profile header */}
            <div className="flex items-center gap-5 border-b border-zinc-800 px-6 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-400">
                <IconUser />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-mono text-lg font-bold text-white">@{profile.username}</h2>
                  <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 font-mono text-[10px] text-red-400">
                    id:{profile.id}
                  </span>
                  {isOwnProfile && (
                    <span className="rounded-full bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 font-mono text-[10px] text-lime-400">
                      you
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-zinc-500">{profile.email}</p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs transition-all
                    ${isOwnProfile
                      ? 'border-zinc-700 text-zinc-400 hover:border-lime-500/40 hover:text-lime-400'
                      : 'border-red-500/30 text-red-400 hover:border-red-500/50 hover:bg-red-500/10'
                    }`}
                >
                  <IconEdit /> {isOwnProfile ? 'Edit' : 'Edit (IDOR)'}
                </button>
              )}
            </div>

            {/* Profile fields */}
            <div className="p-6 space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-zinc-500">Username</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-lime-500 focus:bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-zinc-500">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-lime-500 focus:bg-zinc-800"
                    />
                  </div>

                  {!isOwnProfile && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-mono text-xs text-red-400">
                      ⚠ IDOR: Saving will update <span className="font-bold">@{profile.username}</span>{`'`}s account — not yours
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { setEditing(false); setForm({ username: profile.username, email: profile.email }) }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 py-3 font-mono text-sm text-zinc-400 transition-all hover:text-white"
                    >
                      <IconX /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving'}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 py-3 font-mono text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/30 disabled:opacity-60"
                    >
                      {saveStatus === 'saving' ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      ) : (
                        <><IconSave /> Save</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Username</span>
                    <span className="font-mono text-sm text-white">{profile.username}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Email</span>
                    <span className="font-mono text-sm text-white">{profile.email}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">User ID</span>
                    <span className="font-mono text-sm text-red-400">{profile.id}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Joined</span>
                    <span className="font-mono text-sm text-zinc-400">
                      {new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Save status toast */}
        {saveStatus === 'success' && (
          <div className="mt-4 rounded-2xl border border-lime-500/20 bg-lime-500/10 px-5 py-3 font-mono text-sm text-lime-400">
            ✓ Profile updated
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-mono text-sm text-red-400">
            [ERR] Failed to update profile
          </div>
        )}

        <div className="mt-16">
          <Footer />
        </div>
      </div>
    </div>
  )
}