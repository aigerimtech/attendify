import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
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
} from 'lucide-react'

const sessions = [
  { id: 1, date: 'Oct 24, 2023', day: 'Thu', course: 'CS101: Intro to Java', code: 'CS101', location: 'Lecture Hall A', time: '10:00 AM – 11:30 AM', attended: 38, total: 42, status: 'completed' },
  { id: 2, date: 'Oct 22, 2023', day: 'Tue', course: 'CS101: Intro to Java', code: 'CS101', location: 'Lab 3', time: '02:00 PM – 03:30 PM', attended: 35, total: 42, status: 'completed' },
  { id: 3, date: 'Oct 21, 2023', day: 'Mon', course: 'DS200: Data Structures', code: 'DS200', location: 'Lecture Hall B', time: '09:00 AM – 10:50 AM', attended: 40, total: 45, status: 'completed' },
  { id: 4, date: 'Oct 20, 2023', day: 'Sun', course: 'CS101: Intro to Java', code: 'CS101', location: 'Lecture Hall A', time: '10:00 AM – 11:30 AM', attended: 39, total: 42, status: 'completed' },
  { id: 5, date: 'Oct 18, 2023', day: 'Fri', course: 'SE400: Software Engineering', code: 'SE400', location: 'Lab 3', time: '01:00 PM – 04:00 PM', attended: 31, total: 35, status: 'completed' },
  { id: 6, date: 'Oct 17, 2023', day: 'Thu', course: 'CS301: Algorithms', code: 'CS301', location: 'Room 214', time: '02:00 PM – 03:30 PM', attended: 34, total: 38, status: 'completed' },
  { id: 7, date: 'Oct 25, 2023', day: 'Wed', course: 'CS101: Intro to Java', code: 'CS101', location: 'Lecture Hall A', time: '10:00 AM – 11:30 AM', attended: 42, total: 42, status: 'live' },
  { id: 8, date: 'Oct 26, 2023', day: 'Thu', course: 'DS200: Data Structures', code: 'DS200', location: 'Lecture Hall B', time: '09:00 AM – 10:50 AM', attended: 0, total: 45, status: 'upcoming' },
]

const courseColors = {
  CS101: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  DS200: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  CS301: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  SE400: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
}

function StatusBadge({ status }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-white blink" /> Live
    </span>
  )
  if (status === 'completed') return (
    <span className="badge-present"><CheckCircle2 size={11} /> Completed</span>
  )
  if (status === 'upcoming') return (
    <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
      <AlertCircle size={11} /> Upcoming
    </span>
  )
  return null
}

export default function Sessions() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = sessions.filter((s) => {
    const matchSearch = s.course.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.status === filter
    return matchSearch && matchFilter
  })

  const summary = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === 'completed').length,
    live: sessions.filter((s) => s.status === 'live').length,
    upcoming: sessions.filter((s) => s.status === 'upcoming').length,
  }

  const handleExport = () => {
    const headers = ['Date', 'Course', 'Location', 'Time', 'Attended', 'Total', 'Percentage', 'Status']
    const rows = filtered.map((s) => [
      s.date,
      `"${s.course}"`,
      `"${s.location}"`,
      `"${s.time}"`,
      s.attended,
      s.total,
      s.status !== 'upcoming' ? `${Math.round((s.attended / s.total) * 100)}%` : '—',
      s.status,
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: summary.total, color: 'text-slate-800 dark:text-slate-100', bg: 'bg-slate-50 dark:bg-slate-800/50' },
          { label: 'Completed', value: summary.completed, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Live Now', value: summary.live, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Upcoming', value: summary.upcoming, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
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
              placeholder="Search sessions..."
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
          <button onClick={handleExport} className="btn-secondary text-sm ml-auto">
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
          {filtered.map((s) => {
            const pct = Math.round((s.attended / s.total) * 100)
            return (
              <div key={s.id} className="px-5 py-4 grid grid-cols-6 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Date */}
                <div className="col-span-1 flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-600 leading-none">{s.day}</span>
                    <span className="text-xs text-slate-400 leading-none">{s.date.split(',')[0].slice(-2)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{s.date}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {s.time.split('–')[0].trim()}
                    </p>
                  </div>
                </div>

                {/* Course */}
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.course}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${courseColors[s.code] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {s.code}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <MapPin size={10} /> {s.location}
                    </span>
                  </div>
                </div>

                {/* Attendance */}
                <div className="col-span-1">
                  {s.status === 'upcoming' ? (
                    <span className="text-xs text-slate-400">–</span>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.attended}/{s.total}</span>
                        <span className={`text-xs font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-24">
                        <div
                          className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={s.status} />
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  {s.status === 'live' ? (
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

        {filtered.length === 0 && (
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
          </div>
        )}
      </div>
    </div>
  )
}
