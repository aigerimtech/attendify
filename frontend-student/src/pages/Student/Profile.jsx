import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark } from "../../components/LogoMark";

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
];

const INFO_ROWS = [
  { label: 'Full Name',  key: 'full_name',      icon: 'user',     editable: true  },
  { label: 'Email',      key: 'email',          icon: 'mail',     editable: false },
  { label: 'Student ID', key: 'student_number', icon: 'id',       editable: false },
  { label: 'Department', key: 'department',     icon: 'building', editable: false },
  { label: 'Faculty',    key: 'faculty',        icon: 'star',     editable: false },
];

const INFO_ICON_PATHS = {
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6l-10,7L2,6',
  id:       'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18',
  building: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

const ALERT_ROWS = [
  { key: 'email_alerts',            icon: 'mail',    title: 'Email Alerts',            desc: 'Receive attendance updates by email'   },
  { key: 'attendance_confirmation', icon: 'check',   title: 'Attendance Confirmation', desc: 'Notify when attendance is recorded'    },
  { key: 'low_attendance_warning',  icon: 'warning', title: 'Low Attendance Warning',  desc: 'Alert when below 75% attendance'       },
  { key: 'session_reminders',       icon: 'bell',    title: 'Session Reminders',       desc: '15-min reminder before each class'     },
];

export default function Profile() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme: t, isDark, toggleTheme } = useTheme();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent') || 'null');

  const [activeTab,     setActiveTab]     = useState('info');
  const [pwExpanded,    setPwExpanded]    = useState(false);
  const [notifications, setNotifications] = useState({
    email_alerts: true, attendance_confirmation: true, low_attendance_warning: true, session_reminders: false,
  });
  const [notifLoading, setNotifLoading] = useState(true);
  const [lang, setLang] = useState(
    () => localStorage.getItem('attendify-lang') || 'en'
  );

  // ── profile API state ────────────────────────────────────────
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── avatar / edit state ──────────────────────────────────────
  const fileInputRef = useRef(null);
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState({ full_name: '' });
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── change password state ────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew,     setPwNew]     = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (!currentStudent) { navigate('/login'); return; }
    Promise.all([
      api.get('/auth/me').catch(() => null),
      api.get('/settings/notifications').catch(() => null),
    ]).then(([meData, notifData]) => {
      if (meData) setProfile(meData);
      if (notifData) setNotifications({
        email_alerts:            notifData.email_alerts            ?? true,
        attendance_confirmation: notifData.attendance_confirmation ?? true,
        low_attendance_warning:  notifData.low_attendance_warning  ?? true,
        session_reminders:       notifData.session_reminders       ?? false,
      });
    }).finally(() => {
      setLoading(false);
      setNotifLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t.bg }}>
      <p style={{ fontSize: 14, color: t.txtL, fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
    </div>
  );

  const profileData = profile || currentStudent;
  const initials    = (profileData?.full_name ?? profileData?.name ?? '').split(' ').map((w) => w[0]).join('').toUpperCase();

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUrl(URL.createObjectURL(file));
  }

  async function handleEditToggle() {
    if (!editMode) {
      setEditForm({ full_name: profileData?.full_name ?? '' });
      setSaveError('');
      setSaveSuccess('');
      setEditMode(true);
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await api.patch('/auth/me', { full_name: editForm.full_name });
      setProfile((p) => ({ ...p, full_name: editForm.full_name }));
      const stored = JSON.parse(localStorage.getItem('currentStudent') || 'null');
      if (stored) {
        stored.full_name = editForm.full_name;
        localStorage.setItem('currentStudent', JSON.stringify(stored));
      }
      setSaveSuccess('Profile updated.');
      setEditMode(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentStudent');
    navigate('/login');
  }

  async function toggleNotification(key) {
    const newValue = !notifications[key];
    setNotifications((n) => ({ ...n, [key]: newValue }));
    try {
      await api.patch('/settings/notifications', { [key]: newValue });
    } catch {
      setNotifications((n) => ({ ...n, [key]: !newValue }));
    }
  }

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('attendify-lang', newLang);
  };

  async function handleChangePassword() {
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwCurrent,
        new_password:     pwNew,
      });
      setPwSuccess('Password updated successfully.');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', background: t.bg, border: `1.5px solid ${t.bdr}`,
    borderRadius: 8, padding: '7px 10px', fontSize: 13, fontWeight: 700,
    color: t.txt, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: t.txtL, letterSpacing: 1.2,
    margin: '16px 0 8px', textTransform: 'uppercase',
  };

  // Shared pill style for Language / Theme toggles
  function pillBtn(selected) {
    return {
      padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
      background: selected ? t.pri : 'transparent',
      color: selected ? '#fff' : t.txtL,
      fontWeight: selected ? 700 : 600,
      transition: 'background .15s, color .15s',
    };
  }

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{ background: t.hdr, borderBottom: `1px solid ${t.bdr}`, flexShrink: 0 }}>

        {/* Top row */}
        <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={38} bgColor={t.hdr} />
            <span style={{ fontWeight: 800, fontSize: 17, color: t.txt }}>Attendify</span>
          </div>
          <button
            type="button"
            onClick={handleEditToggle}
            disabled={saving}
            style={{
              background: editMode ? t.priG : t.priLL,
              border: 'none', borderRadius: 20,
              padding: '6px 14px', fontSize: 12, fontWeight: 700,
              color: editMode ? '#fff' : t.pri,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : editMode ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Avatar section */}
        <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 11 }}>
            {/* Gradient ring */}
            <svg width="84" height="84" style={{ position: 'absolute', top: -4, left: -4 }}>
              <defs>
                <linearGradient id="avatarRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4338ca" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <circle cx="42" cy="42" r="40" fill="none" stroke="url(#avatarRing)" strokeWidth="2.5" />
            </svg>
            {/* Avatar circle */}
            <div
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'linear-gradient(135deg,#3730a3,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: '#fff',
                boxShadow: '0 6px 18px rgba(67,56,202,.35)',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl || profileData?.avatar
                ? <img src={avatarUrl || profileData?.avatar} alt={profileData?.full_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span>{initials}</span>
              }
            </div>
            {/* Camera badge */}
            <div
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg,#3730a3,#4f46e5)',
                border: `2px solid ${t.hdr}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(67,56,202,.4)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {/* Change photo link */}
          <span
            style={{ fontSize: 11, color: t.pri, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
            onClick={() => fileInputRef.current?.click()}
          >
            Change Photo
          </span>

          <p style={{ fontWeight: 800, fontSize: 18, color: t.txt, margin: 0, textAlign: 'center' }}>
            {profileData?.full_name ?? profileData?.name ?? ''}
          </p>
          <p style={{ fontSize: 13, color: t.txtL, marginTop: 2 }}>{profileData?.email ?? ''}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: t.priLL, color: t.pri, border: `1px solid ${t.priL}` }}>
              Student
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: t.okL, color: t.ok, border: '1px solid rgba(5,150,105,.2)' }}>
              ● Active
            </span>
          </div>
        </div>

        {/* 3 Tabs */}
        <div style={{ display: 'flex', borderTop: `1px solid ${t.bdr}` }}>
          {['info', 'security', 'alerts'].map((tab) => {
            const active = activeTab === tab;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '11px 4px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                color: active ? t.pri : t.txtL,
                borderBottom: `2px solid ${active ? t.pri : 'transparent'}`,
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Scrollable tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

        {/* face_enrolled warning banner */}
        {profileData?.face_enrolled === false && (
          <div
            onClick={() => navigate('/face-setup')}
            style={{
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 12, padding: '11px 14px', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <p style={{ fontSize: 12, color: '#c2410c', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              Face setup incomplete — your attendance cannot be recorded. Complete setup →
            </p>
          </div>
        )}

        {/* ══ TAB 1: Info ══ */}
        {activeTab === 'info' && (
          <>
            {/* Mini stats bar */}
            <div style={{
              background: 'linear-gradient(135deg,#1e1b4b,#3730a3 55%,#0d9488 100%)',
              borderRadius: 14, display: 'flex', overflow: 'hidden', marginBottom: 14,
            }}>
              {[
                { val: `${profileData?.overall_attendance_rate ?? 0}%`, label: 'Attendance', rose: true  },
                { val: profileData?.total_sessions ?? 0,                label: 'Sessions',   rose: false },
                { val: profileData?.total_courses  ?? 0,                label: 'Courses',    rose: false },
              ].map((col, i) => (
                <div key={col.label} style={{
                  flex: 1, textAlign: 'center', padding: '13px 0',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none',
                }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: col.rose ? t.accMid : '#fff' }}>{col.val}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, fontWeight: 700, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{col.label}</div>
                </div>
              ))}
            </div>

            {/* Student info card */}
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.bdr}`, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '10px 15px', borderBottom: `1px solid ${t.bdr}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.txtL, letterSpacing: 1.2 }}>STUDENT INFORMATION</span>
              </div>
              {INFO_ROWS.map((row, i) => (
                <div key={row.key} style={{ borderBottom: i < INFO_ROWS.length - 1 ? `1px solid ${t.bdr}` : 'none' }}>
                  <div style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, background: t.priLL,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={INFO_ICON_PATHS[row.icon]} />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, color: t.txtL, fontWeight: 600, margin: '0 0 2px' }}>{row.label}</p>
                      {editMode && row.editable ? (
                        <input
                          style={{ ...inputStyle, padding: '4px 8px', fontSize: 13 }}
                          value={editForm[row.key] ?? ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, [row.key]: e.target.value }))}
                        />
                      ) : (
                        <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>
                          {(editMode ? editForm[row.key] : profileData?.[row.key]) ?? '—'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {saveError   && <p style={{ fontSize: 12, color: t.acc, marginBottom: 8, textAlign: 'center' }}>{saveError}</p>}
            {saveSuccess && <p style={{ fontSize: 12, color: t.ok,  marginBottom: 8, textAlign: 'center' }}>{saveSuccess}</p>}

            {/* Log Out */}
            <button type="button" onClick={handleLogout} style={{
              width: '100%', background: t.accL, border: `1px solid ${t.accLL}`,
              borderRadius: 13, padding: 13, color: t.acc, fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                stroke={t.acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log Out
            </button>
          </>
        )}

        {/* ══ TAB 2: Security ══ */}
        {activeTab === 'security' && (
          <>
            <p style={sectionLabel}>Password</p>
            <div style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.bdr}`, marginBottom: 10, overflow: 'hidden' }}>
              <div
                role="button" tabIndex={0}
                onClick={() => setPwExpanded((e) => !e)}
                onKeyDown={(e) => e.key === 'Enter' && setPwExpanded((v) => !v)}
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>Change Password</p>
                </div>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: pwExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              {pwExpanded && (
                <div style={{ padding: '14px 16px 16px', borderTop: `1px solid ${t.bdr}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="password" placeholder="Current password" style={inputStyle}
                    value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)}
                  />
                  <input
                    type="password" placeholder="New password" style={inputStyle}
                    value={pwNew} onChange={(e) => setPwNew(e.target.value)}
                  />
                  <input
                    type="password" placeholder="Confirm new password" style={inputStyle}
                    value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                  />
                  {pwError   && <p style={{ fontSize: 12, color: t.acc, margin: 0 }}>{pwError}</p>}
                  {pwSuccess && <p style={{ fontSize: 12, color: t.ok,  margin: 0 }}>{pwSuccess}</p>}
                  <button
                    type="button"
                    disabled={pwLoading}
                    onClick={handleChangePassword}
                    style={{
                      background: t.priG, color: '#fff', border: 'none', borderRadius: 10,
                      padding: '10px 16px', fontSize: 13, fontWeight: 700,
                      cursor: pwLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: pwLoading ? 0.7 : 1,
                    }}
                  >
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ TAB 3: Alerts ══ */}
        {activeTab === 'alerts' && (
          <>
            {/* Notification toggles */}
            <p style={sectionLabel}>Notifications</p>
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.bdr}`, overflow: 'hidden', marginBottom: 14 }}>
              {notifLoading ? (
                <div style={{ padding: '18px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: t.txtL, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
                </div>
              ) : ALERT_ROWS.map((item, i) => (
                <div key={item.key} style={{ borderBottom: i < ALERT_ROWS.length - 1 ? `1px solid ${t.bdr}` : 'none' }}>
                  <div style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertIcon type={item.icon} color={t.pri} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      on={notifications[item.key]}
                      onToggle={() => toggleNotification(item.key)}
                      ariaLabel={`Toggle ${item.title}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Preferences */}
            <p style={sectionLabel}>Preferences</p>
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.bdr}`, overflow: 'hidden' }}>

              {/* Language row — EN/TR pill */}
              <div style={{ padding: '12px 15px', borderBottom: `1px solid ${t.bdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                    stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0, flex: 1 }}>Language</p>
                {/* EN/TR pill — TODO: wire to i18n when implemented */}
                <div style={{ display: 'flex', background: t.bg, borderRadius: 999, padding: 3 }}>
                  <button style={pillBtn(lang === 'en')} onClick={() => handleLangChange('en')}>EN</button>
                  <button style={pillBtn(lang === 'tr')} onClick={() => handleLangChange('tr')}>TR</button>
                </div>
              </div>

              {/* Time Zone row */}
              <div style={{ padding: '12px 15px', borderBottom: `1px solid ${t.bdr}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                    stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0, flex: 1 }}>Time Zone</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: t.txtL }}>GMT+5</span>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke={t.txtL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>

              {/* Theme row — Light/Dark pill */}
              <div style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                    stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0, flex: 1 }}>Theme</p>
                <div style={{ display: 'flex', background: t.bg, borderRadius: 999, padding: 3 }}>
                  <button style={pillBtn(!isDark)} onClick={() => { if (isDark) toggleTheme(); }}>Light</button>
                  <button style={pillBtn(isDark)}  onClick={() => { if (!isDark) toggleTheme(); }}>Dark</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{
        background: t.nav, borderTop: `1px solid ${t.bdr}`,
        display: 'flex', padding: '8px 0 18px', flexShrink: 0,
      }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} type="button" aria-label={item.label}
              onClick={() => navigate(item.path)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 0', border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke={active ? t.pri : t.txtL} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d={item.iconPath} />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? t.pri : t.txtL }}>{item.label}</span>
              {active && <div style={{ width: 18, height: 3, borderRadius: 999, background: t.pri }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── Toggle switch ───────────────────────────────────────────── */
function ToggleSwitch({ on, onToggle, ariaLabel }) {
  const { theme: t } = useTheme();
  return (
    <div onClick={onToggle} role="switch" aria-checked={on} aria-label={ariaLabel}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: on ? t.pri : t.bdr,
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s', flexShrink: 0,
      }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .2s',
      }} />
    </div>
  );
}

/* ── Alert tab icons ─────────────────────────────────────────── */
function AlertIcon({ type, color }) {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {type === 'mail'    && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>}
      {type === 'check'   && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
      {type === 'warning' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>}
      {type === 'bell'    && <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>}
    </svg>
  );
}
