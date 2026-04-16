import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Building2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function LogoMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="13" fill="#3730a3" />
      <circle cx="24" cy="17" r="7" fill="white" opacity="0.9" />
      <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
      <circle cx="35" cy="35" r="8" fill="#f43f5e" />
      <path d="M31.5 35.2l2.2 2.3 4.3-4.5"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Field({ label, isDark, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ icon: Icon, type = 'text', placeholder, value, onChange, rightEl, isDark }) {
  const fieldBg = isDark ? '#1e1c30' : '#f0f2ff'
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon size={16} color="#94a3b8" />
      </div>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
        style={{
          background: fieldBg,
          border: '1.5px solid transparent',
          color: isDark ? '#e8e6f4' : '#1e1b4b',
          paddingRight: rightEl ? '2.75rem' : undefined,
        }}
        onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = isDark ? '#17162a' : 'white' }}
        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = fieldBg }}
      />
      {rightEl && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isDark } = useTheme()

  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [university, setUniversity] = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [showCf,     setShowCf]     = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 700))

    const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    login({ name: name.trim(), email, role: 'instructor', initials }, false)
    navigate('/dashboard', { replace: true })
    setLoading(false)
  }

  const eyeBtn = (show, setShow) => (
    <button type="button" onClick={() => setShow(v => !v)}
      className="text-slate-400 hover:text-slate-600 transition-colors">
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: isDark ? '#0e0d1c' : '#f0f2ff' }}>

      {/* Brand */}
      <div className="flex flex-col items-center mb-7 gap-3">
        <LogoMark size={56} />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>
            Attendify
          </h1>
          <p className="text-sm mt-1" style={{ color: isDark ? '#565878' : '#94a3b8' }}>
            Create your instructor account
          </p>
        </div>
      </div>

      {/* Card */}
      <div className={`w-full max-w-sm rounded-3xl p-8 ${!isDark ? 'bg-white/80 backdrop-blur-md shadow-xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-100' : ''}`}
        style={isDark ? { background: '#17162a', border: '1px solid #2e2c48', boxShadow: '0 8px 40px rgba(0,0,0,.3)' } : {}}>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <Field label="Full Name" isDark={isDark}>
            <Input icon={User} placeholder="Enter your full name" isDark={isDark}
              value={name} onChange={e => setName(e.target.value)} />
          </Field>

          <Field label="Email" isDark={isDark}>
            <Input icon={Mail} type="email" placeholder="Enter your email" isDark={isDark}
              value={email} onChange={e => setEmail(e.target.value)} />
          </Field>

          <Field label="University / Institution" isDark={isDark}>
            <Input icon={Building2} placeholder="e.g. Istanbul University" isDark={isDark}
              value={university} onChange={e => setUniversity(e.target.value)} />
          </Field>

          <Field label="Password" isDark={isDark}>
            <Input icon={LockIcon} type={showPw ? 'text' : 'password'} isDark={isDark}
              placeholder="Create a password" value={password}
              onChange={e => setPassword(e.target.value)}
              rightEl={eyeBtn(showPw, setShowPw)} />
          </Field>

          <Field label="Confirm Password" isDark={isDark}>
            <Input icon={LockIcon} type={showCf ? 'text' : 'password'} isDark={isDark}
              placeholder="Repeat your password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              rightEl={eyeBtn(showCf, setShowCf)} />
          </Field>

          {error && (
            <div className="text-sm px-4 py-3 rounded-2xl text-center"
              style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all mt-1 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #3730a3, #4f46e5)',
              boxShadow: '0 4px 20px rgba(67,56,202,.35)' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(67,56,202,.50)' }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(67,56,202,.35)'}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <button onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-1.5 mt-5 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
          <ArrowLeft size={14} />
          Back to Sign In
        </button>
      </div>
    </div>
  )
}

function LockIcon({ size = 16, color = '#94a3b8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
