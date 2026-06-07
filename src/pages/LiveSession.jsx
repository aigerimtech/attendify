import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import {
  MapPin,
  Clock,
  Users,
  ChevronDown,
  Shield,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Play,
  Square,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react'

const QR_INTERVAL = 15

const AVATAR_COLORS = [
  'bg-primary-600', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-orange-500', 'bg-rose-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-amber-500', 'bg-indigo-500', 'bg-sky-500', 'bg-fuchsia-500',
]
function avatarColor(id) {
  const n = typeof id === 'number' ? id : String(id).charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

/* ── Real QR from backend (base64 PNG) ──────────────────────── */
function QRCodeDisplay({ imageB64, fading }) {
  if (!imageB64) {
    return (
      <div className="w-56 h-56 bg-white rounded-2xl flex items-center justify-center mx-auto"
        style={{ opacity: fading ? 0 : 1 }}>
        <Loader2 size={32} className="text-slate-300 animate-spin" />
      </div>
    )
  }
  return (
    <div className="w-56 h-56 bg-white rounded-2xl p-3 shadow-inner mx-auto transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}>
      <img
        src={`data:image/png;base64,${imageB64}`}
        alt="Attendance QR Code"
        className="w-full h-full object-contain"
      />
    </div>
  )
}

function CountdownRing({ seconds, total }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (seconds / total) * circ
  const color = seconds <= 5 ? '#ef4444' : '#60a5fa'
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="absolute -inset-8 pointer-events-none">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ / 4}
        className="transition-all duration-1000" />
    </svg>
  )
}

