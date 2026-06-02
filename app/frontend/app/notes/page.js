'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'

// Icons
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
// Stat badge
function StatBadge({ label, value, color = 'lime' }) {
  const colors = {
    lime: 'border-lime-500/30 text-lime-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    red: 'border-red-500/30 text-red-400',
  }
  return (
    <div className={`flex items-center gap-2 rounded-xl border ${colors[color]} bg-zinc-900/60 px-4 py-2`}>
      <span className="font-mono text-xl font-bold">{value}</span>
      <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// Note Card
function NoteCard({ note, currentUser, onEdit, onDelete }) {
  const isOwner = currentUser?.id === note.authorId
  const isPublic = note.isPublic

  // Format date
  const date = new Date(note.createdAt)
  const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur transition-all duration-300 hover:border-lime-500/30 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-lime-500/5">
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest ${isPublic ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
            {isPublic ? <IconGlobe /> : <IconLock />}
            {isPublic ? 'public' : 'private'}
          </span>
          {/* IDOR badge — intentional vuln marker */}
          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 font-mono text-[10px] text-red-400 uppercase tracking-widest">
            id:{note.id}
          </span>
        </div>

        {/* Actions — IDOR: API ไม่ check ownership ใครก็แก้/ลบได้ */}
        <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isOwner && (
            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 font-mono text-[9px] text-red-400 uppercase tracking-widest">
              ⚠ IDOR
            </span>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(note)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                isOwner
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-lime-500/40 hover:bg-zinc-700 hover:text-lime-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20'
              }`}
            >
              <IconEdit /> Edit
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                isOwner
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-red-500/40 hover:bg-zinc-900 hover:text-red-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20'
              }`}
            >
              <IconTrash />
            </button>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 font-mono text-sm font-semibold text-white leading-snug line-clamp-1">
        {note.title}
      </h3>

      {/* Content — dangerouslySetInnerHTML intentional XSS vuln */}
      <div
        className="flex-1 text-xs text-zinc-400 leading-relaxed line-clamp-3"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <span className="font-mono text-[10px] text-zinc-600">
          @{note.author?.username ?? 'unknown'}
        </span>
        <span className="font-mono text-[10px] text-zinc-600">{formatted}</span>
      </div>
    </div>
  )
}

// Modal: Create / Edit Note
function NoteModal({ mode, note, currentUser, onClose, onSave }) {
  const isOwnNote = !note || currentUser?.id === note.authorId
  const [form, setForm] = useState({
    title: note?.title ?? '',
    content: note?.content ?? '',
    isPublic: note?.isPublic ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${!isOwnNote && mode === 'edit' ? 'border-red-500/20 bg-red-500/5' : 'border-zinc-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full animate-pulse ${!isOwnNote && mode === 'edit' ? 'bg-red-400' : 'bg-lime-400'}`} />
            <div>
              <span className="font-mono text-sm font-semibold text-white">
                {mode === 'create' ? '// new_note.md' : '// edit_note.md'}
              </span>
              {!isOwnNote && mode === 'edit' && (
                <p className="font-mono text-[10px] text-red-400 mt-0.5">
                  ⚠ IDOR: Editing @{note.author?.username}&apos;s note — not yours
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white">
            <IconX />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block font-mono text-xs text-zinc-400 uppercase tracking-widest">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Note title..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-lime-500 focus:bg-zinc-800"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block font-mono text-xs text-zinc-400 uppercase tracking-widest">
              Content <span className="text-red-400/60 ml-1 normal-case tracking-normal">⚠ XSS: unsanitized</span>
            </label>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Write anything... or inject <script>alert(1)</script>"
              rows={6}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-lime-500 focus:bg-zinc-800"
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
            <div className="flex items-center gap-2">
              {form.isPublic ? <IconGlobe /> : <IconLock />}
              <span className="font-mono text-xs text-zinc-300">
                {form.isPublic ? 'Public note' : 'Private note'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${form.isPublic ? 'bg-lime-500' : 'bg-zinc-600'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-mono text-xs text-red-400">
              [ERR] {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-700 py-3 font-mono text-sm text-zinc-400 transition-all hover:border-zinc-600 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 py-3 font-mono text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/30 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </span>
              ) : mode === 'create' ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Confirm Delete Modal
function DeleteModal({ noteId, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-red-500/30 bg-zinc-900 p-6 shadow-2xl shadow-red-500/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="font-mono text-sm font-semibold text-white">{`// confirm_delete`}</span>
        </div>
        <p className="mb-1 font-mono text-xs text-zinc-400">
          Delete note <span className="text-red-400">id:{noteId}</span>?
        </p>
        <p className="mb-6 font-mono text-xs text-zinc-600">
          ⚠ IDOR: API won&apos;t verify ownership
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-700 py-2.5 font-mono text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              await onConfirm(noteId)
              setLoading(false)
            }}
            className="flex-1 rounded-xl bg-red-500/20 border border-red-500/40 py-2.5 font-mono text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Page
export default function NotesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal states
  const [modal, setModal] = useState(null) // null
  const [editingNote, setEditingNote] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const data = await api.getNotes()
      setNotes(Array.isArray(data) ? data : data.notes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Auth check — runs only on client after hydration
  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) {
      router.push('/')
      return
    }
    void (async () => {
      setUser(JSON.parse(stored))
      await fetchNotes()
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/')
  }

  const handleCreate = async (form) => {
    await api.createNote(form)
    await fetchNotes()
  }

  const handleEdit = async (form) => {
    await api.updateNote(editingNote.id, form)
    await fetchNotes()
  }

  const handleDelete = async (id) => {
    await api.deleteNote(id)
    setDeleteTarget(null)
    await fetchNotes()
  }

  // Filter
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  const myNotes = notes.filter(n => n.authorId === user?.id)
  const publicNotes = notes.filter(n => n.isPublic)

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white selection:bg-lime-500/30">
      {/* Grid bg */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a20_1px,transparent_1px),linear-gradient(to_bottom,#27272a20_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-lime-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8">

        {/* NAVBAR */}
        <Navbar page="notes" user={user} onLogout={handleLogout} />

        {/* STATS */}
        <div className="mb-8 flex flex-wrap gap-3">
          <StatBadge label="Total Notes" value={notes.length} color="lime" />
          <StatBadge label="My Notes" value={myNotes.length} color="cyan" />
          <StatBadge label="Public" value={publicNotes.length} color="lime" />
        </div>

        {/* TOOLBAR */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter bar — client-side only */}
          <div className="relative max-w-sm flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <IconSearch />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by title / content..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 pl-9 pr-4 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-lime-500 focus:bg-zinc-800"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-600">
              client-side
            </span>
          </div>

          {/* Create button */}
          <button
            onClick={() => setModal('create')}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 px-5 py-2.5 font-mono text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-lime-500/30 active:scale-[0.98]"
          >
            <IconPlus />
            New Note
          </button>
        </div>

        {/* NOTES GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400" />
              <span className="font-mono text-xs text-zinc-600">Loading notes...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 py-24 text-center">
            <span className="mb-3 font-mono text-4xl">📂</span>
            <p className="font-mono text-sm text-zinc-500">
              {search ? `No notes matching "${search}"` : 'No notes yet.'}
            </p>
            {!search && (
              <button
                onClick={() => setModal('create')}
                className="mt-4 font-mono text-xs text-lime-400 underline hover:text-lime-300"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                currentUser={user}
                onEdit={n => { setEditingNote(n); setModal('edit') }}
                onDelete={id => setDeleteTarget(id)}
              />
            ))}
          </div>
        )}

        <div className="mt-16">
          <Footer />
        </div>
      </div>

      {/* MODALS */}
      {modal === 'create' && (
        <NoteModal mode="create" onClose={() => setModal(null)} onSave={handleCreate} />
      )}
      {modal === 'edit' && editingNote && (
        <NoteModal mode="edit" note={editingNote} currentUser={user} onClose={() => { setModal(null); setEditingNote(null) }} onSave={handleEdit} />
      )}
      {deleteTarget !== null && (
        <DeleteModal noteId={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}