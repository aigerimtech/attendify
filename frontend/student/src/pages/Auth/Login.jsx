import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockAccounts } from '../../data/mockData';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

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

  return (
    <div className="login-root">
      {/* Dot-pattern background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-dots" />
      </div>

      <div className="login-content">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon">
            <CalendarIcon />
            <span className="login-logo-badge">
              <CheckIcon />
            </span>
          </div>
          <h1 className="login-app-name">Attendify</h1>
          <p className="login-tagline">Smart Attendance Management</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Toggle */}
          <div className="login-toggle" role="group" aria-label="Select role">
            <button
              type="button"
              className={`login-toggle-btn${role === 'student' ? ' active' : ''}`}
              onClick={() => setRole('student')}
            >
              <GraduationCapIcon />
              Student
            </button>
            <button
              type="button"
              className={`login-toggle-btn${role === 'instructor' ? ' active' : ''}`}
              onClick={() => setRole('instructor')}
            >
              <TeacherIcon />
              Instructor
            </button>
          </div>

          <form onSubmit={handleSignIn} noValidate>
            {/* Identifier */}
            <div className="login-field">
              <label className="login-label" htmlFor="identifier">
                {role === 'student' ? 'Student ID or Email' : 'Instructor ID or Email'}
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IdCardIcon />
                </span>
                <input
                  id="identifier"
                  className={`login-input${identifierError ? ' login-input-error' : ''}`}
                  type="text"
                  placeholder={role === 'student' ? 'Enter your student ID or email' : 'Enter your instructor ID or email'}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setIdentifierError(''); }}
                  autoComplete="username"
                />
              </div>
              {identifierError && <p className="login-field-error">{identifierError}</p>}
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  className={`login-input${passwordError ? ' login-input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && <p className="login-field-error">{passwordError}</p>}
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot">
                Forgot Password?
              </Link>
            </div>

            {/* Error */}
            {error && <p className="login-error">{error}</p>}

            {/* Submit */}
            <button type="submit" className="login-submit">
              Sign In
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-access-note">
          Don't have an account?{' '}
          <Link to="/register" className="login-register-link">Register</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function CalendarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4M14 12h4M14 15h2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

