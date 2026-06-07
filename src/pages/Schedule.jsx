import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Calendar, Loader2, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'

/* ── Constants ────────────────────────────────────────────────── */
const START_HOUR = 9
const END_HOUR   = 17
const HOUR_PX    = 64
const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const TOTAL_H    = (END_HOUR - START_HOUR) * HOUR_PX

/* ── Week helpers ─────────────────────────────────────────────── */
function getWeekStart(offset = 0) {
  const today = new Date()
  const day   = today.getDay()
  const diff  = today.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  return new Date(today.getFullYear(), today.getMonth(), diff)
}
function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}
function formatDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
function formatRange(s) { return `${formatDate(s)} – ${formatDate(addDays(s, 4))}, ${s.getFullYear()}` }

/* ── Colour palette for courses ───────────────────────────────── */
const PALETTES = [
  { color:'#3730a3', darkColor:'#a5b4fc', bg:'#eef2ff', darkBg:'#1e1f45', border:'#c7d2fe', darkBorder:'#3730a3', dot:'#4f46e5' },
  { color:'#5b21b6', darkColor:'#c4b5fd', bg:'#f5f3ff', darkBg:'#1e1a38', border:'#ddd6fe', darkBorder:'#5b21b6', dot:'#7c3aed' },
  { color:'#1e40af', darkColor:'#93c5fd', bg:'#eff6ff', darkBg:'#172035', border:'#bfdbfe', darkBorder:'#1e40af', dot:'#3b82f6' },
  { color:'#065f46', darkColor:'#6ee7b7', bg:'#ecfdf5', darkBg:'#0c2218', border:'#6ee7b7', darkBorder:'#065f46', dot:'#10b981' },
  { color:'#9f1239', darkColor:'#fda4af', bg:'#fff1f2', darkBg:'#2d0a12', border:'#fecdd3', darkBorder:'#9f1239', dot:'#f43f5e' },
  { color:'#92400e', darkColor:'#fcd34d', bg:'#fffbeb', darkBg:'#2d1f04', border:'#fde68a', darkBorder:'#92400e', dot:'#f59e0b' },
]

/* ── DayOfWeek enum → index (backend: "monday"=0 … "friday"=4) ── */
const DAY_ENUM_MAP = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4
}

/* ── Build calendar courses from API data ─────────────────────── */
function buildCalendarCourse(course, slots, paletteIndex, studentCount = 0) {
  const palette = PALETTES[paletteIndex % PALETTES.length]
  if (!slots || slots.length === 0) {
    return [{
      id:       course.id,
      courseId: course.id,
      code:     course.code ?? `C${course.id}`,
      name:     course.name ?? '',
      days:     [],
      start:    '09:00',
      end:      '10:00',
      location: '',
      students: studentCount,
      ...palette,
    }]
  }

  return slots.map((slot, si) => {
    const dayIdx = DAY_ENUM_MAP[slot.day_of_week]
    return {
      id:       `${course.id}-${si}`,
      courseId: course.id,
      code:     course.code ?? `C${course.id}`,
      name:     course.name ?? '',
      days:     dayIdx !== undefined ? [dayIdx] : [],
      start:    slot.start_time,
      end:      slot.end_time,
      location: slot.room ?? '',
      students: studentCount,
      ...palette,
    }
  })
}

/* ── Conflict detection ───────────────────────────────────────── */
function overlaps(a, b) {
  const sharedDays = a.days.filter(d => b.days.includes(d))
  if (sharedDays.length === 0) return false
  const startA = toMin(a.start), endA = toMin(a.end)
  const startB = toMin(b.start), endB = toMin(b.end)
  return startA < endB && startB < endA
}

function getConflictIds(courses) {
  const ids = new Set()
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      if (overlaps(courses[i], courses[j])) {
        ids.add(courses[i].id)
        ids.add(courses[j].id)
      }
    }
  }
  return ids
}

