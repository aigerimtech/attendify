import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark } from "../../components/LogoMark";
import { IndigoBtn } from "../../components/shared/IndigoBtn";

export default function Login() {
  const navigate = useNavigate();
  const { theme: t, isDark } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  function validate() {
    let valid = true;
    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Please enter a valid email or Student ID');
      valid = false;
    } else if (trimmed.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setIdentifierError('Please enter a valid email or Student ID');
      valid = false;
    } else {
      setIdentifierError('');
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.loginForm(identifier.trim(), password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('currentStudent', JSON.stringify({
        full_name: data.full_name,
        email: identifier.trim(),
        student_number: data.student_number,
        department: data.department,
        face_enrolled: data.face_enrolled,
        role: data.role,
        user_id: data.user_id,
      }));
      if (!data.face_enrolled) {
        navigate('/face-setup');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
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

  return (
    <div style={{
      background: t.bgAlt,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '28px 22px',
      overflowY: 'auto',
      flex: 1,
      minHeight: '100vh',
    }}>

      {/* Logo section */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <LogoMark size={72} bgColor={t.bgAlt} />
        <div style={{ fontWeight: 800, fontSize: 28, color: t.txt, letterSpacing: -0.6, marginTop: 12 }}>
          Attendify
        </div>
        <div style={{ fontSize: 13, color: t.txtL, marginTop: 4 }}>
          Smart Attendance Management
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: t.card,
        borderRadius: 26,
        padding: 24,
        width: '100%',
        border: `1px solid ${t.bdr}`,
        boxShadow: t.shMd,
      }}>

        <form onSubmit={handleSignIn} noValidate>

          {/* Identifier field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="identifier">
              Email or Student ID
            </label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
              <input
                id="identifier"
                style={{ ...inputBase, border: `1.5px solid ${identifierError ? t.acc : t.bdr}` }}
                type="text"
                placeholder="Enter your email or student ID"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setIdentifierError(''); }}
                autoComplete="username"
              />
            </div>
            {identifierError && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{identifierError}</p>}
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
              </svg>
              <input
                id="password"
                style={{ ...inputBase, paddingRight: 42, border: `1.5px solid ${passwordError ? t.acc : t.bdr}` }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', color: t.txtL,
                }}
              >
                {showPassword ? <EyeOffIcon color={t.txtL} /> : <EyeIcon color={t.txtL} />}
              </button>
            </div>
            {passwordError && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{passwordError}</p>}
          </div>

          {/* Remember me + Forgot password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: t.txtL, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: t.pri }}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ fontSize: 13, color: t.acc, fontWeight: 600, textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          {/* Error */}
          {error && <p style={{ fontSize: 13, color: t.acc, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: t.priLL, border: `1px solid ${t.priL}`,
            borderRadius: 10, padding: '9px 12px', marginBottom: 12,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 12, color: t.pri, fontWeight: 600, lineHeight: 1.4 }}>
              New student? Complete face registration before signing in.{' '}
              <Link to="/face-setup" style={{ color: t.pri, textDecoration: 'underline', fontWeight: 800 }}>
                Register Face →
              </Link>
            </span>
          </div>

          {/* Submit */}
          <IndigoBtn>Sign In</IndigoBtn>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('token', 'dev-token');
                localStorage.setItem('currentStudent', JSON.stringify({
                  full_name: 'Dev Student',
                  email: 'dev@test.com',
                  student_number: 'STU-0000',
                  department: 'Computer Engineering',
                  face_enrolled: true,
                  role: 'student',
                  user_id: 0,
                }));
                navigate('/student/dashboard');
              }}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                border: '1.5px solid #aaa',
                background: 'transparent',
                color: '#888',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              Dev Login (skip auth)
            </button>
          )}
        </form>
      </div>

    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function EyeIcon({ color }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ color }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
