import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'
import {
  Search, Filter, ArrowUpDown, ChevronDown, Calendar, Play,
  AlertTriangle, XCircle, CheckCircle2, Download, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, BookOpen, List,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/* ── helpers ──────────────────────────────────────────────────── */
function absenceRate(student) {
  if (student.absence_rate != null) return Math.round(student.absence_rate * 100)
  if (student.attendance_rate != null) return Math.round((1 - student.attendance_rate / 100) * 100)
  if (student.absenceRate != null) return student.absenceRate
  return null
}
function riskLevel(rate, threshold = 30) {
  if (rate === null) return 'unknown'
  if (rate >= threshold) return 'critical'
  if (rate >= threshold * 0.5) return 'at-risk'
  return 'safe'
}
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-slate-500', 'bg-pink-500', 'bg-blue-500',
  'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-orange-500',
]
function avatarColor(id) {
  const n = typeof id === 'string' ? id.charCodeAt(0) : (id ?? 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl ${className}`} />
}

/* ── RiskBadge ────────────────────────────────────────────────── */
function RiskBadge({ rate, threshold = 30 }) {
  if (rate === null) return <span className="text-xs text-slate-400">—</span>
  const level = riskLevel(rate, threshold)
  if (level === 'safe')     return <span className="badge-present"><CheckCircle2 size={11} /> Safe</span>
  if (level === 'critical') return <span className="badge-critical"><XCircle size={11} /> CRITICAL</span>
  if (level === 'at-risk')  return <span className="badge-at-risk"><AlertTriangle size={11} /> AT RISK</span>
  return null
}

/* ── GaugeChart ───────────────────────────────────────────────── */
function GaugeChart({ value, isDark, threshold = 30 }) {
  if (value === null) {
    return (
      <div className="w-40 mx-auto flex items-center justify-center h-20 text-sm text-slate-400">
        No data yet
      </div>
    )
  }
  const clamp = Math.min(Math.max(value, 0), 100)
  const arcLen = (clamp / 100) * 157
  const color = clamp >= threshold ? '#ef4444' : clamp >= threshold * 0.5 ? '#f59e0b' : '#10b981'
  const textColor = isDark ? '#e2e8f0' : '#1e293b'
  const trackColor = isDark ? '#2e3748' : '#f1f5f9'
  return (
    <div className="w-40 mx-auto">
      <svg viewBox="0 0 120 80" className="w-full overflow-visible">
        <path d="M10,68 A50,50 0 0,1 110,68" fill="none" stroke={trackColor} strokeWidth="10" strokeLinecap="round" />
        <path d="M10,68 A50,50 0 0,1 110,68" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arcLen} 157`} />
        <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill={textColor} fontFamily="Inter, sans-serif">{clamp}%</text>
        <text x="60" y="76" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">Absence Rate</text>
      </svg>
    </div>
  )
}

