import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockAccounts } from '../../data/mockData';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";
import { IndigoBtn } from "../../components/shared/IndigoBtn";

export default function Login() {
  const navigate = useNavigate();
  const { theme: t, isDark } = useTheme();

  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
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

  function handleSignIn(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    const match = mockAccounts.find(
      (u) => u.email === identifier && u.password === password
    );

    if (!match) {
      setError('Invalid credentials. Please try again.');
      return;
    }

    localStorage.setItem('currentStudent', JSON.stringify(match));
    navigate('/student/dashboard');
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

  const roles = [
    {
      key: 'student',
      label: 'Student',
      path: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5',
    },
    {
      key: 'instructor',
      label: 'Instructor',
      path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    },
  ];

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
        {isDark ? <LogoMarkDark size={72} /> : <LogoMark size={72} />}
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

        {/* Role toggle */}
        <div style={{
          background: t.bg,
          borderRadius: 13,
          padding: 4,
          marginBottom: 22,
          display: 'flex',
        }} role="group" aria-label="Select role">
          {roles.map(({ key, label, path }) => {
            const active = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .15s',
                  background: active ? t.card : 'transparent',
                  color: active ? t.pri : t.txtL,
                  boxShadow: active ? t.sh : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={active ? t.pri : t.txtL} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d={path} />
                </svg>
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSignIn} noValidate>

          {/* Identifier field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="identifier">
              {role === 'student' ? 'Student ID or Email' : 'Instructor ID or Email'}
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
                placeholder={role === 'student' ? 'Enter your student ID or email' : 'Enter your instructor ID or email'}
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

          {/* Submit */}
          <IndigoBtn>Sign In</IndigoBtn>
        </form>
      </div>

      {/* Bottom link */}
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.txtL }}>
        No account?{' '}
        <Link to="/register" style={{ color: t.pri, fontWeight: 700, textDecoration: 'none' }}>
          Register
        </Link>
      </p>
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
