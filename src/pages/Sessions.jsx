import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Play,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'

/* ── helpers ──────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDay(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}
function fmtDayNum(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return String(d.getDate()).padStart(2, '0')
}
function fmtTime(start, end) {
  if (!start) return '—'
  const fmt = t => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

/** normalise status: backend may use 'open'/'closed'/'active'/'completed' */
function normStatus(s) {
  if (!s) return 'completed'
  if (s === 'active' || s === 'open') return 'live'
  if (s === 'scheduled' || s === 'pending') return 'upcoming'
  if (s === 'closed' || s === 'completed' || s === 'done') return 'completed'
  return s
}

const COURSE_COLORS = [
  'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
]

function courseColor(courseId) {
  return COURSE_COLORS[(courseId ?? 0) % COURSE_COLORS.length]
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl ${className}`} />
}

/* ── StatusBadge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const norm = normStatus(status)
  if (norm === 'live') return (
    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-white blink" /> Live
    </span>
  )
  if (norm === 'completed') return (
    <span className="badge-present"><CheckCircle2 size={11} /> Completed</span>
  )
  if (norm === 'upcoming') return (
    <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
      <AlertCircle size={11} /> Upcoming
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
      {status}
    </span>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export default function Sessions() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/sessions')
      const list = Array.isArray(data) ? data : (data?.sessions ?? [])
      // sort newest first
      list.sort((a, b) => {
        const da = new Date(a.started_at || a.date || a.created_at || 0)
        const db = new Date(b.started_at || b.date || b.created_at || 0)
        return db - da
      })
      setSessions(list)
    } catch (err) {
      setError(err.message || 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  /* ── derived ── */
  const filtered = sessions.filter((s) => {
    const norm = normStatus(s.status)
    const q = search.toLowerCase().trim()
    const dateStr = s.started_at || s.date || s.created_at
    const fmtFull  = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase() : ''
    const fmtShort = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase() : ''
    const fmtIso   = dateStr ? new Date(dateStr).toISOString().slice(0, 10) : '' // "2026-06-04"
    const matchSearch = !q ||
      (s.course_name ?? '').toLowerCase().includes(q) ||
      (s.course_code ?? '').toLowerCase().includes(q) ||
      (s.title ?? '').toLowerCase().includes(q) ||
      (s.location ?? '').toLowerCase().includes(q) ||
      fmtFull.includes(q) ||
      fmtShort.includes(q) ||
      fmtIso.includes(q)
    const matchFilter = filter === 'all' || norm === filter
    return matchSearch && matchFilter
  })

  const summary = {
    total:     sessions.length,
    completed: sessions.filter(s => normStatus(s.status) === 'completed').length,
    live:      sessions.filter(s => normStatus(s.status) === 'live').length,
    upcoming:  sessions.filter(s => normStatus(s.status) === 'upcoming').length,
  }

  /* ── export CSV ── */
  const handleExport = () => {
    const headers = ['Date', 'Course', 'Code', 'Location', 'Time', 'Attended', 'Enrolled', 'Percentage', 'Status']
    const rows = filtered.map((s) => {
      const attended = s.attended_count ?? 0
      const total    = s.total_enrolled ?? s.enrolled_count ?? s.total ?? 0
      const pct      = total > 0 ? `${Math.round((attended / total) * 100)}%` : '-'
      return [
        fmtDate(s.started_at || s.date || s.created_at),
        `"${s.course_name ?? s.course_code ?? ''}"`,
        s.course_code ?? '',
        `"${s.location ?? ''}"`,
        `"${s.started_at ? new Date(s.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "-"}"`,
        attended,
        total,
        normStatus(s.status) === 'upcoming' ? '-' : pct,
        normStatus(s.status),
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sessions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast(`Exported ${filtered.length} sessions to CSV`)
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sessions</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage and track all attendance sessions</p>
        </div>
        <button onClick={() => navigate('/sessions/live')} className="btn-primary">
          <Play size={15} /> Start New Session
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
          style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
          <AlertCircle size={15} />
          {error}
          <button onClick={fetchSessions} className="ml-auto font-semibold underline flex items-center gap-1">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: summary.total,     color: 'text-slate-800 dark:text-slate-100', bg: 'bg-slate-50 dark:bg-slate-800/50' },
          { label: 'Completed',      value: summary.completed, color: 'text-emerald-600',                   bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Live Now',       value: summary.live,      color: 'text-red-600',                       bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Upcoming',       value: summary.upcoming,  color: 'text-amber-600',                     bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            {loading
              ? <Skeleton className="h-9 w-12 mt-1" />
              : <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card">
        {/* Filters */}
        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by course, date (e.g. Jun 4)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'live', 'completed', 'upcoming'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === f
                    ? 'bg-primary-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="btn-secondary text-sm ml-auto" disabled={loading || sessions.length === 0}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Table Header */}
        <div className="px-5 py-3 grid grid-cols-6 bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Course</div>
          <div className="col-span-1">Attendance</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 grid grid-cols-6 gap-4 items-center">
                <Skeleton className="h-10 col-span-1" />
                <Skeleton className="h-10 col-span-2" />
                <Skeleton className="h-8 col-span-1" />
                <Skeleton className="h-7 w-24 col-span-1" />
                <div className="col-span-1" />
              </div>
            ))
          ) : filtered.map((s) => {
            const norm     = normStatus(s.status)
            const attended = s.attended_count ?? 0
            const total    = s.total_enrolled ?? s.enrolled_count ?? s.total ?? 0
            const pct      = total > 0 ? Math.round((attended / total) * 100) : 0
            const dateStr  = s.started_at || s.date || s.created_at

            return (
              <div key={s.id} className="px-5 py-4 grid grid-cols-6 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Date */}
                <div className="col-span-1 flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-600 leading-none">{fmtDay(dateStr)}</span>
                    <span className="text-xs text-slate-400 leading-none">{fmtDayNum(dateStr)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmtDate(dateStr)}</p>
                    {(s.start_time || s.time) && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> {fmtTime(s.start_time || s.time, s.end_time).split('–')[0].trim()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Course */}
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {s.course_name ?? s.course_code ?? `Session #${s.id}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {s.course_code && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${courseColor(s.course_id)}`}>
                        {s.course_code}
                      </span>
                    )}
                    {s.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <MapPin size={10} /> {s.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Attendance */}
                <div className="col-span-1">
                  {norm === 'upcoming' ? (
                    <span className="text-xs text-slate-400">–</span>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {attended}/{total > 0 ? total : '?'}
                        </span>
                        {total > 0 && (
                          <span className={`text-xs font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-24">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={s.status} />
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  {norm === 'live' ? (
                    <button
                      onClick={() => navigate('/sessions/live')}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <Play size={12} /> Join
                    </button>
                  ) : (
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors">
                      <Eye size={15} />
                    </button>
                  )}
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <MoreVertical size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <Calendar size={24} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-500 dark:text-slate-400">
              {search ? `No sessions match "${search}"` : `No ${filter === 'all' ? '' : filter + ' '}sessions found`}
            </p>
            {(search || filter !== 'all') && (
              <button onClick={() => { setSearch(''); setFilter('all') }}
                className="text-sm text-primary-600 font-semibold hover:underline">
                Clear filters
              </button>
            )}
            {!search && filter === 'all' && (
              <button onClick={() => navigate('/sessions/live')} className="btn-primary mt-2">
                <Play size={15} /> Start First Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}