/* ── Time helpers ─────────────────────────────────────────────── */
function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function toY(t)   { return ((toMin(t) - START_HOUR * 60) / 60) * HOUR_PX }
function toH(s,e) { return ((toMin(e) - toMin(s)) / 60) * HOUR_PX }

function fmt12(t) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2,'0')}${ampm}`
}
function fmt12Full(t) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

/* ── Event block ──────────────────────────────────────────────── */
function EventBlock({ course, isSelected, onSelect, isDark, hasConflict }) {
  const top    = toY(course.start)
  const height = toH(course.start, course.end)
  const isShort = height < HOUR_PX
  const bg      = hasConflict ? (isDark ? '#2d0a12' : '#fff1f2') : (isDark ? course.darkBg    : course.bg)
  const color   = hasConflict ? (isDark ? '#fda4af' : '#9f1239') : (isDark ? course.darkColor  : course.color)
  const dotColor = hasConflict ? '#f43f5e' : course.dot

  return (
    <div
      onClick={() => onSelect(isSelected ? null : course)}
      className="absolute left-1 right-1 rounded-lg cursor-pointer transition-all duration-150 overflow-hidden select-none"
      style={{
        top:       `${top}px`,
        height:    `${height}px`,
        background: bg,
        borderLeft: `3px solid ${dotColor}`,
        boxShadow:  hasConflict
          ? '0 0 0 1px #fca5a5, 0 2px 8px rgba(239,68,68,.25)'
          : isSelected
            ? `0 4px 16px ${course.dot}30`
            : '0 1px 2px rgba(0,0,0,.05)',
        zIndex:     isSelected ? 10 : 2,
        opacity:    isSelected ? 1 : 0.92,
      }}
    >
      <div className="px-2 py-1.5 h-full flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-bold leading-tight truncate" style={{ color }}>
            {course.code}
          </p>
          {hasConflict && <span className="text-[9px] font-bold text-red-500 flex-shrink-0">⚠</span>}
        </div>
        {!isShort && (
          <p className="text-[10px] leading-tight truncate" style={{ color, opacity: 0.65 }}>
            {course.name}
          </p>
        )}
        <p className="text-[9px] font-medium mt-auto" style={{ color: dotColor }}>
          {fmt12(course.start)}–{fmt12(course.end)}
        </p>
      </div>
    </div>
  )
}

/* ── Detail panel ─────────────────────────────────────────────── */
function DetailPanel({ course, onClose, isDark }) {
  const bg     = isDark ? course.darkBg    : course.bg
  const border = isDark ? course.darkBorder : course.border
  const color  = isDark ? course.darkColor  : course.color

  return (
    <div className="rounded-2xl p-4 mb-4 transition-all"
      style={{
        background:  bg,
        border:      `1px solid ${border}`,
        borderLeft:  `4px solid ${course.dot}`,
        boxShadow:   `0 4px 20px ${course.dot}15`,
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]"
            style={{ background: course.dot + '20', color }}>
            {course.code.split('').slice(0,3).join('')}
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color }}>{course.name}</h3>
            <p className="text-[11px] text-slate-400">{course.code}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 text-base leading-none">
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: Clock,    label: 'Time',     value: `${fmt12Full(course.start)} – ${fmt12Full(course.end)}` },
          { icon: MapPin,   label: 'Location', value: course.location },
          { icon: Users,    label: 'Students', value: `${course.students} enrolled` },
          { icon: Calendar, label: 'Days',     value: course.days.map(d => DAY_SHORT[d]).join(', ') },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.5)', ...(isDark && { background: 'rgba(255,255,255,0.06)' }) }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Icon size={10} style={{ color: course.dot }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color, opacity: 0.55 }}>{label}</span>
            </div>
            <p className="text-[11px] font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export default function Schedule() {
  const { isDark } = useTheme()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected,   setSelected]   = useState(null)
  const [COURSES,    setCOURSES]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const d = await api.get('/courses')
        const list = Array.isArray(d) ? d : (d?.courses ?? [])

        // Fetch schedule slots AND stats for each course in parallel
        const withSlots = await Promise.all(
          list.map((c, i) =>
            Promise.all([
              api.get(`/courses/${c.id}/schedule`).catch(() => []),
              api.get(`/courses/${c.id}/stats`).catch(() => ({ student_count: 0 })),
            ]).then(([slots, stats]) =>
              buildCalendarCourse(
                c,
                Array.isArray(slots) ? slots : [],
                i,
                stats?.student_count ?? 0
              )
            )
          )
        )

        if (!cancelled) setCOURSES(withSlots.flat())
      } catch {
        // silently fail — empty calendar shown
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const weekStart = getWeekStart(weekOffset)
  const weekDates = DAY_NAMES.map((_, i) => addDays(weekStart, i))

  const today    = new Date()
  const todayIdx = weekOffset === 0
    ? weekDates.findIndex(d => d.getDate() === today.getDate() && d.getMonth() === today.getMonth())
    : -1

  const nowMin = today.getHours() * 60 + today.getMinutes()
  const nowY   = ((nowMin - START_HOUR * 60) / 60) * HOUR_PX

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])

  const conflictIds = getConflictIds(COURSES)

  const borderColor = isDark ? '#2e2c48' : '#e8eaff'
  const borderSub   = isDark ? '#1e1c30' : '#f0f2ff'
  const columnBg    = isDark ? '#17162a' : '#ffffff'
  const todayColBg  = isDark ? '#1e1c30' : '#fafbff'
  const todayHeadBg = isDark ? '#1e1c30' : '#eef2ff'
  const otherHeadBg = isDark ? '#17162a' : '#f8f9ff'

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Weekly Schedule</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Course legend chips */}
          <div className="hidden md:flex items-center gap-1.5 mr-1">
            {COURSES.map(c => (
              <button key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: selected?.id === c.id ? (isDark ? c.darkBg : c.bg) : (isDark ? '#17162a' : '#f0f2ff'),
                  border: `1px solid ${selected?.id === c.id ? (isDark ? c.darkBorder : c.border) : borderColor}`,
                  color: isDark ? c.darkColor : c.color,
                }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                {c.code}
              </button>
            ))}
          </div>

          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={weekOffset === 0
              ? { background: 'linear-gradient(135deg,#3730a3,#4f46e5)', color: 'white', boxShadow: '0 3px 10px rgba(67,56,202,.3)' }
              : { background: isDark ? '#17162a' : '#f0f2ff', color: '#4338ca', border: `1px solid ${borderColor}` }}>
            Today
          </button>

          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
            <button onClick={() => setWeekOffset(v => v - 1)}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ color: isDark ? '#a5b4fc' : '#4338ca' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1e1c30' : '#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ width: 1, height: 14, background: borderColor }} />
            <button onClick={() => setWeekOffset(v => v + 1)}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ color: isDark ? '#a5b4fc' : '#4338ca' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1e1c30' : '#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading / empty */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
          <Loader2 size={16} className="animate-spin" /> Loading your schedule…
        </div>
      )}
      {!loading && COURSES.length === 0 && (
        <div className="card p-8 text-center text-slate-400 text-sm mb-4">
          No courses found. Create a course first to see your schedule.
        </div>
      )}

      {!loading && conflictIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
          style={{ background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' }}>
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>
            <strong>Schedule conflict detected:</strong> {conflictIds.size} course slot{conflictIds.size > 1 ? 's' : ''} overlap in time.
            Conflicting classes are highlighted in red.
          </span>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel course={selected} onClose={() => setSelected(null)} isDark={isDark} />
      )}

      {/* Calendar grid */}
      <div className="card overflow-hidden">

        {/* Day header row */}
        <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', borderBottom: `1px solid ${borderColor}` }}>
          <div className="py-2.5 px-1" />
          {DAY_NAMES.map((day, i) => {
            const isToday = i === todayIdx
            const date    = weekDates[i]
            return (
              <div key={day} className="py-2 text-center"
                style={{ borderLeft: `1px solid ${borderColor}`, background: isToday ? todayHeadBg : otherHeadBg }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: isToday ? '#4f46e5' : (isDark ? '#5c5a78' : '#94a3b8') }}>
                  {DAY_SHORT[i]}
                </p>
                <div className="flex items-center justify-center">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold"
                    style={isToday
                      ? { background: 'linear-gradient(135deg,#3730a3,#4f46e5)', color: 'white', fontSize: '13px' }
                      : { color: isDark ? '#e8e6f4' : '#1e1b4b', fontSize: '13px' }}>
                    {date.getDate()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrollable grid */}
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '480px' }}>
          <div className="grid relative" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>

            {/* Time labels */}
            <div className="relative" style={{ height: `${TOTAL_H}px`, borderRight: `1px solid ${borderSub}` }}>
              {hours.map(h => (
                <div key={h} className="absolute right-0 left-0 flex items-center justify-end pr-2"
                  style={{ top: `${h === START_HOUR ? 2 : (h - START_HOUR) * HOUR_PX - 7}px` }}>
                  <span className="text-[10px] font-semibold tabular-nums"
                    style={{ color: isDark ? '#3d3b58' : '#c7d2fe' }}>
                    {fmt12(`${h}:00`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAY_NAMES.map((day, dayIdx) => {
              const isToday   = dayIdx === todayIdx
              const dayEvents = COURSES.filter(c => c.days.includes(dayIdx))

              return (
                <div key={day} className="relative"
                  style={{ height: `${TOTAL_H}px`, borderLeft: `1px solid ${borderColor}`, background: isToday ? todayColBg : columnBg }}>

                  {/* Hour lines */}
                  {hours.map(h => (
                    <div key={h}>
                      <div className="absolute left-0 right-0"
                        style={{ top: `${(h - START_HOUR) * HOUR_PX}px`, borderTop: `1px solid ${borderColor}` }} />
                      {h < END_HOUR && (
                        <div className="absolute left-0 right-0"
                          style={{ top: `${(h - START_HOUR) * HOUR_PX + HOUR_PX / 2}px`,
                            borderTop: `1px dashed ${isDark ? '#252338' : '#f0f2ff'}` }} />
                      )}
                    </div>
                  ))}

                  {/* Now indicator */}
                  {isToday && nowY >= 0 && nowY <= TOTAL_H && (
                    <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${nowY}px` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 -ml-1" style={{ background: '#f43f5e' }} />
                      <div className="flex-1" style={{ height: 1, background: '#f43f5e', opacity: 0.7 }} />
                    </div>
                  )}

                  {/* Events */}
                  {dayEvents.map(course => (
                    <EventBlock
                      key={course.id}
                      course={course}
                      isSelected={selected?.id === course.id}
                      onSelect={setSelected}
                      isDark={isDark}
                      hasConflict={conflictIds.has(course.id)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom course cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {COURSES.map(c => {
          const isSelected = selected?.id === c.id
          const color      = isDark ? c.darkColor : c.color
          const bg         = isSelected ? (isDark ? c.darkBg : c.bg) : undefined
          const border     = isSelected ? (isDark ? c.darkBorder : c.border) : undefined

          return (
            <div key={c.id}
              className="card p-3.5 flex items-center gap-3 cursor-pointer transition-all"
              style={isSelected ? { border: `1.5px solid ${border}`, background: bg } : {}}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}>

              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[10px] text-center leading-tight"
                style={{ background: c.dot + '15', color }}>
                {c.code.split(/\D/)[0]}<br/>{c.code.match(/\d+/)?.[0]}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate" style={{ color }}>{c.name}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: c.dot }}>
                  {fmt12(c.start)}–{fmt12(c.end)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {c.days.map(d => DAY_SHORT[d]).join(' · ')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}