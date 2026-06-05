import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/adminService.js'

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [pwFocused, setPwFocused]       = useState(false)

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

  const inputWrap = (focused) => ({
    display: 'flex', alignItems: 'center',
    background: focused ? '#fff' : '#f4f5ff',
    border: `1.5px solid ${focused ? '#6366f1' : '#e0e7ff'}`,
    borderRadius: 12, padding: '0 14px', gap: 10,
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #f0f2ff 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, #3730a3, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 8px 24px rgba(67,56,202,0.30)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e1b4b', letterSpacing: -0.5 }}>Attendify</div>
        <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>Admin Portal</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#fff',
        borderRadius: 24,
        border: '1px solid #e0e7ff',
        boxShadow: '0 8px 40px rgba(67,56,202,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        padding: '28px 28px 24px',
      }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1e1b4b', marginBottom: 4 }}>
          Sign in to continue
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
          Restricted access — administrators only
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff1f2', border: '1px solid #fecdd3',
            borderRadius: 10, padding: '10px 14px', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e11d48' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>Email</label>
            <div style={inputWrap(emailFocused)}>
              <span style={{ color: emailFocused ? '#6366f1' : '#94a3b8', display: 'flex', flexShrink: 0 }}><IconUser /></span>
              <input
                type="email"
                placeholder="admin@attendify.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                autoComplete="email"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  outline: 'none', fontSize: 14, color: '#1e1b4b',
                  padding: '11px 0', fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>Password</label>
            <div style={inputWrap(pwFocused)}>
              <span style={{ color: pwFocused ? '#6366f1' : '#94a3b8', display: 'flex', flexShrink: 0 }}><IconLock /></span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                required
                autoComplete="current-password"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  outline: 'none', fontSize: 14, color: '#1e1b4b',
                  padding: '11px 0', fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex', flexShrink: 0 }}
              >
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              width: '100%', padding: '13px 0',
              borderRadius: 12, border: 'none',
              background: loading
                ? '#c7d2fe'
                : 'linear-gradient(135deg, #3730a3, #4f46e5)',
              color: loading ? '#6366f1' : '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(67,56,202,0.30)',
              transition: 'opacity 0.15s',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

        </form>

        {/* Demo hint */}
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
          Demo: admin@attendify.com · admin123
        </p>
      </div>
    </div>
  )
}
