import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Users,
  Calendar,
  MoreVertical,
  BookOpen,
  MapPin,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
  ChevronRight,
  X,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'

const STORAGE_KEY = 'attendify_courses'

const defaultCourses = [
  {
    id: 1,
    code: 'CS101',
    name: 'Intro to Java',
    fullName: 'CS101: Intro to Java',
    semester: 'Fall 2025',
    students: 42,
    sessions: 24,
    attendance: 91,
    color: 'bg-primary-600',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
    iconBg: '#4f46e5',
    schedule: 'Mon, Wed · 10:00 AM – 11:30 AM',
    location: 'Lecture Hall A',
    nextClass: 'Nov 6, Monday',
  },
  {
    id: 2,
    code: 'DS200',
    name: 'Data Structures',
    fullName: 'DS200: Data Structures',
    semester: 'Fall 2025',
    students: 45,
    sessions: 20,
    attendance: 88,
    color: 'bg-violet-600',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    iconBg: '#7c3aed',
    schedule: 'Tue, Thu · 09:00 AM – 10:50 AM',
    location: 'Lecture Hall B',
    nextClass: 'Nov 7, Tuesday',
  },
  {
    id: 3,
    code: 'CS301',
    name: 'Algorithms',
    fullName: 'CS301: Algorithms',
    semester: 'Fall 2025',
    students: 38,
    sessions: 18,
    attendance: 94,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-500',
    iconBg: '#3b82f6',
    schedule: 'Mon, Wed · 02:00 PM – 03:30 PM',
    location: 'Room 214',
    nextClass: 'Nov 6, Monday',
  },
  {
    id: 4,
    code: 'SE400',
    name: 'Software Engineering',
    fullName: 'SE400: Software Engineering',
    semester: 'Fall 2025',
    students: 35,
    sessions: 15,
    attendance: 96,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-500',
    iconBg: '#10b981',
    schedule: 'Fri · 01:00 PM – 04:00 PM',
    location: 'Lab 3',
    nextClass: 'Nov 10, Friday',
  },
]

const colorOptions = [
  { color: 'bg-primary-600', lightColor: 'bg-primary-50', textColor: 'text-primary-600', iconBg: '#4f46e5' },
  { color: 'bg-indigo-600',  lightColor: 'bg-indigo-50',  textColor: 'text-indigo-600',  iconBg: '#4f46e5' },
  { color: 'bg-violet-600',  lightColor: 'bg-violet-50',  textColor: 'text-violet-600',  iconBg: '#7c3aed' },
  { color: 'bg-emerald-600', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', iconBg: '#059669' },
  { color: 'bg-rose-600',    lightColor: 'bg-rose-50',    textColor: 'text-rose-600',    iconBg: '#e11d48' },
  { color: 'bg-amber-600',   lightColor: 'bg-amber-50',   textColor: 'text-amber-600',   iconBg: '#d97706' },
]

function loadCourses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : defaultCourses
  } catch {
    return defaultCourses
  }
}

function CourseCard({ course, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="card p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: course.iconBg || '#4f46e5' }}>
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
        <span className={`text-xs font-bold ${course.textColor} ${course.lightColor} dark:bg-opacity-20 px-2 py-0.5 rounded-md`}>
          {course.code}
        </span>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-2 leading-tight">{course.name}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{course.semester}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{course.students}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Students</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{course.sessions}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Sessions</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
          <p className={`text-lg font-bold ${course.attendance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {course.attendance}%
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Attendance</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${course.attendance}%`, background: course.iconBg || '#4f46e5' }}
          />
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-400" />
          {course.schedule}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-slate-400" />
          {course.location}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-slate-400" />
          Next: {course.nextClass}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
          View Details <ChevronRight size={14} />
        </button>
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp size={12} />
          Active
        </div>
      </div>
    </div>
  )
}

function Modal({ onClose, onSave, editCourse }) {
  const [form, setForm] = useState({
    code: editCourse?.code || '',
    name: editCourse?.name || '',
    semester: editCourse?.semester || 'Fall 2025',
    location: editCourse?.location || '',
    schedule: editCourse?.schedule || '',
    colorIndex: editCourse
      ? colorOptions.findIndex((c) => c.color === editCourse.color)
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
    const palette = colorOptions[form.colorIndex] || colorOptions[0]
    onSave({
      code: form.code.trim(),
      name: form.name.trim(),
      semester: form.semester,
      location: form.location.trim(),
      schedule: form.schedule.trim(),
      ...palette,
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
                  onClick={() => setForm({ ...form, colorIndex: i })}
                  className={`w-7 h-7 rounded-full ${c.color} transition-transform ${form.colorIndex === i ? 'scale-125 ring-2 ring-offset-1 ring-primary-400' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
            {editCourse ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Courses() {
  const { addToast } = useToast()
  const [courses, setCourses] = useState(loadCourses)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
  }, [courses])

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id))
    addToast('Course deleted', 'error')
  }

  const handleEdit = (course) => {
    setEditCourse(course)
    setShowModal(true)
  }

  const handleSave = (formData) => {
    if (editCourse) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editCourse.id
            ? { ...c, ...formData, fullName: `${formData.code}: ${formData.name}` }
            : c
        )
      )
      addToast('Course updated successfully')
    } else {
      const newCourse = {
        id: Date.now(),
        ...formData,
        fullName: `${formData.code}: ${formData.name}`,
        students: 0,
        sessions: 0,
        attendance: 0,
        nextClass: '—',
      }
      setCourses((prev) => [...prev, newCourse])
      addToast('Course created successfully')
    }
    setShowModal(false)
    setEditCourse(null)
  }

  return (
    <div className="fade-in">
      {showModal && (
        <Modal
          onClose={() => { setShowModal(false); setEditCourse(null) }}
          onSave={handleSave}
          editCourse={editCourse}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Courses</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{courses.length} active courses this semester</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Course
        </button>
      </div>

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

      {/* Empty state — no courses */}
      {courses.length === 0 ? (
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
              <p className="font-semibold text-slate-500 dark:text-slate-400">No courses match "<span className="text-slate-700 dark:text-slate-200">{search}</span>"</p>
              <button onClick={() => setSearch('')} className="text-sm text-primary-600 font-semibold hover:underline">Clear search</button>
            </div>
          ) : (
            filtered.map((course) => (
              <CourseCard key={course.id} course={course} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
          {filtered.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="card p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-all group min-h-[320px]"
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <Plus size={22} className="text-primary-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-primary-600 transition-colors">Add New Course</p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
