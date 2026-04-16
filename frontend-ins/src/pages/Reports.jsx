import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Calendar,
  Plus,
  Mail,
  ClockIcon,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const students = [
  { id: '48291', name: 'Alice Johnson', avatar: null, initials: 'AJ', color: 'bg-violet-500', lastActive: 'Today, 9:00 AM', absenceRate: 5, risk: 'present' },
  { id: '48292', name: 'Mark Smith', avatar: null, initials: 'MS', color: 'bg-slate-500', lastActive: 'Yesterday, 2:00 PM', absenceRate: 22, risk: 'critical' },
  { id: '48293', name: 'Sophie Chen', avatar: null, initials: 'SC', color: 'bg-pink-500', lastActive: 'Oct 24, 10:15 AM', absenceRate: 15, risk: 'at-risk' },
  { id: '48294', name: 'David Kim', avatar: null, initials: 'DK', color: 'bg-blue-500', lastActive: 'Oct 23, 11:00 AM', absenceRate: 4, risk: 'present' },
  { id: '48295', name: 'Emma Lewis', avatar: null, initials: 'EL', color: 'bg-teal-500', lastActive: 'Oct 23, 9:30 AM', absenceRate: 3, risk: 'present' },
  { id: '48296', name: 'James Liu', avatar: null, initials: 'JL', color: 'bg-amber-500', lastActive: 'Oct 22, 2:30 PM', absenceRate: 7, risk: 'present' },
  { id: '48297', name: 'Nina Patel', avatar: null, initials: 'NP', color: 'bg-rose-500', lastActive: 'Oct 21, 1:00 PM', absenceRate: 18, risk: 'at-risk' },
  { id: '48298', name: 'Carlos Reyes', avatar: null, initials: 'CR', color: 'bg-indigo-500', lastActive: 'Oct 20, 10:00 AM', absenceRate: 2, risk: 'present' },
]

const highRiskStudent = students.find((s) => s.risk === 'critical')

function RiskBadge({ risk }) {
  if (risk === 'present') return <span className="badge-present"><CheckCircle2 size={11} /> Present</span>
  if (risk === 'critical') return <span className="badge-critical"><XCircle size={11} /> CRITICAL</span>
  if (risk === 'at-risk') return <span className="badge-at-risk"><AlertTriangle size={11} /> AT RISK</span>
  return null
}

function GaugeChart({ value, isDark }) {
  const clamp = Math.min(Math.max(value, 0), 100)
  const arcLen = (clamp / 100) * 157
  const color = clamp >= 20 ? '#ef4444' : clamp >= 10 ? '#f59e0b' : '#10b981'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const trackColor = isDark ? '#2e3748' : '#f1f5f9'

  return (
    <div className="w-40 mx-auto">
      <svg viewBox="0 0 120 80" className="w-full overflow-visible">
        <path d="M10,68 A50,50 0 0,1 110,68" fill="none" stroke={trackColor} strokeWidth="10" strokeLinecap="round" />
        <path
          d="M10,68 A50,50 0 0,1 110,68"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} 157`}
        />
        <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill={textColor} fontFamily="Inter, sans-serif">
          {clamp}%
        </text>
        <text x="60" y="76" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">
          Absence Rate
        </text>
      </svg>
    </div>
  )
}

export default function Reports() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCourse, setSelectedCourse] = useState('CS101 - Fall 2025')
  const [selectedStudent, setSelectedStudent] = useState(highRiskStudent)
  const { isDark } = useTheme()

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.includes(search)
  )

  const pageSize = 6
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Course Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#17162a] border border-[#e0e7ff] dark:border-[#2e2c48] rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-5"
            >
              <option>CS101 - Fall 2025</option>
              <option>DS200 - Fall 2025</option>
              <option>CS301 - Fall 2025</option>
            </select>
            <ChevronDown size={13} className="text-slate-400 pointer-events-none flex-shrink-0 -ml-4" />
          </div>

          <button className="btn-secondary text-sm">
            <Calendar size={14} />
            Last 30 Days
          </button>

          <button className="btn-primary text-sm">
            <Plus size={15} />
            New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* High Risk Card */}
        {selectedStudent && (
          <div className="lg:col-span-1 card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full uppercase tracking-wide">
                High Risk
              </span>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg width="16" height="4" viewBox="0 0 16 4"><circle cx="2" cy="2" r="2" fill="currentColor"/><circle cx="8" cy="2" r="2" fill="currentColor"/><circle cx="14" cy="2" r="2" fill="currentColor"/></svg>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className={`w-20 h-20 ${selectedStudent.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md`}>
                {selectedStudent.initials}
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{selectedStudent.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M8 2v4M16 2v4M2 10h20"/></svg>
                ID: {selectedStudent.id}
              </p>
            </div>

            {/* Gauge */}
            <GaugeChart value={selectedStudent.absenceRate} isDark={isDark} />

            {/* Critical Status */}
            {selectedStudent.absenceRate >= 20 && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-600">Critical Status</p>
                  <p className="text-xs text-red-500">Absence rate exceeds the 20% warning threshold.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-secondary text-xs justify-center py-2">
                <Mail size={13} /> Contact
              </button>
              <button className="btn-secondary text-xs justify-center py-2">
                <ClockIcon size={13} /> History
              </button>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="lg:col-span-3 card">
          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Students</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">45</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Avg. Attendance</p>
              <p className="text-3xl font-bold text-emerald-600">92%</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">At Risk</p>
              <p className="text-3xl font-bold text-red-600">3</p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="btn-secondary text-sm">
              <Filter size={14} /> Filter
            </button>
            <button className="btn-secondary text-sm">
              <ArrowUpDown size={14} /> Sort
            </button>
            <button className="btn-secondary text-sm">
              <Download size={14} /> Export
            </button>
          </div>

          {/* Table Header */}
          <div className="px-5 py-3 grid grid-cols-3 bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student Name</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Last Active</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Risk Level</p>
          </div>

          {/* Student Rows */}
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {paginated.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`px-5 py-4 grid grid-cols-3 items-center cursor-pointer transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-900/20 ${
                  selectedStudent?.id === s.id ? 'bg-primary-50/40 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${s.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {s.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">ID: {s.id}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.lastActive}</p>
                <div className="flex justify-end">
                  <RiskBadge risk={s.risk} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} students
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
