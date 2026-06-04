import { useState, useEffect, useCallback } from 'react'
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

/* ── CourseCard ───────────────────────────────────────────────── */
function CourseCard({ course, palette, onEdit, onDelete, onEnroll }) {
  const [menu, setMenu] = useState(false)

  const attendance = course.attendance_rate != null
    ? Math.round(course.attendance_rate * 100)
    : (course.attendance ?? 0)

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
                onClick={() => { onDelete(course.id); setMenu(false) }}
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
            {course.student_count ?? course.students ?? '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Students</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {course.session_count ?? course.sessions ?? '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Sessions</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className={`text-lg font-bold ${attendance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {course.attendance_rate != null ? `${attendance}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Attend.</p>
        </div>
      </div>

      {course.attendance_rate != null && (
        <div className="mb-4">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${attendance}%`, background: palette.iconBg }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => onEnroll(course)} className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
          Manage Students <ChevronRight size={14} />
        </button>
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp size={12} />
          Active
        </div>
      </div>
    </div>
  )
}

/* ── Modal (Create / Edit) ────────────────────────────────────── */
function Modal({ onClose, onSave, editCourse, saving }) {
  const [form, setForm] = useState({
    code:       editCourse?.course_code ?? editCourse?.code ?? '',
    name:       editCourse?.name ?? editCourse?.course_name ?? '',
    semester:   editCourse?.semester ?? 'Fall 2025',
    location:   editCourse?.location ?? '',
    schedule:   editCourse?.schedule ?? '',
    colorIndex: editCourse
      ? (getColorMap()[editCourse.id] ?? 0) % colorOptions.length
      : 0,
  })
  const [errors, setErrors] = useState({})

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
      code:       form.code.trim(),       // backend field name
      name:       form.name.trim(),
      description: form.location.trim() || form.schedule.trim()
        ? `${form.location.trim()}${form.schedule.trim() ? ' · ' + form.schedule.trim() : ''}`.trim()
        : undefined,
      // kept locally for display
      _location:  form.location.trim(),
      _schedule:  form.schedule.trim(),
      colorIndex: form.colorIndex,
    })
  }

  const inputCls = (hasErr) =>
    `w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600 ${hasErr ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 fade-in">
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
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Lab 3"
                className={inputCls(false)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Schedule</label>
            <input
              type="text"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="e.g. Mon, Wed · 10:00 AM – 11:30 AM"
              className={inputCls(false)}
            />
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


/* ── EnrollModal ──────────────────────────────────────────────────── */
function EnrollModal({ course, onClose, addToast }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchStudents = async () => {
    try {
      const data = await api.get(`/courses/${course.id}/students`)
      setStudents(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleAdd = async () => {
    const id = parseInt(studentId.trim())
    if (!id) { addToast('Enter a valid Student ID', 'error'); return }
    setAdding(true)
    try {
      await api.post(`/courses/${course.id}/enroll`, { student_id: id, course_id: course.id })
      addToast('Student enrolled successfully')
      setStudentId('')
      fetchStudents()
    } catch (err) {
      addToast(err.message || 'Failed to enroll student', 'error')
    } finally { setAdding(false) }
  }

  const handleRemove = async (studentId) => {
    try {
      await api.delete(`/courses/${course.id}/enroll/${studentId}`)
      addToast('Student removed')
      setStudents(prev => prev.filter(s => s.student_id !== studentId))
    } catch (err) {
      addToast(err.message || 'Failed to remove student', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 fade-in max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {course.name ?? course.course_name} — Students
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="Student ID"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <button onClick={handleAdd} disabled={adding} className="btn-primary px-4">
            {adding ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No students enrolled yet.</p>
          ) : (
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.student_id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.full_name}</p>
                    <p className="text-xs text-slate-400">{s.email} · #{s.student_number}</p>
                  </div>
                  <button onClick={() => handleRemove(s.student_id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [colorMap,   setColorMap]   = useState(getColorMap)
  const [enrollCourse, setEnrollCourse] = useState(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/courses')
      const list = Array.isArray(data) ? data : (data?.courses ?? [])
      setCourses(list)
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses((prev) => prev.filter((c) => c.id !== id))
      addToast('Course deleted', 'error')
    } catch (err) {
      addToast(err.message || 'Failed to delete course.', 'error')
    }
  }

  const handleEdit = (course) => {
    setEditCourse(course)
    setShowModal(true)
  }

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      // Backend accepts: { code, name, description }
      const payload = {
        code:        formData.code,
        name:        formData.name,
        description: formData.description,
      }

      if (editCourse) {
        const updated = await api.patch(`/courses/${editCourse.id}`, payload)
        setCourses((prev) => prev.map((c) => c.id === editCourse.id ? { ...c, ...updated } : c))
        assignColor(editCourse.id, formData.colorIndex)
        addToast('Course updated successfully')
      } else {
        const created = await api.post('/courses', payload)
        assignColor(created.id, formData.colorIndex)
        setCourses((prev) => [...prev, created])
        addToast('Course created successfully')
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
      {enrollCourse && (
        <EnrollModal
          course={enrollCourse}
          onClose={() => setEnrollCourse(null)}
          addToast={addToast}
        />
      )}
      {showModal && (
        <Modal
          onClose={() => { setShowModal(false); setEditCourse(null) }}
          onSave={handleSave}
          editCourse={editCourse}
          saving={saving}
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
                  onEnroll={setEnrollCourse}
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

