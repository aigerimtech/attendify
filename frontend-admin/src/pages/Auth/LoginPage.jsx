import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/adminService.js'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconEnvelope() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, icon, right, ...inputProps }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{label}</label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#f8f9ff',
        border: `1.5px solid ${focused ? 'var(--pri)' : 'var(--bdr)'}`,
        borderRadius: 10,
        padding: '0 12px',
        gap: 10,
        transition: 'border-color 0.15s',
      }}>
        <span style={{ color: focused ? 'var(--pri)' : 'var(--txt-muted)', flexShrink: 0, display: 'flex' }}>
          {icon}
        </span>
        <input
          {...inputProps}
          onFocus={e => { setFocused(true); inputProps.onFocus?.(e) }}
          onBlur={e => { setFocused(false); inputProps.onBlur?.(e) }}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            color: 'var(--txt)',
            padding: '11px 0',
            fontFamily: 'var(--font)',
          }}
        />
        {right && (
          <span style={{ flexShrink: 0, display: 'flex', color: 'var(--txt-muted)' }}>
            {right}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      localStorage.setItem('admin_token', res.token)
      localStorage.setItem('admin_name', res.name)
      navigate('/students')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #f0f2ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--card)',
        borderRadius: 18,
        border: '1px solid var(--bdr)',
        boxShadow: '0 8px 32px 0 rgb(67 56 202 / .10), 0 1px 3px 0 rgb(0 0 0 / .06)',
        padding: '40px 36px 36px',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--pri)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-0.02em' }}>
              Attendify
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-mid)', marginTop: 1 }}>
              Admin Portal
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
            Sign in to Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-muted)', fontWeight: 400 }}>
            Restricted access — administrators only
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--rose-light)',
            border: '1px solid #fecdd3',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Email"
            icon={<IconEnvelope />}
            type="email"
            placeholder="admin@attendify.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Field
            label="Password"
            icon={<IconLock />}
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            right={
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--txt-muted)', display: 'flex' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: loading
                ? 'var(--pri-border)'
                : 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
              color: loading ? 'var(--txt-muted)' : '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.01em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: loading ? 'none' : '0 2px 8px 0 rgb(67 56 202 / .25)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
