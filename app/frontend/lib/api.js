const API_URL = 'http://localhost:5000'

const getToken = () => {
  if (typeof window !== 'undefined') {
    // Read from cookie (used by middleware)
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]
    if (cookie) return cookie
    // Fallback to localStorage
    return localStorage.getItem('token')
  }
  return null
}

export const api = {
  // Auth
  register: async (data) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  login: async (data) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  // Notes
  getNotes: async () => {
    const res = await fetch(`${API_URL}/notes`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return res.json()
  },

  getNoteById: async (id) => {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return res.json()
  },

  createNote: async (data) => {
    const res = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  // IDOR: API doesn't verify ownership
  updateNote: async (id, data) => {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  // IDOR: API doesn't verify ownership
  deleteNote: async (id) => {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return res.json()
  },

  // Search SQL Injection — intentionally raw, no sanitization
  search: async (q) => {
    const params = new URLSearchParams()
    params.set('q', q)
    const res = await fetch(`${API_URL}/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return res.json()
  },

  // Profile Broken Access Control
  getProfile: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    return res.json()
  },

  updateProfile: async (id, data) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  }
}