/* ── Setup Screen ─────────────────────────────────────────────── */
function SetupScreen({ courses, loadingCourses, onStart }) {
  const [courseId,   setCourseId]   = useState('')
  const [location,   setLocation]   = useState('')
  const [geoFence,   setGeoFence]   = useState(true)
  const [starting,   setStarting]   = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (courses.length > 0 && !courseId) setCourseId(String(courses[0].id))
  }, [courses])

  async function handleStart() {
    if (!courseId) { setError('Please select a course.'); return }
    setError('')
    setStarting(true)
    try {
      await onStart({ course_id: Number(courseId), location: location.trim() || undefined, use_geo_fence: geoFence })
    } catch (err) {
      setError(err.message || 'Failed to start session.')
    } finally {
      setStarting(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600'

  return (
    <div className="fade-in max-w-md mx-auto mt-8">
      <div className="card p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Play size={28} className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Start a New Session</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Choose a course and begin taking attendance</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Course *</label>
            {loadingCourses ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2"><Loader2 size={14} className="animate-spin" /> Loading courses…</div>
            ) : (
              <div className="relative">
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                >
                  {courses.length === 0 && <option value="">No courses — create one first</option>}
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.course_code ?? c.code} – {c.name ?? c.course_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: '#fff1f2', color: '#f43f5e' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={starting || courses.length === 0}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
        >
          {starting
            ? <><Loader2 size={16} className="animate-spin" /> Starting…</>
            : <><Play size={16} /> Start Session</>
          }
        </button>
      </div>
    </div>
  )
}

/* ── Active Session Screen ────────────────────────────────────── */
export default function LiveSession() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [phase,        setPhase]        = useState('setup')   // 'setup' | 'active' | 'checking'
  const [courses,      setCourses]      = useState([])
  const [loadingC,     setLoadingC]     = useState(true)
  const [session,      setSession]      = useState(null)       // session object from API
  const [sessionCode,  setSessionCode]  = useState('')
  const [qrImage,      setQrImage]      = useState(null)       // base64 PNG from backend
  const [qrSeed,       setQrSeed]       = useState(1)
  const [fading,       setFading]       = useState(false)
  const [elapsedSec,   setElapsedSec]   = useState(0)
  const [qrCountdown,  setQrCountdown]  = useState(QR_INTERVAL)
  const [liveUsers,    setLiveUsers]    = useState([])
  const [attendeeCount,setAttendeeCount]= useState(0)
  const [ending,       setEnding]       = useState(false)
  const [error,        setError]        = useState('')
  const [pendingList,  setPendingList]  = useState([])
  const [resolving,    setResolving]    = useState({})

  /* ── fetch courses ── */
  useEffect(() => {
    api.get('/courses')
      .then(d => setCourses(Array.isArray(d) ? d : (d?.courses ?? [])))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [])

  /* ── on mount: check for already-active session ── */
  useEffect(() => {
    async function checkActive() {
      try {
        const data = await api.get('/sessions?status=live&per_page=10')
        const list = Array.isArray(data) ? data : (data?.sessions ?? data?.items ?? [])
        const live = list.find(s => !s.ended_at)
        if (!live) return

        // Restore session state
        setSession(live)
        const code = live.session_code ?? live.qr_token ?? String(live.id)
        setSessionCode(code)

        // Calculate elapsed seconds from started_at
        if (live.started_at) {
          const elapsed = Math.floor((Date.now() - new Date(live.started_at).getTime()) / 1000)
          setElapsedSec(Math.max(0, elapsed))
        }

        // Get a fresh QR code
        try {
          const renewed = await api.post(`/sessions/${live.id}/renew-qr`)
          if (renewed?.qr_image_base64) setQrImage(renewed.qr_image_base64)
          if (renewed?.qr_token ?? renewed?.session_code) {
            setSessionCode(renewed.qr_token ?? renewed.session_code)
          }
        } catch {
          setQrImage(live.qr_image_base64 ?? null)
        }

        setQrCountdown(QR_INTERVAL)
        setQrSeed(1)
        setPhase('active')
      } catch {
        // no active session or endpoint not available — stay on setup
      }
    }
    checkActive()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── start session ── */
  const handleStart = useCallback(async ({ course_id, location, use_geo_fence }) => {
    // Backend SessionCreate only accepts: { course_id, title? }
    const created = await api.post('/sessions', {
      course_id,
      title: location || undefined,   // location'ı title olarak gönder (görüntüleme için)
    })
    setSession(created)
    // use qr_token or session_code or id as the display code
    const code = created.session_code ?? created.qr_token ?? String(created.id)
    setSessionCode(code)
    setQrImage(created.qr_image_base64 ?? null)
    setQrSeed(1)
    setElapsedSec(0)
    setQrCountdown(QR_INTERVAL)
    setLiveUsers([])
    setAttendeeCount(0)
    setPhase('active')
  }, [])

  /* ── session timer ── */
  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => {
      setElapsedSec(s => s + 1)
      setQrCountdown(q => {
        if (q <= 1) {
          // renew QR via API, fall back to local rotation
          if (session?.id) {
            setFading(true)
            api.post(`/sessions/${session.id}/renew-qr`)
              .then(res => {
                if (res?.qr_token ?? res?.session_code) {
                  setSessionCode(res.qr_token ?? res.session_code)
                }
                if (res?.qr_image_base64) {
                  setQrImage(res.qr_image_base64)
                }
              })
              .catch(() => {})
              .finally(() => {
                setQrSeed(s => s + 1)
                setTimeout(() => setFading(false), 300)
              })
          } else {
            setFading(true)
            setTimeout(() => { setQrSeed(s => s + 1); setFading(false) }, 300)
          }
          return QR_INTERVAL
        }
        return q - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, session])

  /* ── poll attendance ── */
  useEffect(() => {
    if (phase !== 'active' || !session?.id) return
    const fetchAttendance = async () => {
      try {
        // Backend returns SessionAttendanceSummary:
        // { session_id, total_enrolled, total_present, attendance_rate, records: [AttendanceWithStudent] }
        const data = await api.get(`/sessions/${session.id}/attendance`)
        const records = data?.records ?? []
        setAttendeeCount(data?.total_present ?? records.length)
        const mapped = records.slice(0, 8).map(r => {
          const s = r.student ?? r
          const userFirst = s?.user?.first_name ?? ''
          const userLast = s?.user?.last_name ?? ''
          const name = (userFirst + ' ' + userLast).trim() || s?.full_name || s?.name || `#${s?.id}`
          return {
            id:       s?.id ?? r.student_id,
            name,
            method:   r.qr_validated ? 'QR Code' : r.face_validated ? 'Face' : 'Manual',
            time:     r.submitted_at
              ? new Date(r.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'Recently',
            color:    avatarColor(s?.id ?? r.student_id),
            initials: getInitials(name),
          }
        })
        setLiveUsers(mapped)
      } catch {}
    }
    const fetchPending = async () => {
      try {
        const data = await api.get(`/sessions/${session.id}/pending`)
        setPendingList(Array.isArray(data) ? data : [])
      } catch {}
    }

    fetchAttendance()
    fetchPending()
    const id = setInterval(() => { fetchAttendance(); fetchPending() }, 10000)
    return () => clearInterval(id)
  }, [phase, session])

  /* ── resolve pending ── */
  const handleResolve = async (pendingId, action) => {
    if (!session?.id) return
    setResolving(r => ({ ...r, [pendingId]: true }))
    try {
      await api.patch(`/sessions/${session.id}/pending/${pendingId}`, { action })
      setPendingList(list => list.filter(p => p.id !== pendingId))
      if (action === 'approve') {
        setAttendeeCount(c => c + 1)
        addToast('Student marked present.')
      } else {
        addToast('Request declined.')
      }
    } catch (err) {
      addToast(err.message || 'Could not resolve request.', 'error')
    } finally {
      setResolving(r => ({ ...r, [pendingId]: false }))
    }
  }

  /* ── end session ── */
  const handleEnd = async () => {
    if (!session?.id) { setPhase('setup'); return }
    setEnding(true)
    try {
      await api.post(`/sessions/${session.id}/close`)
      addToast('Session ended. Attendance recorded.')
    } catch (err) {
      addToast(err.message || 'Session closed.', 'error')
    } finally {
      setEnding(false)
      setSession(null)
      setPhase('setup')
    }
  }

  /* ── helpers ── */
  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsedSec % 60).padStart(2, '0')

  const activeCourse = courses.find(c => c.id === session?.course_id)

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Overview
        </button>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">Live Session</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Live Session Control</h1>

      {/* ── Setup ── */}
      {phase === 'setup' && (
        <SetupScreen courses={courses} loadingCourses={loadingC} onStart={handleStart} />
      )}

      {/* ── Active ── */}
      {phase === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            {/* Session Status */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700 dark:text-slate-200">Session Status</h2>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 blink" /> ACTIVE
                </span>
              </div>
              <div className="text-center mb-4">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Session Duration</p>
                <p className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {hh}:{mm}:{ss}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Session open until you end it</p>
              </div>
              <div className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${
                qrCountdown <= 5 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : 'bg-primary-50 dark:bg-primary-900/20'
              }`}>
                <RefreshCw size={16}
                  className={`flex-shrink-0 transition-colors ${qrCountdown <= 5 ? 'text-red-500' : 'text-primary-600'}`}
                  style={{ animation: fading ? 'spin 0.3s linear' : undefined }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${qrCountdown <= 5 ? 'text-red-600' : 'text-primary-600'}`}>
                    QR refreshes in <span className="font-mono font-bold">{qrCountdown}s</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Generation #{qrSeed} · Every {QR_INTERVAL}s
                  </p>
                </div>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${qrCountdown <= 5 ? 'bg-red-500' : 'bg-primary-600'}`}
                    style={{ width: `${(qrCountdown / QR_INTERVAL) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="card p-5">
              <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Session Details</h2>
              {activeCourse && (
                <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl mb-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeCourse.course_code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeCourse.name}</p>
                  </div>
                </div>
              )}
              {session?.location && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                  <MapPin size={12} className="text-primary-600" /> {session.location}
                </p>
              )}
            </div>

            {/* Live Feed */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 blink" /> Live Feed
                </h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Total: <span className="text-slate-700 dark:text-slate-200">{attendeeCount}</span>
                </span>
              </div>
              {liveUsers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Waiting for students to check in…</p>
              ) : (
                <div className="space-y-2.5">
                  {liveUsers.map((u, i) => (
                    <div key={`${u.id}-${i}`} className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${u.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {u.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{u.method}</p>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${i === 0 ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}`}>
                        {u.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Requests */}
            {pendingList.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-500" /> Pending Requests
                  </h2>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    {pendingList.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingList.map(p => (
                    <div key={p.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {p.student_name ?? `Student #${p.student_id}`}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                        {p.student_number && `${p.student_number} · `}{p.reason?.replace('_', ' ')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(p.id, 'approve')}
                          disabled={resolving[p.id]}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}
                        >
                          {resolving[p.id] ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleResolve(p.id, 'decline')}
                          disabled={resolving[p.id]}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                        >
                          {resolving[p.id] ? '…' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* End Session */}
            <button
              onClick={handleEnd}
              disabled={ending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 16px rgba(220,38,38,.35)' }}
            >
              {ending
                ? <><Loader2 size={15} className="animate-spin" /> Ending…</>
                : <><Square size={15} /> End Session</>
              }
            </button>
          </div>

          {/* QR Panel */}
          <div className="lg:col-span-2 card p-8 flex flex-col items-center justify-center gap-6 min-h-[560px]"
            style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)' }}>

            <QRCodeDisplay imageB64={qrImage} fading={fading} />

            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              qrCountdown <= 5 ? 'bg-red-400/30 text-red-100' : 'bg-white/10 text-indigo-200'
            }`}>
              <RefreshCw size={13} className={fading ? 'animate-spin' : ''} />
              {fading ? 'Generating new QR…' : `New QR in ${qrCountdown}s`}
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Users size={14} className="text-indigo-200" />
              <span className="text-white text-sm font-semibold">{attendeeCount} students checked in</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}