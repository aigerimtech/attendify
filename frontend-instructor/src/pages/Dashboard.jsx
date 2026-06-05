import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  BookOpen,
  Wifi,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  Download,
  ChevronRight,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

/* ── helpers ──────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
}
function fmtTime(start, end) {
  if (!start) return '—'
  const fmt = t => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

/* ── skeleton ─────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl ${className}`} />
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [courses,        setCourses]        = useState([])
  const [sessions,       setSessions]       = useState([])
  const [totalStudents,  setTotalStudents]  = useState(null)
  const [activeSessions, setActiveSessions] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        // fetch courses & sessions in parallel
        const [coursesData, sessionsData] = await Promise.all([
          api.get('/courses'),
          api.get('/sessions').catch(() => []),
        ])

        if (cancelled) return

        const courseList = Array.isArray(coursesData) ? coursesData : (coursesData?.courses ?? [])
        const sessionList = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions ?? [])

        setCourses(courseList)

        // sort sessions newest first
        const sorted = [...sessionList].sort((a, b) => {
          const da = new Date(a.started_at || a.date || a.created_at || 0)
          const db = new Date(b.date || b.created_at || 0)
          return db - da
        })
        setSessions(sorted)

        // active sessions
        const active = sorted.filter(s => s.status === 'active' || s.status === 'open')
        setActiveSessions(active)

        // count total students across all courses
        if (courseList.length > 0) {
          const counts = await Promise.all(
            courseList.map(c =>
              api.get(`/courses/${c.id}/students`).then(r => {
                const arr = Array.isArray(r) ? r : (r?.students ?? [])
                return arr.length
              }).catch(() => c.student_count ?? 0)
            )
          )
          if (!cancelled) {
            setTotalStudents(counts.reduce((a, b) => a + b, 0))
          }
        } else {
          setTotalStudents(0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const recentSessions = sessions.slice(0, 4)

  // next upcoming session (status != closed/active, future date)
  const upcomingSession = sessions.find(s => {
    if (s.status === 'active' || s.status === 'open') return false
    const d = new Date(s.date || s.scheduled_at || 0)
    return d > new Date()
  }) ?? null

  const displayName = user?.name ?? 'Instructor'

  return (
    <div className="fade-in space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-800" />
          Overview
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back,{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span>.
          {' '}Review your active sessions and upcoming classes below.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-violet-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
              <TrendingUp size={11} />
              Enrolled
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Students</p>
            {loading ? (
              <Skeleton className="h-10 w-20 mt-1" />
            ) : (
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {totalStudents ?? '—'}
              </p>
            )}
          </div>
        </div>

        {/* Total Courses */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">This semester</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Courses</p>
            {loading ? (
              <Skeleton className="h-10 w-16 mt-1" />
            ) : (
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {courses.length}
              </p>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div
          className="card p-6 text-white relative overflow-hidden cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 4px 20px rgba(67,56,202,.3)' }}
          onClick={() => navigate('/sessions/live')}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-white/10 pulse-anim" />
              <div className="absolute inset-2 rounded-full bg-white/10 pulse-anim" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-4 rounded-full bg-white/20 flex items-center justify-center">
                <Wifi size={16} className="text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wifi size={20} className="text-white" />
            </div>
            {activeSessions.length > 0 && <span className="badge-live">LIVE</span>}
          </div>
          <p className="text-xs font-semibold text-primary-100 uppercase tracking-widest">Active Sessions</p>
          {loading ? (
            <div className="animate-pulse bg-white/20 rounded-xl h-10 w-16 mt-1" />
          ) : (
            <p className="text-4xl font-bold mt-0.5">{activeSessions.length}</p>
          )}
          <p className="text-sm text-primary-100 mt-1">
            {activeSessions.length > 0
              ? `${activeSessions[0].course_name ?? 'Session'} in progress`
              : 'No active sessions'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary-800 rounded-full" />
              Recent Sessions
            </h2>
            <button
              onClick={() => navigate('/sessions')}
              className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {/* Table Header */}
          <div className="px-6 py-3 grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course Details</p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 grid grid-cols-2 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ))
            ) : recentSessions.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                No sessions yet. Start your first session!
              </div>
            ) : (
              recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-4 grid grid-cols-2 gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/sessions')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Calendar size={14} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {fmtDate(s.started_at || s.date || s.created_at)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {fmtDay(s.started_at || s.date || s.created_at)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {s.course_name ?? s.course_code ?? `Session #${s.id}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {s.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <MapPin size={11} /> {s.location}
                        </span>
                      )}
                      {(s.start_time || s.time) && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Clock size={11} /> {fmtTime(s.start_time || s.time, s.end_time)}
                        </span>
                      )}
                      {s.attended_count != null && s.enrolled_count != null && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {s.attended_count}/{s.enrolled_count} present
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Class */}
          <div className="card p-5">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-primary-800 rounded-full" />
              Upcoming Class
            </h2>

            {loading ? (
              <Skeleton className="h-32 mb-4" />
            ) : upcomingSession ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink" />
                    Scheduled
                  </span>
                  <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                    <Clock size={13} className="text-primary-600" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">
                  {upcomingSession.course_name ?? upcomingSession.course_code ?? 'Upcoming'}
                </h3>
                {upcomingSession.location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin size={11} /> {upcomingSession.location}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> {fmtDate(upcomingSession.date)}
                  {upcomingSession.start_time && ` · ${fmtTime(upcomingSession.start_time, upcomingSession.end_time)}`}
                </p>
              </div>
            ) : courses.length > 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    No upcoming sessions
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">
                  {courses[0].name ?? courses[0].course_name ?? 'Your course'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Schedule a session to get started
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 text-center text-sm text-slate-400">
                No courses yet.
              </div>
            )}

            <button
              onClick={() => navigate('/sessions/live')}
              className="btn-primary w-full justify-center text-sm"
            >
              Start a Session
            </button>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/courses')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <PlusCircle size={15} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Create New Course</span>
                <ChevronRight size={14} className="ml-auto text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <Download size={15} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Weekly Report</span>
                <ChevronRight size={14} className="ml-auto text-slate-400" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors group"
              >
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <AlertCircle size={15} className="text-amber-500 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">At-Risk Students</span>
                <ChevronRight size={14} className="ml-auto text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
