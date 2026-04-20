import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";
import { IndigoBtn } from "../../components/shared/IndigoBtn";

export default function Register() {
  const navigate = useNavigate();
  const { theme: t, isDark } = useTheme();

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
          Create your account
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

        <form onSubmit={handleRegister} noValidate>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
              <input
                id="fullName"
                name="fullName"
                style={{ ...inputBase, border: `1.5px solid ${errors.fullName ? t.acc : t.bdr}` }}
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
            {errors.fullName && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="email"
                name="email"
                style={{ ...inputBase, border: `1.5px solid ${errors.email ? t.acc : t.bdr}` }}
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.email}</p>}
          </div>

          {/* Department — Instructor only */}
          {role === 'instructor' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
                htmlFor="department">Department</label>
              <div style={{ position: 'relative' }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
                <input
                  id="department"
                  name="department"
                  style={{ ...inputBase, border: `1.5px solid ${errors.department ? t.acc : t.bdr}` }}
                  type="text"
                  placeholder="Enter your department"
                  value={form.department}
                  onChange={handleChange}
                  autoComplete="organization"
                />
              </div>
              {errors.department && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.department}</p>}
            </div>
          )}

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2" />
              </svg>
              <input
                id="password"
                name="password"
                style={{ ...inputBase, paddingRight: 42, border: `1.5px solid ${errors.password ? t.acc : t.bdr}` }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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
            {errors.password && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }}
              htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                id="confirmPassword"
                name="confirmPassword"
                style={{ ...inputBase, paddingRight: 42, border: `1.5px solid ${errors.confirmPassword ? t.acc : t.bdr}` }}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', color: t.txtL,
                }}
              >
                {showConfirm ? <EyeOffIcon color={t.txtL} /> : <EyeIcon color={t.txtL} />}
              </button>
            </div>
            {errors.confirmPassword && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.confirmPassword}</p>}
          </div>

          <IndigoBtn>Register</IndigoBtn>
        </form>
      </div>

      {/* Bottom link */}
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.txtL }}>
        Have account?{' '}
        <Link to="/login" style={{ color: t.pri, fontWeight: 700, textDecoration: 'none' }}>
          Sign In
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
