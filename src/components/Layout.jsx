import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Play, Bell, User, Settings, HelpCircle, LogOut,
  ChevronDown, Menu, X, CheckCircle2, AlertTriangle, Info,
  Sun, Moon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'

/* ── LogoMark ─────────────────────────────────────────────────── */
function LogoMark({ size = 34 }) {
  const br = Math.round(18 * (size / 64))
  const iconSize = Math.round(size * 0.48)
  return (
    <div style={{
      width: size, height: size, borderRadius: br,
      background: 'linear-gradient(135deg, #3730a3, #4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24"
        fill="none" stroke="#fff" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    </div>
  )
}

/* ── Demo notifications ───────────────────────────────────────── */
const NOTIFS_KEY = 'attendify_notifs'
const defaultNotifs = [
  { id: 1, icon: 'alert',   title: 'Low attendance detected',  desc: 'CS101 session dropped below 70%',                   time: '2 min ago', read: false },
  { id: 2, icon: 'warning', title: 'At-risk student alert',    desc: 'Alex J. has missed 4 consecutive sessions',         time: '1 hr ago',  read: false },
  { id: 3, icon: 'info',    title: 'Weekly report ready',      desc: 'Your attendance summary for this week is available', time: '3 hr ago',  read: true  },
  { id: 4, icon: 'success', title: 'Session completed',        desc: 'DS200 session recorded — 40/45 attended',           time: 'Yesterday', read: true  },
]

function loadNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY)) || defaultNotifs }
  catch { return defaultNotifs }
}

