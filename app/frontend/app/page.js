'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Footer from '../components/Footer'

const SPEECHES = [
  'Ready to exploit.',
  'Target acquired.',
  'Welcome, researcher.',
  'Scanning for vulnerabilities...',
]

const TERMINAL_LOGS = [
  'Scanning...',
  'Found SQLi',
  'Checking Session...',
  'Target Ready',
  'Brute-forcing...',
  'Access Granted.',
]

function VulnLabBot() {
  const [isHovered, setIsHovered] = useState(false)
  const [speech, setSpeech] = useState(SPEECHES[0])

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * SPEECHES.length)
      setSpeech(SPEECHES[randomIndex])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-6 flex flex-col items-center justify-center">
      <div className="relative animate-bounce [animation-duration:3s]">
        
        <style>{`
          @keyframes blink {
            0%, 47%, 100% {
              transform: scaleY(1);
            }
            48%, 52% {
              transform: scaleY(0.1);
            }
          }
          .animate-blink {
            animation: blink 5s infinite;
          }
        `}</style>

        {/* Antenna */}
        <div className="absolute left-1/2 -top-3 h-4 w-0.5 -translate-x-1/2 bg-lime-400">
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-lime-400 animate-pulse" />
        </div>

        {/* Head */}
        <div className="flex h-20 w-24 items-center justify-center rounded-xl border border-lime-500/40 bg-zinc-900 shadow-lg shadow-lime-500/10">
          <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-lime-400 animate-blink origin-center" />
            <div className="h-2 w-2 rounded-full bg-lime-400 animate-blink origin-center [animation-delay:0.2s]" />
          </div>
        </div>

        {/* Body & Hover Interaction */}
        <div
          className="mx-auto mt-2 flex h-10 w-12 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 transition-all hover:bg-zinc-700 hover:border-lime-500/50 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="font-mono text-[10px] text-lime-400 transition-all group-hover:text-lime-300 group-hover:font-bold">
            {isHovered ? 'ROOT' : 'BOT'}
          </span>
        </div>

        {/* Arms */}
        <div className="absolute left-0 top-[82px] h-0.5 w-6 rotate-12 bg-zinc-500" />
        <div className="absolute right-0 top-[82px] h-0.5 w-6 -rotate-12 bg-zinc-500" />

        {/* Legs */}
        <div className="mx-auto mt-1 flex w-8 justify-between">
          <div className="h-5 w-0.5 bg-zinc-500" />
          <div className="h-5 w-0.5 bg-zinc-500" />
        </div>
      </div>
      
      {/* ข้อความพูดของบอท */}
      <p className="mt-2 text-center font-mono text-xs text-lime-400 animate-pulse [animation-duration:4s]">
        &gt; {speech}
      </p>
    </div>
  )
}

