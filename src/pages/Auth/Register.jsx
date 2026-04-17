import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";
import { IndigoBtn } from "../../components/shared/IndigoBtn";
import { api } from '../../api/client';

export default function Register() {
  const navigate = useNavigate();
  const { theme: t, isDark } = useTheme();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const next = {};
    const nameVal = form.fullName.trim();
    if (!nameVal) next.fullName = 'This field is required';
    else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nameVal)) next.fullName = 'Please enter a valid name';

    const emailVal = form.email.trim();
    if (!emailVal) next.email = 'This field is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) next.email = 'Please enter a valid email address';

    if (!form.password) next.password = 'This field is required';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) next.confirmPassword = 'This field is required';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const parts = form.fullName.trim().split(' ');
      const first_name = parts[0];
      const last_name = parts.slice(1).join(' ') || parts[0];

      // student_number omitted — backend auto-generates it
      await api.post('/auth/register/student', {
        first_name, last_name,
        email: form.email.trim(),
        password: form.password,
        role: 'student',
      });
      navigate('/face-setup');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: '100%', padding: '13px 13px 13px 40px', borderRadius: 12,
    border: `1.5px solid ${t.bdr}`, background: t.bg, fontSize: 14,
    color: t.txt, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{ background: t.bgAlt, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 22px', overflowY: 'auto', flex: 1, minHeight: '100vh' }}>

      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        {isDark ? <LogoMarkDark size={72} /> : <LogoMark size={72} />}
        <div style={{ fontWeight: 800, fontSize: 28, color: t.txt, letterSpacing: -0.6, marginTop: 12 }}>Attendify</div>
        <div style={{ fontSize: 13, color: t.txtL, marginTop: 4 }}>Create your student account</div>
      </div>

      <div style={{ background: t.card, borderRadius: 26, padding: 24, width: '100%', border: `1px solid ${t.bdr}`, boxShadow: t.shMd }}>

        <form onSubmit={handleRegister} noValidate>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }} htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <UserIcon color={t.txtL} />
              <input id="fullName" name="fullName" style={{ ...inputBase, border: `1.5px solid ${errors.fullName ? t.acc : t.bdr}` }} type="text" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} autoComplete="name" />
            </div>
            {errors.fullName && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }} htmlFor="email">Email</label>
            <div style={{ position: 'relative' }}>
              <MailIcon color={t.txtL} />
              <input id="email" name="email" style={{ ...inputBase, border: `1.5px solid ${errors.email ? t.acc : t.bdr}` }} type="email" placeholder="Enter your email address" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            {errors.email && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }} htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <LockIcon color={t.txtL} />
              <input id="password" name="password" style={{ ...inputBase, paddingRight: 42, border: `1.5px solid ${errors.password ? t.acc : t.bdr}` }} type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={handleChange} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOffIcon color={t.txtL} /> : <EyeIcon color={t.txtL} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.txt, marginBottom: 6, display: 'block' }} htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <ShieldIcon color={t.txtL} />
              <input id="confirmPassword" name="confirmPassword" style={{ ...inputBase, paddingRight: 42, border: `1.5px solid ${errors.confirmPassword ? t.acc : t.bdr}` }} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showConfirm ? <EyeOffIcon color={t.txtL} /> : <EyeIcon color={t.txtL} />}
              </button>
            </div>
            {errors.confirmPassword && <p style={{ fontSize: 12, color: t.acc, marginTop: 4, marginBottom: 0 }}>{errors.confirmPassword}</p>}
          </div>

          {apiError && <p style={{ fontSize: 13, color: t.acc, marginBottom: 12, textAlign: 'center' }}>{apiError}</p>}
          <IndigoBtn disabled={loading}>{loading ? 'Registering…' : 'Register'}</IndigoBtn>
        </form>

        {/* Admin note */}
        <p style={{ fontSize: 11, color: t.txtL, textAlign: 'center', marginTop: 16, lineHeight: 1.6, padding: '0 4px' }}>
          Student numbers are assigned by your administrator and appear in your profile after account setup.
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.txtL }}>
        Have account?{' '}<Link to="/login" style={{ color: t.pri, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
      </p>
    </div>
  );
}

function iconStyle() {
  return { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
}
function UserIcon({ color }) {
  return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle()}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /></svg>;
}
function MailIcon({ color }) {
  return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle()}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
}
function LockIcon({ color }) {
  return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle()}><path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2" /></svg>;
}
function ShieldIcon({ color }) {
  return <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle()}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function EyeIcon({ color }) {
  return <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function EyeOffIcon({ color }) {
  return <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
}