/* ── Notification dropdown ────────────────────────────────────── */
function NotificationPanel({ onClose }) {
  const { isDark } = useTheme()
  const [notifs, setNotifs] = useState(loadNotifs)

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }))
    setNotifs(updated)
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated))
  }

  const markRead = (id) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifs(updated)
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated))
  }

  const iconMap = {
    alert:   { Icon: AlertTriangle, bg: 'bg-rose-50',   color: 'text-rose-500'    },
    warning: { Icon: AlertTriangle, bg: 'bg-amber-50',  color: 'text-amber-500'   },
    info:    { Icon: Info,          bg: 'bg-blue-50',   color: 'text-blue-500'    },
    success: { Icon: CheckCircle2,  bg: 'bg-emerald-50',color: 'text-emerald-500' },
  }

  const panelStyle = isDark
    ? { background: '#17162a', border: '1px solid #2e2c48', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }
    : { border: '1px solid #e0e7ff', boxShadow: '0 8px 32px rgba(67,56,202,.15)' }

  const headerBg = isDark ? '#1e1c30' : '#f0f2ff'
  const headerBorder = isDark ? '#2e2c48' : '#e0e7ff'

  return (
    <div
      className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl overflow-hidden z-50 bg-white dark:bg-[#17162a]"
      style={panelStyle}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ background: headerBg }}>
        <span className="text-sm font-bold" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>Notifications</span>
        <button onClick={markAllRead} className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
          Mark all read
        </button>
      </div>
      <div style={{ borderTop: `1px solid ${headerBorder}` }} />

      <div className="max-h-72 overflow-y-auto">
        {notifs.map(({ id, icon, title, desc, time, read }) => {
          const { Icon, bg, color } = iconMap[icon] || iconMap.info
          return (
            <button key={id} onClick={() => markRead(id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b last:border-0 ${
                !read
                  ? 'bg-indigo-50/40 dark:bg-indigo-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-[#1e1c30]'
              }`}
              style={{ borderColor: isDark ? '#252338' : '#f0f2ff' }}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} dark:bg-opacity-20`}>
                <Icon size={14} className={color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold truncate ${read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{title}</p>
                  {!read && <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{time}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Avatar Dropdown ──────────────────────────────────────────── */
function AvatarDropdown({ navigate, user, logout }) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const menuItems = [
    { icon: User,       label: 'My Profile',      action: () => navigate('/settings') },
    { icon: Settings,   label: 'Account Settings', action: () => navigate('/settings') },
    { icon: Bell,       label: 'Notifications',    action: () => {}                    },
    { icon: HelpCircle, label: 'Help & Support',   action: () => {}                    },
  ]

  const dropStyle = isDark
    ? { background: '#17162a', border: '1px solid #2e2c48', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }
    : { border: '1px solid #e0e7ff', boxShadow: '0 8px 32px rgba(67,56,202,.15)' }

  const headerBg  = isDark ? '#1e1c30' : '#f0f2ff'
  const divider   = isDark ? '#2e2c48' : '#e0e7ff'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-primary-50 dark:hover:bg-[#1e1c30] transition-colors">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)' }}>
          {user?.initials || 'PS'}
        </div>
        <ChevronDown size={14} className="text-slate-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white rounded-2xl overflow-hidden z-50"
          style={dropStyle}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ background: headerBg }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)' }}>
              {user?.initials || 'PS'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>{user?.name || 'Prof. Smith'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'prof.smith@university.edu'}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: isDark ? '#2e2c48' : '#e0e7ff', color: '#4338ca' }}>Instructor</span>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${divider}` }} />
          <div className="py-1.5">
            {menuItems.map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={() => { action(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#1e1c30] hover:text-primary-700 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-50 dark:bg-[#2e2c48]">
                  <Icon size={14} className="text-primary-500" />
                </div>
                {label}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${divider}` }} />
          <div className="py-1.5">
            <button onClick={() => { setOpen(false); logout(); navigate('/login') }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-rose-50 dark:bg-rose-900/30">
                <LogOut size={14} className="text-rose-500" />
              </div>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Nav items ────────────────────────────────────────────────── */
const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses',   label: 'Courses'   },
  { to: '/sessions',  label: 'Sessions'  },
  { to: '/schedule',  label: 'Schedule'  },
  { to: '/reports',   label: 'Reports'   },
  { to: '/settings',  label: 'Settings'  },
]

/* ── Layout ───────────────────────────────────────────────────── */
export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const isLiveSession = location.pathname === '/sessions/live'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [endingSession, setEndingSession] = useState(false)
  const notifRef = useRef(null)

  const handleEndSession = async () => {
    setEndingSession(true)
    try {
      const data = await api.get('/sessions?status=live&per_page=10')
      const list = Array.isArray(data) ? data : (data?.sessions ?? data?.items ?? [])
      const live = list.find(s => !s.ended_at)
      if (live) await api.post(`/sessions/${live.id}/close`)
    } catch {
      // best-effort — navigate regardless
    } finally {
      setEndingSession(false)
      navigate('/dashboard')
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const unreadCount = loadNotifs().filter(n => !n.read).length

  /* Dark-mode aware values — only deviate from light defaults in dark */
  const navBg       = isDark ? '#1e1c30' : '#eef2ff'
  const activeStyle = isDark
    ? { background: '#17162a', color: '#a5b4fc', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }
    : { color: '#4338ca', boxShadow: '0 1px 4px rgba(67,56,202,.12)' }
  const inactiveStyle = isDark ? { color: '#8b8faa' } : {}

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? '#0e0d1c' : '#f0f2ff' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#17162a] sticky top-0 z-50 flex-shrink-0"
        style={{ borderBottom: isDark ? '1px solid #2e2c48' : '1px solid #e0e7ff', boxShadow: '0 1px 4px rgba(67,56,202,.07)' }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <LogoMark size={32} />
            <span className="font-bold text-lg tracking-tight" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>Attendify</span>
          </div>

          {/* Desktop nav pill */}
          <nav className="hidden md:flex items-center rounded-2xl p-1 gap-0.5" style={{ background: navBg }}>
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'px-4 py-1.5 rounded-xl text-sm font-bold bg-white transition-all'
                    : 'px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-primary-100 dark:hover:bg-[#2e2c48] transition-all'
                }
                style={({ isActive }) => isActive ? activeStyle : inactiveStyle}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Start Session - only when no active session */}
            {!isLiveSession && (
              <div className="hidden sm:block">
                <button onClick={() => navigate('/sessions/live')} className="btn-primary text-sm">
                  <Play size={14} /> Start Session
                </button>
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-primary-50 dark:hover:bg-[#1e1c30]"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun size={17} className="text-amber-400" />
                : <Moon size={17} className="text-slate-500" />
              }
            </button>

            {/* Bell + notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-primary-50 dark:hover:bg-[#1e1c30]">
                <Bell size={17} className="text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#17162a]" />
                )}
              </button>
              {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
            </div>

            {/* Avatar dropdown — desktop only */}
            <div className="hidden md:block">
              <AvatarDropdown navigate={navigate} user={user} logout={logout} />
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-primary-50 dark:hover:bg-[#1e1c30]">
              {mobileMenuOpen
                ? <X size={18} className="text-slate-600 dark:text-slate-300" />
                : <Menu size={18} className="text-slate-600 dark:text-slate-300" />
              }
            </button>
          </div>
        </div>

        {/* ── Mobile menu ───────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-[#17162a]"
            style={{ borderColor: isDark ? '#2e2c48' : '#e0e7ff' }}>
            <nav className="px-4 pt-3 pb-2 flex flex-col gap-1">
              {navItems.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    isActive
                      ? 'px-4 py-2.5 rounded-xl text-sm font-bold transition-all'
                      : 'px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-primary-50 dark:hover:bg-[#1e1c30] hover:text-primary-700 transition-all'
                  }
                  style={({ isActive }) => isActive
                    ? { background: isDark ? '#1e1c30' : '#eef2ff', color: isDark ? '#a5b4fc' : '#4338ca' }
                    : isDark ? { color: '#8b8faa' } : {}
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div style={{ borderTop: isDark ? '1px solid #2e2c48' : '1px solid #e0e7ff' }} />
            <div className="px-4 py-3 sm:hidden">
              {isLiveSession ? (
                <button onClick={handleEndSession} disabled={endingSession} className="btn-danger text-sm w-full justify-center disabled:opacity-70">
                  <span className="w-2 h-2 rounded-full bg-white blink" /> {endingSession ? 'Ending…' : 'End Session'}
                </button>
              ) : (
                <button onClick={() => navigate('/sessions/live')} className="btn-primary text-sm w-full justify-center">
                  <Play size={14} /> Start Session
                </button>
              )}
            </div>
            <div style={{ borderTop: isDark ? '1px solid #2e2c48' : '1px solid #e0e7ff' }} />
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)' }}>
                  {user?.initials || 'PS'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>{user?.name || 'Prof. Smith'}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/login') }}
                className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

    </div>
  )
}