// Terminal Log เปลี่ยนข้อความวน
function TerminalLog() {
  const [currentLogIndex, setCurrentLogIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogIndex((prevIndex) => (prevIndex + 1) % TERMINAL_LOGS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // สร้างรายการ log ที่จะแสดง
  const displayedLogs = []
  for (let i = 0; i < 4; i++) {
    const index = (currentLogIndex + i) % TERMINAL_LOGS.length
    displayedLogs.push(TERMINAL_LOGS[index])
  }

  return (
    <div className="mt-10 rounded-3xl border border-zinc-800 bg-black/50 p-6 font-mono text-sm shadow-2xl shadow-lime-500/5">
      
      {/* ส่วน Header ของ Terminal */}
      <div className="mb-4 flex items-center text-lime-400">
        <span className="mr-2">root@vulnlab:~$</span>
        <span className="flex items-center">
          ./exploit.sh
          <span className="ml-1 inline-block h-4 w-2 bg-lime-400 animate-pulse"></span>
        </span>
      </div>

      {/* ส่วนแสดง Log */}
      <div className="space-y-1.5 text-zinc-400">
        <div key={currentLogIndex} className="animate-fade-up">
           {displayedLogs.map((log, index) => (
              <div key={index} className={`transition-colors duration-300 ${index === displayedLogs.length - 1 ? 'text-lime-300 font-semibold' : ''}`}>
                [{index === displayedLogs.length - 1 ? '+' : '*'}] {log}
              </div>
            ))}
        </div>
      </div>
      
       <style>{`
        @keyframes fade-up {
          0% { transform: translateY(4px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-up {
          animation: fade-up 0.3s ease-out;
        }
      `}</style>

      {/* ส่วน Status ด้านล่างสุด */}
      <div className="mt-6 flex items-center text-cyan-400">
        Status: <span className="mx-2 inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse"/> Running...
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = isLogin
        ? await api.login({
            email: form.email,
            password: form.password,
          })
        : await api.register({
            username: form.username,
            email: form.email,
            password: form.password,
          })

      if (res.token) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        document.cookie = `token=${res.token}; path=/; SameSite=Strict`
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/notes')
      } else {
        setError(res.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Connection failed or Server Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white selection:bg-lime-500/30">
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a20_1px,transparent_1px),linear-gradient(to_bottom,#27272a20_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glow */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-2xl">
          <div className="grid lg:grid-cols-2">
            
            {/* LEFT PANEL */}
            <div className="hidden lg:flex flex-col justify-between border-r border-zinc-800 p-12">
              <div>
                <div className="mb-8 flex items-center gap-2 text-xs font-medium tracking-widest text-lime-400">
                  <div className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                  SYSTEM ONLINE
                </div>

                <div>
                  <VulnLabBot />
                  <h1 className="text-center text-6xl font-black tracking-[0.15em] text-white">
                    VULNLAB
                  </h1>
                  <p className="mt-3 text-center text-sm uppercase tracking-[0.3em] text-lime-400">
                    Offensive Security Playground
                  </p>
                </div>

                <p className="mt-10 max-w-md text-lg leading-relaxed text-zinc-400">
                  Learn web security through real-world vulnerabilities,
                  exploit chains, and offensive security challenges.
                </p>
              </div>

              <TerminalLog />
            </div>

            {/* RIGHT PANEL */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mx-auto max-w-md w-full">
                
                {/* Mobile Header */}
                <div className="mb-8 text-center lg:hidden">
                  <VulnLabBot />
                  <h1 className="text-4xl font-black tracking-[0.15em] text-white">
                    VULNLAB
                  </h1>
                  <p className="mt-3 text-zinc-400">
                    Practice. Exploit. Learn.
                  </p>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white">
                    {isLogin ? 'Access Terminal' : 'Agent Registration'}
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    {isLogin
                      ? 'Authenticate to continue.'
                      : 'Initialize new credentials.'}
                  </p>
                </div>

                {/* Toggle Login/Register */}
                <div className="mb-8 flex rounded-2xl border border-zinc-800 bg-zinc-900/70 p-1.5 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true)
                      setError('')
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${
                      isLogin
                        ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-black shadow-lg shadow-lime-500/20'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false)
                      setError('')
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${
                      !isLogin
                        ? 'bg-gradient-to-r from-lime-400 to-lime-500 text-black shadow-lg shadow-lime-500/20'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="mb-2 block text-sm text-zinc-300">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={form.username}
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white outline-none transition focus:border-lime-500 focus:bg-zinc-800"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white outline-none transition focus:border-lime-500 focus:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white outline-none transition focus:border-lime-500 focus:bg-zinc-800"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in duration-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      group
                      relative
                      w-full
                      overflow-hidden
                      rounded-2xl
                      bg-gradient-to-r
                      from-lime-400
                      to-lime-500
                      py-4
                      font-semibold
                      text-black
                      transition-all
                      duration-300
                      hover:scale-[1.02]
                      hover:shadow-xl
                      hover:shadow-lime-500/30
                      active:scale-[0.98]
                      disabled:opacity-70
                      disabled:hover:scale-100
                      mt-2
                    "
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      ) : isLogin ? (
                        'Sign In'
                      ) : (
                        'Create Account'
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <Footer />

      </div>
    </div>
  )
}