import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, ExternalLink, X, Mail, Lock, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../api/client'

const STUDENT_APP_URL = 'https://attendify-student.app'

/* ── LogoMark ─────────────────────────────────────────────────── */
function LogoMark({ size = 64 }) {
  const br = Math.round(18 * (size / 64))
  const iconSize = Math.round(size * 0.48)
  return (
    <div style={{
      width: size, height: size, borderRadius: br,
      background: 'linear-gradient(135deg, #3730a3, #4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(67,56,202,0.30)',
      margin: '0 auto', flexShrink: 0,
    }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24"
        fill="none" stroke="#fff" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    </div>
  )
}

/* ── Step indicator ───────────────────────────────────────────── */
const STEPS = ['Email', 'Verify', 'Reset', 'Done']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-7 px-2">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        const stepNum = i + 1
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: done ? '#4f46e5' : active ? '#4f46e5' : '#e2e8f0',
                  color: done || active ? 'white' : '#94a3b8',
                }}
              >
                {done
                  ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : stepNum
                }
              </div>
              <span className="text-[10px] font-semibold"
                style={{ color: done || active ? '#4f46e5' : '#94a3b8' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-10 h-0.5 mx-1 mb-4 rounded-full transition-all"
                style={{ background: i < current ? '#4f46e5' : '#e2e8f0' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── OTP input ────────────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const refs = useRef(Array.from({ length: 6 }, () => null))

  function handleChange(i, e) {
    const val = e.target.value.replace(/\D/, '')
    if (!val) return
    const arr = value.split('')
    arr[i] = val.slice(-1)
    onChange(arr.join(''))
    if (i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      const arr = value.split('')
      if (arr[i]) {
        arr[i] = ''
        onChange(arr.join(''))
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center my-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-bold rounded-2xl outline-none transition-all"
          style={{
            background: value[i] ? 'var(--c-surface)' : 'var(--c-bg-soft)',
            border: value[i] ? '2px solid #4f46e5' : '2px solid var(--c-border)',
            color: 'var(--c-text-1)',
          }}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = value[i] ? '#4f46e5' : 'var(--c-border)'}
        />
      ))}
    </div>
  )
}

/* ── Password strength ────────────────────────────────────────── */
function passwordStrength(pw) {
  if (!pw) return { label: '', color: '#e2e8f0', width: 0 }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak',   color: '#f43f5e', width: 25  }
  if (score === 2) return { label: 'Fair',   color: '#f59e0b', width: 50  }
  if (score === 3) return { label: 'Good',   color: '#3b82f6', width: 75  }
  return              { label: 'Strong', color: '#10b981', width: 100 }
}

/* ── Forgot Password Modal (4-step wizard) ────────────────────── */
function ForgotPasswordModal({ onClose }) {
  const [step,     setStep]     = useState(0)
  const [email,    setEmail]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [otpError, setOtpError] = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [confirmPw,setConfirmPw]= useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [pwError,  setPwError]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [resent,   setResent]   = useState(false)

  const strength = passwordStrength(newPw)

  async function handleSendCode(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setStep(1)
    } catch (err) {
      setOtpError(err.message || 'Could not send code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (otp.length < 6) { setOtpError('Enter the 6-digit code'); return }
    setOtpError('')
    setStep(2)
  }

  async function handleReset(e) {
    e.preventDefault()
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    setPwError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email: email.trim(), code: otp, new_password: newPw })
      setStep(3)
    } catch (err) {
      setPwError(err.message || 'Reset failed. Check your code and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResent(true)
    setOtp('')
    try { await api.post('/auth/forgot-password', { email: email.trim() }) } catch {}
    setTimeout(() => setResent(false), 3000)
  }

  const fieldInputStyle = {
    background: 'var(--c-bg-soft)',
    border: '1.5px solid transparent',
    color: 'var(--c-text-1)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(14,13,28,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-3xl p-7 relative"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 20px 60px rgba(67,56,202,.22)' }}>

        <div className="flex items-center gap-3 mb-6">
          {step < 3 && (
            <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
              <ArrowLeft size={16} className="text-slate-500 dark:text-slate-400" />
            </button>
          )}
          <h3 className="font-bold text-base" style={{ color: 'var(--c-text-1)' }}>Reset Password</h3>
          <button onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <StepIndicator current={step} />

        {/* ── Step 0: Email ── */}
        {step === 0 && (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--c-nav-bg)' }}>
              <Mail size={22} className="text-primary-600" />
            </div>
            <h4 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--c-text-1)' }}>Forgot Password?</h4>
            <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
              Enter your email and we'll send you a verification code to reset your password.
            </p>
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--c-text-1)' }}>Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" required placeholder="Enter your email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={fieldInputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = 'var(--c-surface)' }}
                    onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--c-bg-soft)' }} />
                </div>
              </div>
              <Spinner loading={loading} label="Send Reset Code" />
            </form>
            <p className="text-sm text-center mt-4" style={{ color: 'var(--c-text-3)' }}>
              Remember it?{' '}
              <button onClick={onClose} className="font-semibold text-primary-600">Sign In</button>
            </p>
          </>
        )}

        {/* ── Step 1: Verify OTP ── */}
        {step === 1 && (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--c-nav-bg)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <h4 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--c-text-1)' }}>Check Your Email</h4>
            <p className="text-sm text-center mb-1" style={{ color: 'var(--c-text-3)' }}>We sent a 6-digit code to</p>
            <p className="text-sm font-semibold text-center mb-5" style={{ color: 'var(--c-text-1)' }}>{email}</p>
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <OtpInput value={otp} onChange={setOtp} />
              {otpError && (
                <p className="text-xs text-center" style={{ color: '#f43f5e' }}>{otpError}</p>
              )}
              <Spinner loading={loading} label="Verify Code" disabled={otp.length < 6} />
            </form>
            <p className="text-sm text-center mt-4" style={{ color: 'var(--c-text-3)' }}>
              Didn't receive it?{' '}
              <button onClick={handleResend} className="font-semibold transition-colors" style={{ color: resent ? '#10b981' : '#4f46e5' }}>
                {resent ? 'Code resent!' : 'Resend code'}
              </button>
            </p>
          </>
        )}

        {/* ── Step 2: New Password ── */}
        {step === 2 && (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--c-nav-bg)' }}>
              <Lock size={22} className="text-primary-600" />
            </div>
            <h4 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--c-text-1)' }}>Set New Password</h4>
            <p className="text-sm text-center mb-5" style={{ color: 'var(--c-text-3)' }}>Your new password must be at least 8 characters.</p>
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--c-text-1)' }}>New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Create new password" value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={fieldInputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = 'var(--c-surface)' }}
                    onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--c-bg-soft)' }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--c-text-3)' }}>Password strength</span>
                      <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${strength.width}%`, background: strength.color }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--c-text-1)' }}>Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={showCf ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={fieldInputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = 'var(--c-surface)' }}
                    onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--c-bg-soft)' }} />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCf ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
              {pwError && <p className="text-xs text-center" style={{ color: '#f43f5e' }}>{pwError}</p>}
              <Spinner loading={loading} label="Reset Password" icon={<Lock size={15} />} />
            </form>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 8px 24px rgba(67,56,202,.35)' }}>
              <CheckCircle2 size={30} className="text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2" style={{ color: '#4f46e5' }}>Password Reset!</h4>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--c-text-3)' }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 4px 20px rgba(67,56,202,.35)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Reusable submit button ───────────────────────────────────── */
function Spinner({ loading, label, disabled, icon }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 4px 20px rgba(67,56,202,.35)' }}>
      {loading ? (
        <>
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Processing…
        </>
      ) : (
        <>{icon}{label}</>
      )}
    </button>
  )
}

/* ── Login page ───────────────────────────────────────────────── */
export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const { isDark } = useTheme()

  const [username,   setUsername]   = useState('')
  const [password,   setPassword]   = useState('')
  const [remember,   setRemember]   = useState(false)
  const [showPw,     setShowPw]     = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.loginForm(username.trim(), password)
      localStorage.setItem('attendify_token', data.access_token)
      login({
        name:       data.full_name,
        email:      data.email ?? username.trim(),
        username:   username.trim(),
        role:       data.role,
        department: data.department,
        user_id:    data.user_id,
        initials:   data.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }, remember)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  const fieldBg = isDark ? '#1e1c30' : '#f0f2ff'
  const fieldColor = isDark ? '#e8e6f4' : '#1e1b4b'
  const fieldInputStyle = {
    background: fieldBg,
    border: '1.5px solid transparent',
    color: fieldColor,
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: isDark ? '#0e0d1c' : '#f0f2ff' }}>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Brand */}
      <div className="flex flex-col items-center mb-8 gap-3">
        <LogoMark size={64} />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>Attendify</h1>
          <p className="text-sm mt-1" style={{ color: isDark ? '#565878' : '#94a3b8' }}>Smart Attendance Management</p>
        </div>
      </div>

      {/* Card */}
      <div className={`w-full max-w-sm rounded-2xl p-8 ${
        isDark
          ? ''
          : 'bg-white/80 backdrop-blur-md shadow-xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-100'
      }`}
        style={isDark
          ? { background: '#17162a', border: '1px solid #2e2c48', boxShadow: '0 8px 40px rgba(0,0,0,.3)' }
          : {}
        }>
        <p className="text-base font-semibold mb-6" style={{ color: isDark ? '#8b8faa' : '#64748b' }}>Sign in to continue</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>Username</label>
            <div className="relative">
              <User size={16} color="#94a3b8" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" required placeholder="Enter your username" value={username}
                autoComplete="username"
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={fieldInputStyle}
                onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = isDark ? '#17162a' : 'white' }}
                onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = fieldBg }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#e8e6f4' : '#1e1b4b' }}>Password</label>
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type={showPw ? 'text' : 'password'} required placeholder="Enter your password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-2xl text-sm outline-none transition-all"
                style={fieldInputStyle}
                onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = isDark ? '#17162a' : 'white' }}
                onBlur={e =>  { e.target.style.borderColor = 'transparent'; e.target.style.background = fieldBg }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between -mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRemember(v => !v)}>
              <div className="w-4 h-4 rounded flex items-center justify-center border transition-all"
                style={{ background: remember ? '#4f46e5' : 'transparent', borderColor: remember ? '#4f46e5' : '#cbd5e1' }}>
                {remember && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm" style={{ color: isDark ? '#8b8faa' : '#64748b' }}>Remember me</span>
            </label>
            <button type="button" onClick={() => setShowForgot(true)}
              className="text-sm font-semibold text-rose-500 hover:text-rose-700 transition-colors">
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-2xl text-center"
              style={{ background: '#fff1f2', color: '#f43f5e', border: '1px solid #fecdd3' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all mt-1 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg,#3730a3,#4f46e5)', boxShadow: '0 4px 20px rgba(67,56,202,.35)' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(67,56,202,.50)' }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(67,56,202,.35)'}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

      </div>

      {/* Student app redirect */}
      <div className="mt-4 flex items-center gap-2 px-5 py-3 rounded-2xl"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 1px 4px rgba(67,56,202,.07)' }}>
        <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>Are you a student?</span>
        <a href={STUDENT_APP_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
          Access the student app <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}
