import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const next = {};
    const nameVal = form.fullName.trim();
    if (!nameVal) {
      next.fullName = 'This field is required';
    } else if (!/^[A-Za-z\s]+$/.test(nameVal)) {
      next.fullName = 'Please enter a valid name';
    }

    const emailVal = form.email.trim();
    if (!emailVal) {
      next.email = 'This field is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      next.email = 'Please enter a valid email address';
    }

    if (role === 'instructor') {
      const deptVal = form.department.trim();
      if (!deptVal) {
        next.department = 'This field is required';
      } else if (!/^[A-Za-z\s]+$/.test(deptVal)) {
        next.department = 'Please enter a valid name';
      }
    }

    if (!form.password) {
      next.password = 'This field is required';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'This field is required';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!validate()) return;
    if (role === 'student') {
      navigate('/face-setup');
    } else {
      navigate('/login');
    }
  }

  return (
    <div className="reg-root">
      {/* Dot-pattern background */}
      <div className="reg-bg" aria-hidden="true">
        <div className="reg-dots" />
      </div>

      <div className="reg-content">
        {/* Logo */}
        <div className="reg-logo-wrap">
          <div className="reg-logo-icon">
            <CalendarIcon />
            <span className="reg-logo-badge">
              <CheckIcon />
            </span>
          </div>
          <h1 className="reg-app-name">Attendify</h1>
          <p className="reg-tagline">Create your account</p>
        </div>

        {/* Card */}
        <div className="reg-card">
          {/* Toggle */}
          <div className="reg-toggle" role="group" aria-label="Select role">
            <button
              type="button"
              className={`reg-toggle-btn${role === 'student' ? ' active' : ''}`}
              onClick={() => setRole('student')}
            >
              <GraduationCapIcon />
              Student
            </button>
            <button
              type="button"
              className={`reg-toggle-btn${role === 'instructor' ? ' active' : ''}`}
              onClick={() => setRole('instructor')}
            >
              <TeacherIcon />
              Instructor
            </button>
          </div>

          <form onSubmit={handleRegister} noValidate>
            {/* Full Name */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="fullName">Full Name</label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon"><UserIcon /></span>
                <input
                  id="fullName"
                  name="fullName"
                  className={`reg-input${errors.fullName ? ' reg-input-error' : ''}`}
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="reg-field-error">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="email">Email</label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon"><MailIcon /></span>
                <input
                  id="email"
                  name="email"
                  className={`reg-input${errors.email ? ' reg-input-error' : ''}`}
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="reg-field-error">{errors.email}</p>}
            </div>

            {/* Department — Instructor only */}
            {role === 'instructor' && (
              <div className="reg-field">
                <label className="reg-label" htmlFor="department">Department</label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon"><BuildingIcon /></span>
                  <input
                    id="department"
                    name="department"
                    className={`reg-input${errors.department ? ' reg-input-error' : ''}`}
                    type="text"
                    placeholder="Enter your department"
                    value={form.department}
                    onChange={handleChange}
                    autoComplete="organization"
                  />
                </div>
                {errors.department && <p className="reg-field-error">{errors.department}</p>}
              </div>
            )}

            {/* Password */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="password">Password</label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon"><LockIcon /></span>
                <input
                  id="password"
                  name="password"
                  className={`reg-input${errors.password ? ' reg-input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reg-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="reg-field-error">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon"><ShieldIcon /></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`reg-input${errors.confirmPassword ? ' reg-input-error' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reg-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && <p className="reg-field-error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="reg-submit">
              Register
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="reg-signin-note">
          Already have an account?{' '}
          <Link to="/login" className="reg-signin-link">Sign In</Link>
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

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function BuildingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
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

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
