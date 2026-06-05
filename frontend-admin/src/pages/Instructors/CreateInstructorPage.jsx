import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createInstructor } from '../../services/adminService.js'

const TITLES = ['Dr.', 'Prof.', 'Assoc. Prof.', 'Asst. Prof.', 'Lecturer']

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

function Field({ label, badge, required, children }) {
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
        fontSize: 14,
        color: props.readOnly ? 'var(--txt-muted)' : 'var(--txt)',
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

function SelectInput({ error, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '10px 36px 10px 13px',
        border: `1.5px solid ${error ? 'var(--rose)' : focused ? 'var(--pri)' : 'var(--bdr)'}`,
        borderRadius: 9, outline: 'none',
        fontSize: 14,
        color: props.value ? 'var(--txt)' : 'var(--txt-muted)',
        background: '#f8f9ff',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 13px center',
        fontFamily: 'var(--font)',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        appearance: 'none',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return <span style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>{msg}</span>
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INIT = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  department: '',
  title: '',
}

export default function CreateInstructorPage() {
  const navigate = useNavigate()
  const [form, setForm]           = useState(INIT)
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [serverErr, setServerErr] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.first_name?.trim())  e.first_name = 'First name is required'
    if (!form.last_name?.trim())   e.last_name = 'Last name is required'
    if (!form.email?.trim())       e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password?.trim())    e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.department?.trim())  e.department = 'Department is required'
    if (!form.title)               e.title = 'Please select a title'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerErr('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await createInstructor(form)
      alert(`Instructor created!\nEmail: ${form.email}\nPassword: ${form.password}`)
      navigate('/instructors')
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
          to="/instructors"
          style={{ color: 'var(--pri)', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          Instructors
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span style={{ color: 'var(--txt-muted)', fontWeight: 500 }}>Add Instructor</span>
      </nav>

      {/* Page title */}
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 24 }}>Add Instructor</h1>

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
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
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
                type="text" placeholder="e.g. Aliya"
                value={form.first_name} onChange={e => set('first_name', e.target.value)}
                error={errors.first_name}
              />
              <ErrorMsg msg={errors.first_name} />
            </Field>

            <Field label="Last Name" required>
              <TextInput
                type="text" placeholder="e.g. Smagulova"
                value={form.last_name} onChange={e => set('last_name', e.target.value)}
                error={errors.last_name}
              />
              <ErrorMsg msg={errors.last_name} />
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Email Address" required>
                <TextInput
                  type="email" placeholder="instructor@university.edu"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  error={errors.email}
                />
                <ErrorMsg msg={errors.email} />
              </Field>
            </div>
          </div>

          {/* ── ACCOUNT ── */}
          <SectionLabel label="Account" />
          <div style={{ display: 'grid', gap: 18, marginBottom: 32 }}>

            <Field label="Password" required>
              <PasswordInput
                value={form.password}
                onChange={e => set('password', e.target.value)}
                error={errors.password}
              />
              <ErrorMsg msg={errors.password} />
            </Field>
          </div>

          {/* ── ACADEMIC ── */}
          <SectionLabel label="Academic" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 32 }}>

            <Field label="Department" required>
              <TextInput
                type="text" placeholder="e.g. Computer Engineering"
                value={form.department} onChange={e => set('department', e.target.value)}
                error={errors.department}
              />
              <ErrorMsg msg={errors.department} />
            </Field>

            <Field label="Title" required>
              <SelectInput
                value={form.title}
                onChange={e => set('title', e.target.value)}
                error={errors.title}
              >
                <option value="">Select title…</option>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </SelectInput>
              <ErrorMsg msg={errors.title} />
            </Field>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/instructors')}
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
                padding: '10px 22px', borderRadius: 9, border: 'none',
                background: loading
                  ? 'var(--pri-border)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: loading ? 'var(--txt-muted)' : '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 2px 8px 0 rgb(5 150 105 / .25)',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Creating…' : 'Create Instructor Account'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
