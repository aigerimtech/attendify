import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createStudent } from '../../services/adminService.js'

// ── Faculty → Department map ──────────────────────────────────────────────────

const FACULTY_DEPTS = {
  Engineering: ['Computer Engineering', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering'],
  Science:     ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
  Business:    ['Management', 'Finance', 'Marketing', 'Accounting'],
  Arts:        ['Design', 'Fine Arts', 'Literature', 'Media Studies'],
  Law:         ['Constitutional Law', 'Criminal Law', 'International Law', 'Corporate Law'],
}

const FACULTIES = Object.keys(FACULTY_DEPTS)
const DURATIONS = [2, 4, 5, 6]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--pri)',
        background: 'var(--pri-light)', border: '1px solid var(--pri-border)',
        borderRadius: 5, padding: '3px 8px', flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--pri-border)' }} />
    </div>
  )
}

function Field({ label, badge, required, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
        {label}
        {required && <span style={{ color: 'var(--rose)', fontWeight: 700 }}>*</span>}
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px',
            borderRadius: 4, background: 'var(--pri-light)',
            color: 'var(--pri)', border: '1px solid var(--pri-border)',
            letterSpacing: '0.03em',
          }}>
            {badge}
          </span>
        )}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--txt-muted)' }}>{hint}</span>}
    </div>
  )
}

function TextInput({ error, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '10px 13px',
        border: `1.5px solid ${error ? 'var(--rose)' : focused ? 'var(--pri)' : 'var(--bdr)'}`,
        borderRadius: 9, outline: 'none',
        fontSize: 14, color: props.readOnly ? 'var(--txt-muted)' : 'var(--txt)',
        background: props.readOnly ? '#f4f4f8' : '#f8f9ff',
        fontFamily: 'var(--font)',
        cursor: props.readOnly ? 'default' : 'text',
        transition: 'border-color 0.15s',
      }}
    />
  )
}

function SelectInput({ error, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '10px 13px',
        border: `1.5px solid ${error ? 'var(--rose)' : focused ? 'var(--pri)' : 'var(--bdr)'}`,
        borderRadius: 9, outline: 'none',
        fontSize: 14, color: props.value ? 'var(--txt)' : 'var(--txt-muted)',
        background: '#f8f9ff', fontFamily: 'var(--font)',
        cursor: 'pointer', transition: 'border-color 0.15s',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 13px center',
        paddingRight: 36,
      }}
    >
      {children}
    </select>
  )
}

// ── Graduation year helper ─────────────────────────────────────────────────────

function computeGradYear(enrollDate, durationYears) {
  if (!enrollDate) return null
  const year = parseInt(enrollDate.slice(0, 4), 10)
  if (isNaN(year)) return null
  return year + durationYears
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INIT = {
  name: '', email: '',
  faculty: '', department: '',
  program_duration_years: 4,
  enroll_date: '',
}

export default function CreateStudentPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INIT)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // reset department when faculty changes
      if (field === 'faculty') next.department = ''
      return next
    })
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())        e.name = 'Full name is required'
    if (!form.email.trim())       e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.faculty)            e.faculty = 'Please select a faculty'
    if (!form.department)         e.department = 'Please select a department'
    if (!form.enroll_date)        e.enroll_date = 'Enroll date is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerErr('')
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setLoading(true)
    try {
      await createStudent(form)
      navigate('/students')
    } catch (err) {
      setServerErr(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const depts    = form.faculty ? FACULTY_DEPTS[form.faculty] : []
  const gradYear = computeGradYear(form.enroll_date, form.program_duration_years)

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 22 }}>
        <Link
          to="/students"
          style={{ color: 'var(--pri)', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          Students
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span style={{ color: 'var(--txt-muted)', fontWeight: 500 }}>Add Student</span>
      </nav>

      {/* Page title */}
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 24 }}>Add Student</h1>

      {/* Card */}
      <div style={{
        background: 'var(--card)', borderRadius: 14,
        border: '1px solid var(--bdr)', boxShadow: 'var(--sh)',
        padding: 32, maxWidth: 680,
      }}>
        {serverErr && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--rose-light)', border: '1px solid #fecdd3',
            borderRadius: 9, padding: '10px 14px', marginBottom: 24,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)' }}>{serverErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── IDENTITY ── */}
          <SectionLabel label="Identity" />
          <div style={{ display: 'grid', gap: 18, marginBottom: 32 }}>

            <Field label="Full Name" required>
              <TextInput
                type="text" placeholder="e.g. Aisha Bekova"
                value={form.name} onChange={e => set('name', e.target.value)}
                error={errors.name}
              />
              {errors.name && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.name}</span>}
            </Field>

            <Field label="Email Address" required>
              <TextInput
                type="email" placeholder="student@university.edu"
                value={form.email} onChange={e => set('email', e.target.value)}
                error={errors.email}
              />
              {errors.email && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.email}</span>}
            </Field>

            <Field label="Student ID" badge="auto">
              <TextInput
                type="text" value="Auto-generated"
                readOnly tabIndex={-1}
              />
            </Field>
          </div>

          {/* ── ACADEMIC ── */}
          <SectionLabel label="Academic" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>

            <Field label="Faculty" required>
              <SelectInput
                value={form.faculty}
                onChange={e => set('faculty', e.target.value)}
                error={errors.faculty}
              >
                <option value="">Select faculty…</option>
                {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </SelectInput>
              {errors.faculty && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.faculty}</span>}
            </Field>

            <Field label="Department" required>
              <SelectInput
                value={form.department}
                onChange={e => set('department', e.target.value)}
                disabled={!form.faculty}
                error={errors.department}
              >
                <option value="">{form.faculty ? 'Select department…' : 'Select faculty first'}</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </SelectInput>
              {errors.department && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.department}</span>}
            </Field>

            <Field label="Program Duration">
              <SelectInput
                value={form.program_duration_years}
                onChange={e => set('program_duration_years', Number(e.target.value))}
              >
                {DURATIONS.map(d => (
                  <option key={d} value={d}>{d} {d === 1 ? 'year' : 'years'}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Enroll Date" required>
              <TextInput
                type="date"
                value={form.enroll_date}
                onChange={e => set('enroll_date', e.target.value)}
                error={errors.enroll_date}
              />
              {errors.enroll_date && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.enroll_date}</span>}
            </Field>
          </div>

          {/* Graduation auto-compute */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 9,
            background: gradYear ? 'var(--green-light)' : '#f8f9ff',
            border: `1px solid ${gradYear ? '#6ee7b7' : 'var(--bdr)'}`,
            marginBottom: 28, transition: 'all 0.2s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={gradYear ? 'var(--green)' : 'var(--txt-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: gradYear ? 'var(--green)' : 'var(--txt-muted)' }}>
              {gradYear
                ? <>Expected graduation: <strong>{gradYear}</strong></>
                : 'Expected graduation: set enroll date to compute'}
            </span>
            {gradYear && (
              <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 4, opacity: 0.8 }}>
                (auto-computed from enroll date + duration)
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/students')}
              style={{
                padding: '10px 22px', borderRadius: 9,
                border: '1.5px solid var(--bdr)',
                background: 'var(--card)', color: 'var(--txt-muted)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 26px', borderRadius: 9, border: 'none',
                background: loading ? 'var(--pri-border)' : 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
                color: loading ? 'var(--txt-muted)' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 2px 8px 0 rgb(67 56 202 / .25)',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Creating…' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