/* ── Session Export Button ────────────────────────────────────── */
function SessionExportButton({ session, courseCode }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/sessions/${session.id}/attendance`)
      const records = data?.records ?? []
      const sessionDate = fmtDate(session.started_at)
      const sessionTime = fmtTime(session.started_at)

      const titleRows = [
        [`${courseCode} – Session Report`],
        [`Date: ${sessionDate}  Time: ${sessionTime}`],
        [`Total Enrolled: ${data.total_enrolled ?? '—'}  Present: ${data.total_present ?? '—'}  Rate: ${data.attendance_rate ?? '—'}%`],
        [],
        ['Student ID', 'Full Name', 'Status', 'Face Verified', 'QR Verified', 'Time'],
      ]
      const dataRows = records.map(r => {
        const firstName = r.student?.user?.first_name ?? ''
        const lastName  = r.student?.user?.last_name  ?? ''
        const fullName  = (firstName + ' ' + lastName).trim() || `#${r.student_id}`
        const studentNum = r.student?.student_number ?? r.student_id ?? '—'
        return [
          studentNum,
          fullName,
          r.status ?? 'present',
          r.face_validated ? 'Yes' : 'No',
          r.qr_validated   ? 'Yes' : 'No',
          r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
        ]
      })

      const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...dataRows])
      ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 10 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
      XLSX.writeFile(wb, `session_${courseCode}_${session.id}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      alert('Failed to export: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
    >
      <Download size={13} />
      {loading ? 'Exporting…' : 'Export'}
    </button>
  )
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Reports() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [tab,             setTab]             = useState('students') // 'students' | 'sessions'
  const [courses,         setCourses]         = useState([])
  const [students,        setStudents]        = useState([])
  const [sessions,        setSessions]        = useState([])
  const [selectedCourse,  setSelectedCourse]  = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loadingCourses,  setLoadingCourses]  = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [error,           setError]           = useState('')
  const [search,          setSearch]          = useState('')
  const [page,            setPage]            = useState(1)
  const [dateRange,       setDateRange]       = useState('30d')
  const [threshold,       setThreshold]       = useState(30)

  /* ── load system config ── */
  useEffect(() => {
    api.get('/settings/system-config')
      .then((cfg) => { if (cfg?.absence_threshold != null) setThreshold(cfg.absence_threshold) })
      .catch(() => {})
  }, [])

  /* ── load courses ── */
  useEffect(() => {
    async function load() {
      setLoadingCourses(true)
      setError('')
      try {
        const data = await api.get('/courses')
        const list = Array.isArray(data) ? data : (data?.courses ?? [])
        setCourses(list)
        if (list.length > 0) setSelectedCourse(list[0])
      } catch (err) {
        setError(err.message || 'Failed to load courses.')
      } finally {
        setLoadingCourses(false)
      }
    }
    load()
  }, [])

  /* ── load students when course changes ── */
  useEffect(() => {
    if (!selectedCourse) return
    let cancelled = false
    async function load() {
      setLoadingStudents(true)
      setError('')
      setStudents([])
      setSelectedStudent(null)
      setSearch('')
      setPage(1)
      try {
        let list = []
        try {
          const atRisk = await api.get(`/admin/reports/at-risk?course_id=${selectedCourse.id}`)
          list = Array.isArray(atRisk) ? atRisk : (atRisk?.students ?? [])
        } catch {
          const data = await api.get(`/courses/${selectedCourse.id}/students`)
          list = Array.isArray(data) ? data : (data?.students ?? [])
        }
        if (cancelled) return
        const enriched = list.map(s => ({
          ...s,
          _absenceRate: absenceRate(s),
          _initials:    getInitials(s.full_name ?? s.name ?? ''),
          _color:       avatarColor(s.student_id ?? s.id),
          _id:          String(s.student_number ?? s.student_id ?? s.id ?? ''),
          _name:        s.full_name ?? s.name ?? `Student #${s.id}`,
        }))
        setStudents(enriched)
        const sorted = [...enriched].sort((a, b) => (b._absenceRate ?? 0) - (a._absenceRate ?? 0))
        if (sorted.length > 0) setSelectedStudent(sorted[0])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load student data.')
      } finally {
        if (!cancelled) setLoadingStudents(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedCourse])

  /* ── load sessions when course changes or tab = sessions ── */
  useEffect(() => {
    if (!selectedCourse || tab !== 'sessions') return
    let cancelled = false
    async function load() {
      setLoadingSessions(true)
      setSessions([])
      try {
        const data = await api.get(`/sessions?course_id=${selectedCourse.id}`)
        if (!cancelled) setSessions(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSessions([])
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedCourse, tab])

  /* ── derived ── */
  const filtered = students.filter(s =>
    s._name.toLowerCase().includes(search.toLowerCase()) ||
    s._id.includes(search)
  )
  const PAGE_SIZE  = 6
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const studentsWithData = students.filter(s => s._absenceRate !== null)
  const avgAttendance = studentsWithData.length > 0
    ? Math.round(studentsWithData.reduce((sum, s) => sum + (100 - s._absenceRate), 0) / studentsWithData.length)
    : null
  const atRiskCount = students.filter(s => s._absenceRate !== null && s._absenceRate >= threshold * 0.5).length

  /* ── export XLSX (course level) ── */
  const handleExport = () => {
    const courseCode = selectedCourse?.course_code ?? selectedCourse?.code ?? 'Course'
    const courseName = selectedCourse?.name ?? selectedCourse?.course_name ?? ''
    const exportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const titleRows = [
      [`${courseCode} – ${courseName}`],
      [`Exported: ${exportDate}`],
      [],
      ['Student ID', 'Name', 'Absence Rate', 'Risk Level'],
    ]
    const dataRows = filtered.map(s => [
      s._id, s._name,
      s._absenceRate != null ? `${s._absenceRate}%` : '—',
      riskLevel(s._absenceRate, threshold),
    ])
    const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...dataRows])
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `report_${courseCode}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const courseCode = selectedCourse?.course_code ?? selectedCourse?.code ?? ''

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Course Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#17162a] border border-[#e0e7ff] dark:border-[#2e2c48] rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            {loadingCourses ? (
              <span className="text-sm text-slate-400">Loading courses…</span>
            ) : (
              <>
                <select
                  value={selectedCourse?.id ?? ''}
                  onChange={(e) => {
                    const c = courses.find(c => String(c.id) === e.target.value)
                    if (c) setSelectedCourse(c)
                  }}
                  className="appearance-none bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-5"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.course_code ?? c.code} – {c.name ?? c.course_name}
                    </option>
                  ))}
                  {courses.length === 0 && <option value="">No courses</option>}
                </select>
                <ChevronDown size={13} className="text-slate-400 pointer-events-none flex-shrink-0 -ml-4" />
              </>
            )}
          </div>

          <div className="btn-secondary text-sm flex items-center gap-2 px-3 py-2 cursor-pointer">
            <Calendar size={14} className="flex-shrink-0" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="7d">Last Week</option>
              <option value="30d">Last 30 Days</option>
              <option value="semester">This Semester</option>
            </select>
            <ChevronDown size={13} className="text-slate-400 pointer-events-none flex-shrink-0 -ml-1" />
          </div>

          <button className="btn-primary text-sm" onClick={() => navigate('/sessions/live')}>
            <Play size={15} />
            New Session
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
          style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'students'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-[#17162a] border border-[#e0e7ff] dark:border-[#2e2c48] text-slate-600 dark:text-slate-300'
          }`}
        >
          <BookOpen size={14} /> Students
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'sessions'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-[#17162a] border border-[#e0e7ff] dark:border-[#2e2c48] text-slate-600 dark:text-slate-300'
          }`}
        >
          <List size={14} /> Sessions
        </button>
      </div>

      {/* ── SESSIONS TAB ── */}
      {tab === 'sessions' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {courseCode} — All Sessions
            </p>
            <span className="text-xs text-slate-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          </div>

          {loadingSessions ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm">No sessions found for this course.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {sessions.map((s, i) => (
                <div key={s.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {fmtDate(s.started_at)}
                        <span className="ml-2 text-xs font-normal text-slate-400">{fmtTime(s.started_at)}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.attended_count ?? 0} / {s.total_enrolled ?? '—'} students
                        {s.status === 'active' && <span className="ml-2 text-emerald-500 font-semibold">● LIVE</span>}
                        {s.status === 'closed' && <span className="ml-2 text-slate-400">Closed</span>}
                      </p>
                    </div>
                  </div>
                  <SessionExportButton session={s} courseCode={courseCode} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* High Risk Sidebar */}
          <div className="lg:col-span-1 card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full uppercase tracking-wide">
                High Risk
              </span>
            </div>

            {loadingStudents ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-20 rounded-2xl mx-auto" />
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-20 mx-auto w-40" />
              </div>
            ) : selectedStudent ? (
              <>
                <div className="flex flex-col items-center mb-4">
                  <div className={`w-20 h-20 ${selectedStudent._color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md`}>
                    {selectedStudent._initials}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg text-center">{selectedStudent._name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    ID: {selectedStudent._id}
                  </p>
                </div>

                <GaugeChart value={selectedStudent._absenceRate} isDark={isDark} threshold={threshold} />

                {(() => {
                  const level = riskLevel(selectedStudent._absenceRate, threshold)
                  if (level === 'critical') return (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-600">Critical Status</p>
                        <p className="text-xs text-red-500">Absence rate exceeds the {threshold}% warning threshold.</p>
                      </div>
                    </div>
                  )
                  if (level === 'at-risk') return (
                    <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-600">At Risk</p>
                        <p className="text-xs text-amber-500">Absence rate is approaching the {threshold}% threshold.</p>
                      </div>
                    </div>
                  )
                  return null
                })()}
              </>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                {courses.length === 0 ? 'No courses yet.' : 'No student data for this course.'}
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="lg:col-span-3 card">
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Students</p>
                {loadingStudents ? <Skeleton className="h-9 w-12 mt-1" /> : <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{students.length}</p>}
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Avg. Attendance</p>
                {loadingStudents ? <Skeleton className="h-9 w-16 mt-1" /> : <p className="text-3xl font-bold text-emerald-600">{avgAttendance != null ? `${avgAttendance}%` : '—'}</p>}
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">At Risk</p>
                {loadingStudents ? <Skeleton className="h-9 w-10 mt-1" /> : <p className="text-3xl font-bold text-red-600">{atRiskCount}</p>}
              </div>
            </div>

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
              <button className="btn-secondary text-sm" onClick={handleExport} disabled={students.length === 0}>
                <Download size={14} /> Export Course
              </button>
            </div>

            <div className="px-5 py-3 grid grid-cols-3 bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student Name</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Absence Rate</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Risk Level</p>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {loadingStudents ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 grid grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <div className="flex justify-end"><Skeleton className="h-7 w-20" /></div>
                  </div>
                ))
              ) : paginated.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  {students.length === 0 ? 'No students enrolled in this course.' : `No students match "${search}"`}
                </div>
              ) : (
                paginated.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => setSelectedStudent(s)}
                    className={`px-5 py-4 grid grid-cols-3 items-center cursor-pointer transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-900/20 ${
                      selectedStudent?._id === s._id ? 'bg-primary-50/40 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${s._color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {s._initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s._name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">ID: {s._id}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {s._absenceRate != null ? `${s._absenceRate}% absent` : '—'}
                    </p>
                    <div className="flex justify-end">
                      <RiskBadge rate={s._absenceRate} threshold={threshold} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {!loadingStudents && filtered.length > PAGE_SIZE && (
              <div className="px-5 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}