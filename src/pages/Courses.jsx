import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  Plus,
  Users,
  Calendar,
  MoreVertical,
  BookOpen,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'

/* ── colour palette (local only — backend doesn't store colours) ─ */
const colorOptions = [
  { color: 'bg-primary-600', lightColor: 'bg-primary-50', textColor: 'text-primary-600', iconBg: '#4f46e5' },
  { color: 'bg-violet-600',  lightColor: 'bg-violet-50',  textColor: 'text-violet-600',  iconBg: '#7c3aed' },
  { color: 'bg-blue-500',    lightColor: 'bg-blue-50',    textColor: 'text-blue-500',    iconBg: '#3b82f6' },
  { color: 'bg-emerald-600', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', iconBg: '#059669' },
  { color: 'bg-rose-600',    lightColor: 'bg-rose-50',    textColor: 'text-rose-600',    iconBg: '#e11d48' },
  { color: 'bg-amber-600',   lightColor: 'bg-amber-50',   textColor: 'text-amber-600',   iconBg: '#d97706' },
]

const COLOR_MAP_KEY = 'attendify_course_colors'

function getColorMap() {
  try { return JSON.parse(localStorage.getItem(COLOR_MAP_KEY) || '{}') } catch { return {} }
}
function saveColorMap(map) {
  try { localStorage.setItem(COLOR_MAP_KEY, JSON.stringify(map)) } catch {}
}

/** Return (and persist) a colour for a given course id */
function courseColor(id, map) {
  if (map[id] !== undefined) return colorOptions[map[id] % colorOptions.length]
  const idx = id % colorOptions.length
  map[id] = idx
  saveColorMap(map)
  return colorOptions[idx]
}

/* ── skeleton ─────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl ${className}`} />
}

/* ── Delete confirm modal ─────────────────────────────────────── */
/* ── ManageStudentsModal ──────────────────────────────────────── */
function ManageStudentsModal({ course, onClose }) {
  const [enrolled,     setEnrolled]     = useState([])
  const [loadingList,  setLoadingList]  = useState(true)
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const [searching,    setSearching]    = useState(false)
  const [showDrop,     setShowDrop]     = useState(false)
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState('')
  const [addSuccess,   setAddSuccess]   = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing,     setRemoving]     = useState({})
  const [listError,    setListError]    = useState('')
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)
  const dropRef     = useRef(null)

  const courseId = course.id

  const loadEnrolled = useCallback(async () => {
    setLoadingList(true)
    try {
      const data = await api.get(`/courses/${courseId}/students`)
      setEnrolled(Array.isArray(data) ? data : [])
    } catch {
      setListError('Failed to load students.')
    } finally {
      setLoadingList(false)
    }
  }, [courseId])

  useEffect(() => { loadEnrolled() }, [loadEnrolled])

  // Debounced search for suggestions
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setSuggestions([]); setShowDrop(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await api.get(`/courses/${courseId}/students/search?q=${encodeURIComponent(query)}`)
        setSuggestions(Array.isArray(data) ? data : [])
        setShowDrop(true)
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, courseId])

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const enrollById = async (studentId, label) => {
    setAdding(true); setAddError(''); setAddSuccess('')
    try {
      await api.post(`/courses/${courseId}/enroll`, { student_id: studentId, course_id: courseId })
      setAddSuccess(`${label} enrolled successfully.`)
      setQuery(''); setSuggestions([]); setShowDrop(false)
      await loadEnrolled()
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('already enrolled')) setAddError('Student is already enrolled in this course.')
      else setAddError(err.message || 'Failed to enroll student.')
    } finally { setAdding(false) }
  }

  const enrollByNumber = async () => {
    const num = query.trim()
    if (!num) return
    setAdding(true); setAddError(''); setAddSuccess('')
    try {
      await api.post(`/courses/${courseId}/enroll`, { student_number: num, course_id: courseId })
      setAddSuccess(`Student ${num} enrolled successfully.`)
      setQuery(''); setSuggestions([]); setShowDrop(false)
      await loadEnrolled()
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('not found')) setAddError('Student not found. Check the student number.')
      else if (msg.includes('already enrolled')) setAddError('Student is already enrolled in this course.')
      else setAddError(err.message || 'Failed to enroll student.')
    } finally { setAdding(false) }
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    const student = removeTarget
    setRemoveTarget(null)
    setRemoving(r => ({ ...r, [student.student_id]: true }))
    try {
      await api.delete(`/courses/${courseId}/enroll/${student.student_id}`)
      setEnrolled(list => list.filter(s => s.student_id !== student.student_id))
    } catch (err) {
      setListError(err.message || 'Failed to remove student.')
    } finally {
      setRemoving(r => ({ ...r, [student.student_id]: false }))
    }
  }

  const courseName = course.name ?? course.course_name ?? ''
  const courseCode = course.course_code ?? course.code ?? ''

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      {/* Remove confirmation */}
      {removeTarget && (
        <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
          <div className="card w-full max-w-sm p-6 fade-in shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <UserMinus size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Remove Student</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will unenroll the student.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-slate-100">"{removeTarget.full_name}"</span> from this course?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={confirmRemove}
                className="flex-1 justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card w-full max-w-lg fade-in flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Manage Students</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{courseCode} – {courseName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Add student — search or student number */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Add Student</p>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Name or student number…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setAddError(''); setAddSuccess('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { setShowDrop(false); enrollByNumber() } if (e.key === 'Escape') setShowDrop(false) }}
                  onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}

                {/* Dropdown suggestions */}
                {showDrop && suggestions.length > 0 && (
                  <div ref={dropRef} className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    {suggestions.map(s => (
                      <button
                        key={s.student_id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => !s.already_enrolled && enrollById(s.student_id, s.full_name)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b last:border-0 border-slate-100 dark:border-slate-800 transition-colors ${s.already_enrolled ? 'opacity-60 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.student_number}</p>
                        </div>
                        {s.already_enrolled
                          ? <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">Enrolled</span>
                          : <span className="text-xs text-primary-600 font-semibold flex items-center gap-1"><UserPlus size={11} /> Add</span>
                        }
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setShowDrop(false); enrollByNumber() }}
                disabled={adding || !query.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Add
              </button>
            </div>
            {addError && (
              <div className="flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertCircle size={12} /> {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mt-2 text-xs px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium">
                ✓ {addSuccess}
              </div>
            )}
          </div>

          {/* Enrolled list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Enrolled Students</p>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">{enrolled.length}</span>
            </div>
            {listError && (
              <div className="flex items-center gap-2 mb-2 text-xs px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertCircle size={12} /> {listError}
                <button onClick={() => setListError('')} className="ml-auto"><X size={12} /></button>
              </div>
            )}

            {loadingList ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : enrolled.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No students enrolled yet.</div>
            ) : (
              <div className="space-y-2">
                {enrolled.map(s => (
                  <div key={s.student_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                        {(s.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.full_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{s.student_number} · {Math.round((s.attendance_rate ?? 0) * 100)}% attendance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRemoveTarget(s)}
                      disabled={removing[s.student_id]}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      {removing[s.student_id] ? <Loader2 size={11} className="animate-spin" /> : <UserMinus size={11} />}
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full justify-center">Close</button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ courseName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Delete Course</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-100">"{courseName}"</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── CourseCard ───────────────────────────────────────────────── */
function CourseCard({ course, palette, onEdit, onDelete, onManage }) {
  const [menu, setMenu] = useState(false)

  const attendance = course.attendance_rate != null
    ? Math.round(course.attendance_rate * 100)
    : null

  return (
    <div className="card p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: palette.iconBg }}>
          <BookOpen size={20} color="white" />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 w-36 card shadow-lg z-10 py-1 overflow-hidden">
              <button
                onClick={() => { onEdit(course); setMenu(false) }}
                className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2"
              >
                <Edit size={13} /> Edit
              </button>
              <button
                onClick={() => { onDelete(course); setMenu(false) }}
                className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <span className={`text-xs font-bold ${palette.textColor} ${palette.lightColor} dark:bg-opacity-20 px-2 py-0.5 rounded-md`}>
          {course.course_code ?? course.code ?? '—'}
        </span>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-2 leading-tight">
          {course.name ?? course.course_name ?? '—'}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {course.semester ?? '—'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {course.student_count ?? 0}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Students</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {course.session_count ?? 0}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Sessions</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className={`text-lg font-bold ${attendance == null ? 'text-slate-400' : attendance >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {attendance != null ? `${attendance}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Attend.</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${attendance ?? 0}%`, background: palette.iconBg }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onEdit(course)}
            className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1"
          >
            View Details <ChevronRight size={14} />
          </button>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp size={12} />
            Active
          </div>
        </div>
        <button
          onClick={() => onManage(course)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Users size={13} /> Manage Students
        </button>
      </div>
    </div>
  )
}

/* ── Modal (Create / Edit) ────────────────────────────────────── */
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }

function Modal({ onClose, onSave, editCourse, saving }) {
  const [form, setForm] = useState({
    code:       editCourse?.course_code ?? editCourse?.code ?? '',
    name:       editCourse?.name ?? editCourse?.course_name ?? '',
    semester:   editCourse?.semester ?? 'Fall 2025',
    colorIndex: editCourse
      ? (getColorMap()[editCourse.id] ?? 0) % colorOptions.length
      : 0,
  })
  const [errors,       setErrors]       = useState({})
  const [slots,        setSlots]        = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Load existing schedule when editing
  useEffect(() => {
    if (!editCourse?.id) return
    setLoadingSlots(true)
    api.get(`/courses/${editCourse.id}/schedule`)
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setSlots(list.map((s) => ({
          day_of_week: s.day_of_week,
          start_time:  s.start_time,
          end_time:    s.end_time,
          room:        s.room ?? '',
        })))
      })
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [editCourse?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addSlot    = ()         => { if (slots.length < 5) setSlots([...slots, { day_of_week: 'monday', start_time: '09:00', end_time: '10:30', room: '' }]) }
  const removeSlot = (i)        => setSlots(slots.filter((_, idx) => idx !== i))
  const updateSlot = (i, f, v)  => setSlots(slots.map((s, idx) => idx === i ? { ...s, [f]: v } : s))

  const validate = () => {
    const e = {}
    if (!form.code.trim()) e.code = 'Course code is required'
    if (!form.name.trim()) e.name = 'Course name is required'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    onSave({
      code:       form.code.trim(),
      name:       form.name.trim(),
      colorIndex: form.colorIndex,
      slots,
    })
  }

  const inputCls = (hasErr) =>
    `w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600 ${hasErr ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`
  const smCls = `px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600`

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {editCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Course Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. CS101"
              className={inputCls(errors.code)}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Course Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Intro to Java"
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Semester</label>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className={inputCls(false)}
            >
              <option>Fall 2025</option>
              <option>Spring 2026</option>
              <option>Summer 2026</option>
            </select>
          </div>

          {/* ── Schedule slots ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Schedule {loadingSlots && <span className="font-normal text-slate-400">(loading…)</span>}
              </label>
              {slots.length < 5 && (
                <button type="button" onClick={addSlot}
                  className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add time slot
                </button>
              )}
            </div>

            {slots.length === 0 && !loadingSlots && (
              <button type="button" onClick={addSlot}
                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                + Add a time slot (optional)
              </button>
            )}

            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div key={i} className="flex gap-1.5 items-center bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2">
                  <select value={slot.day_of_week} onChange={(e) => updateSlot(i, 'day_of_week', e.target.value)} className={smCls + ' w-16'}>
                    {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                  </select>
                  <input type="time" value={slot.start_time} onChange={(e) => updateSlot(i, 'start_time', e.target.value)} className={smCls + ' w-24'} />
                  <span className="text-slate-400 text-xs">–</span>
                  <input type="time" value={slot.end_time} onChange={(e) => updateSlot(i, 'end_time', e.target.value)} className={smCls + ' w-24'} />
                  <input type="text" value={slot.room} onChange={(e) => updateSlot(i, 'room', e.target.value)} placeholder="Room" className={smCls + ' flex-1 min-w-0'} />
                  <button type="button" onClick={() => removeSlot(i)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, colorIndex: i })}
                  className={`w-7 h-7 rounded-full ${c.color} transition-transform ${form.colorIndex === i ? 'scale-125 ring-2 ring-offset-1 ring-primary-400' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center" disabled={saving}>
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving…</>
            ) : (
              editCourse ? 'Save Changes' : 'Create Course'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function Courses() {
  const { addToast } = useToast()
  const [courses,    setCourses]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [showModal,     setShowModal]     = useState(false)
  const [editCourse,    setEditCourse]    = useState(null)
  const [colorMap,      setColorMap]      = useState(getColorMap)
  const [deleteTarget,  setDeleteTarget]  = useState(null) // { id, name }
  const [manageTarget,  setManageTarget]  = useState(null) // course object

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/courses')
      const list = Array.isArray(data) ? data : (data?.courses ?? [])
      // Fetch stats for each course in parallel
      const withStats = await Promise.all(
        list.map(async (c) => {
          try {
            const stats = await api.get(`/courses/${c.id}/stats`)
            return { ...c, ...stats }
          } catch {
            return c
          }
        })
      )
      setCourses(withStats)
    } catch (err) {
      setError(err.message || 'Failed to load courses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.course_code ?? c.code ?? '').toLowerCase().includes(q)
    )
  })

  /* persist colour choice and update colorMap state */
  function assignColor(id, idx) {
    const map = { ...colorMap, [id]: idx }
    saveColorMap(map)
    setColorMap(map)
  }

  const handleDelete = (course) => {
    setDeleteTarget({ id: course.id, name: course.name ?? course.course_name ?? 'this course' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/courses/${deleteTarget.id}`)
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      addToast('Course deleted', 'error')
    } catch (err) {
      addToast(err.message || 'Failed to delete course.', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleEdit = (course) => {
    setEditCourse(course)
    setShowModal(true)
  }

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
      }

      let courseId
      if (editCourse) {
        const updated = await api.patch(`/courses/${editCourse.id}`, payload)
        setCourses((prev) => prev.map((c) => c.id === editCourse.id ? { ...c, ...updated } : c))
        assignColor(editCourse.id, formData.colorIndex)
        courseId = editCourse.id
        addToast('Course updated successfully')
      } else {
        const created = await api.post('/courses', payload)
        assignColor(created.id, formData.colorIndex)
        setCourses((prev) => [...prev, created])
        courseId = created.id
        addToast('Course created successfully')
      }

      // Save schedule slots if any were provided
      if (formData.slots && formData.slots.length > 0) {
        await api.post(`/courses/${courseId}/schedule`, {
          schedule: formData.slots.map((s) => ({
            day_of_week: s.day_of_week,
            start_time:  s.start_time,
            end_time:    s.end_time,
            room:        s.room || null,
          })),
        })
      }

      setShowModal(false)
      setEditCourse(null)
    } catch (err) {
      addToast(err.message || 'Failed to save course.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in">
      {showModal && (
        <Modal
          onClose={() => { setShowModal(false); setEditCourse(null) }}
          onSave={handleSave}
          editCourse={editCourse}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          courseName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {manageTarget && (
        <ManageStudentsModal
          course={manageTarget}
          onClose={() => setManageTarget(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Courses</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {loading ? 'Loading…' : `${courses.length} active courses this semester`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Course
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
          style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
          <AlertCircle size={15} />
          {error}
          <button onClick={fetchCourses} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
              <Skeleton className="h-2" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center">
            <BookOpen size={28} className="text-primary-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">No courses yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first course to get started</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-2">
            <Plus size={16} /> Create First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full card flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Search size={32} className="text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-500 dark:text-slate-400">
                No courses match "<span className="text-slate-700 dark:text-slate-200">{search}</span>"
              </p>
              <button onClick={() => setSearch('')} className="text-sm text-primary-600 font-semibold hover:underline">
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((course) => {
              const palette = colorOptions[(colorMap[course.id] ?? course.id) % colorOptions.length]
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  palette={palette}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onManage={setManageTarget}
                />
              )
            })
          )}
          {filtered.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="card p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-all group min-h-[320px]"
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <Plus size={22} className="text-primary-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-primary-600 transition-colors">
                Add New Course
              </p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}