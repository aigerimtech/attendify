import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

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

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) setSent(true);
  }

  return (
    <div className="fp-root">
      {/* Dot-pattern background */}
      <div className="fp-bg" aria-hidden="true">
        <div className="fp-dots" />
      </div>

      <div className="fp-content">
        {/* Logo */}
        <div className="fp-logo-wrap">
          <div className="fp-logo-icon">
            <CalendarIcon />
            <span className="fp-logo-badge">
              <CheckIcon />
            </span>
          </div>
          <h1 className="fp-app-name">Attendify</h1>
          <p className="fp-tagline">Smart Attendance Management</p>
        </div>

        {/* Card */}
        <div className="fp-card">
          <h2 className="fp-title">Forgot Password</h2>
          <p className="fp-subtitle">
            Enter your email and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="fp-success" role="alert">
              <CheckCircleIcon />
              Reset link sent to your email. Please check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="fp-field">
                <label className="fp-label" htmlFor="email">Email</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon"><MailIcon /></span>
                  <input
                    id="email"
                    className={`fp-input${emailError ? ' fp-input-error' : ''}`}
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    autoComplete="email"
                  />
                </div>
                {emailError && <p className="fp-field-error">{emailError}</p>}
              </div>

              <button type="submit" className="fp-submit">
                Send Reset Link
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="fp-back-note">
          <Link to="/login" className="fp-back-link">Back to Login</Link>
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

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
