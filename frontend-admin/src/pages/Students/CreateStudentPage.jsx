import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createStudent } from '../../services/adminService.js'

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
        boxSizing: 'border-box',
      }}
    />
  )
}

function PasswordInput({ error, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 40px 10px 13px',
          border: `1.5px solid ${error ? 'var(--rose)' : focused ? 'var(--pri)' : 'var(--bdr)'}`,
          borderRadius: 9, outline: 'none',
          fontSize: 14, color: 'var(--txt)',
          background: '#f8f9ff', fontFamily: 'var(--font)',
          cursor: 'text', transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'var(--txt-muted)', display: 'flex', alignItems: 'center',
        }}
        tabIndex={-1}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INIT = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  student_number: '',
  department: '',
}

export default function CreateStudentPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INIT)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.first_name?.trim())     e.first_name = 'First name is required'
    if (!form.last_name?.trim())      e.last_name = 'Last name is required'
    if (!form.email?.trim())          e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password?.trim())       e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.student_number?.trim()) e.student_number = 'Student number is required'
    if (!form.department?.trim())     e.department = 'Department is required'
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
      alert(`Student created!\nEmail: ${form.email}\nPassword: ${form.password}`)
      navigate('/students')
    } catch (err) {
      setServerErr(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 32 }}>

            <Field label="First Name" required>
              <TextInput
                type="text" placeholder="e.g. Aisha"
                value={form.first_name} onChange={e => set('first_name', e.target.value)}
                error={errors.first_name}
              />
              {errors.first_name && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.first_name}</span>}
            </Field>

            <Field label="Last Name" required>
              <TextInput
                type="text" placeholder="e.g. Bekova"
                value={form.last_name} onChange={e => set('last_name', e.target.value)}
                error={errors.last_name}
              />
              {errors.last_name && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.last_name}</span>}
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Email Address" required>
                <TextInput
                  type="email" placeholder="student@university.edu"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  error={errors.email}
                />
                {errors.email && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.email}</span>}
              </Field>
            </div>
          </div>

          {/* ── ACCOUNT ── */}
          <SectionLabel label="Account" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 32 }}>

            <Field label="Password" required>
              <PasswordInput
                value={form.password}
                onChange={e => set('password', e.target.value)}
                error={errors.password}
              />
              {errors.password && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.password}</span>}
            </Field>

            <Field label="Student Number" required>
              <TextInput
                type="text" placeholder="e.g. 20210001"
                value={form.student_number} onChange={e => set('student_number', e.target.value)}
                error={errors.student_number}
              />
              {errors.student_number && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.student_number}</span>}
            </Field>
          </div>

          {/* ── ACADEMIC ── */}
          <SectionLabel label="Academic" />
          <div style={{ display: 'grid', gap: 18, marginBottom: 32 }}>

            <Field label="Department" required>
              <TextInput
                type="text" placeholder="e.g. Computer Engineering"
                value={form.department} onChange={e => set('department', e.target.value)}
                error={errors.department}
              />
              {errors.department && <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{errors.department}</span>}
            </Field>
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
