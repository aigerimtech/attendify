import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";

const STEPS = ['Email', 'Verify', 'Reset', 'Done'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme: t } = useTheme();

  // ── existing logic ──────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  function validate() {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('code');
    } catch (err) {
      setApiError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  // ────────────────────────────────────────────────────────────

  const [step, setStep] = useState('email'); // email | code | reset | done
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const codeRefs = useRef([]);

  const stepIndex = { email: 0, code: 1, reset: 2, done: 3 };
  const current = stepIndex[step];

  function handleBack() {
    if (step === 'code') setStep('email');
    else if (step === 'reset') setStep('code');
    else if (step === 'done') navigate('/login');
    else navigate('/login');
  }

  function handleCodeChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function handleCodeKeyDown(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  }

  async function handleReset() {
    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/reset-password', {
        email,
        code: code.join(''),
        new_password: newPassword,
      });
      setStep('done');
    } catch (err) {
      setApiError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: '100%',
    padding: '13px 13px 13px 40px',
    borderRadius: 12,
    border: `1.5px solid ${t.bdr}`,
    background: t.bg,
    fontSize: 14,
    color: t.txt,
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  };

  const greenBtn = {
    width: '100%',
    background: 'linear-gradient(135deg,#047857,#059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '13px 16px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 6px 18px rgba(5,150,105,.3)',
  };

  const iconBox = (color) => ({
    width: 56,
    height: 56,
    borderRadius: 16,
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
  });

  return (
    <div style={{
      background: t.bgAlt,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 22px 32px',
      overflowY: 'auto',
      flex: 1,
      minHeight: '100vh',
    }}>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
        position: 'relative',
      }}>
        <button onClick={handleBack} style={{
          background: t.card,
          border: `1px solid ${t.bdr}`,
          borderRadius: 10,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke={t.txt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: 800,
          fontSize: 18,
          color: t.txt,
        }}>Reset Password</span>
      </div>

      {/* Step indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        width: '100%',
      }}>
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: done ? t.ok : active ? t.pri : t.bdr,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: done || active ? '#fff' : t.txtL,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {done ? (
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  marginTop: 4,
                  color: done ? t.ok : active ? t.pri : t.txtL,
                }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 32,
                  height: 2,
                  margin: '0 4px 16px',
                  background: i < current ? t.ok : t.bdr,
                  borderRadius: 999,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div style={{
        background: t.card,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        border: `1px solid ${t.bdr}`,
        boxShadow: t.shMd,
      }}>

        {/* ── STEP: email ── */}
        {step === 'email' && (
          <>
            <div style={iconBox(t.priLL)}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: t.txt, textAlign: 'center', marginBottom: 8 }}>
              Forgot Password?
            </div>
            <div style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, textAlign: 'center', marginBottom: 20 }}>
              Enter your email address and we'll send you a verification code to reset your password.
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
                  htmlFor="fp-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                    stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="fp-email"
                    style={{ ...inputBase, border: `1.5px solid ${emailError ? t.acc : t.bdr}` }}
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    autoComplete="email"
                  />
                </div>
                {emailError && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{emailError}</p>}
              </div>

              {apiError && <p style={{ fontSize: 13, color: t.acc, marginBottom: 12, textAlign: 'center' }}>{apiError}</p>}
              <button type="submit" style={{ ...greenBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.txtL }}>
              Remember it?{' '}
              <Link to="/login" style={{ color: t.pri, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </>
        )}

        {/* ── STEP: code ── */}
        {step === 'code' && (
          <>
            <div style={iconBox(t.priLL)}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: t.txt, textAlign: 'center', marginBottom: 8 }}>
              Check Your Email
            </div>
            <div style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, textAlign: 'center', marginBottom: 20 }}>
              We sent a 6-digit code to{' '}
              <span style={{ color: t.txt, fontWeight: 700 }}>{email}</span>
            </div>

            {/* 6 code boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 12,
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: t.txt,
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    border: `2px solid ${digit ? t.pri : t.bdr}`,
                    background: digit ? t.priLL : t.bg,
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: t.txtL, marginBottom: 20 }}>
              Didn't receive it?{' '}
              <span
                onClick={() => {}}
                style={{ color: t.acc, fontWeight: 700, cursor: 'pointer' }}
              >Resend code</span>
            </p>

            <button style={greenBtn} onClick={() => { setApiError(''); setStep('reset'); }}>Verify Code</button>
          </>
        )}

        {/* ── STEP: reset ── */}
        {step === 'reset' && (
          <>
            <div style={iconBox(t.priLL)}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: t.txt, textAlign: 'center', marginBottom: 8 }}>
              Set New Password
            </div>
            <div style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, textAlign: 'center', marginBottom: 20 }}>
              Your new password must be at least 8 characters.
            </div>

            {/* New Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
                </svg>
                <input
                  style={inputBase}
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  style={inputBase}
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Strength bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: t.txtL }}>Password strength</span>
                <span style={{ fontSize: 11, color: t.ok, fontWeight: 700 }}>Strong</span>
              </div>
              <div style={{ background: t.bdr, height: 5, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', background: 'linear-gradient(90deg,#047857,#059669)', borderRadius: 999 }} />
              </div>
            </div>

            {apiError && <p style={{ fontSize: 13, color: t.acc, marginBottom: 12, textAlign: 'center' }}>{apiError}</p>}
            <button style={{ ...greenBtn, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={handleReset}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        )}

        {/* ── STEP: done ── */}
        {step === 'done' && (
          <>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#047857,#059669)',
              boxShadow: '0 8px 24px rgba(5,150,105,.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: t.ok, textAlign: 'center', marginBottom: 10 }}>
              Password Reset!
            </div>
            <div style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
              Your password has been successfully reset. You can now sign in with your new password.
            </div>

            <button style={greenBtn} onClick={() => navigate('/login')}>
              Sign In Now
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
