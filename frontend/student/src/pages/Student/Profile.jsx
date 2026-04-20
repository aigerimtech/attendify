import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockRecentActivity } from '../../data/mockData';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
];

const INFO_ROWS = [
  { label: 'Full Name',  key: 'name',       icon: 'user',     editable: true  },
  { label: 'Email',      key: 'email',      icon: 'mail',     editable: true  },
  { label: 'Student ID', key: 'studentId',  icon: 'id',       editable: false },
  { label: 'Department', key: 'department', icon: 'building', editable: true  },
  { label: 'Year',       key: 'joined',     icon: 'star',     editable: false },
];

const INFO_ICON_PATHS = {
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6l-10,7L2,6',
  id:       'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18',
  building: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

const SESSIONS = [
  { id: 1, device: 'iPhone 15',        location: 'Almaty, KZ', time: 'Active now',  current: true  },
  { id: 2, device: 'MacBook Pro',      location: 'Almaty, KZ', time: '2 hours ago', current: false },
  { id: 3, device: 'Chrome · Windows', location: 'Almaty, KZ', time: '3 days ago',  current: false },
];

const ALERT_ROWS = [
  { key: 'email',         icon: 'mail',    title: 'Email Alerts',            desc: 'Receive attendance updates by email'   },
  { key: 'attendance',    icon: 'check',   title: 'Attendance Confirmation', desc: 'Notify when attendance is recorded'    },
  { key: 'lowAttendance', icon: 'warning', title: 'Low Attendance Warning',  desc: 'Alert when below 75% attendance'       },
  { key: 'reminders',     icon: 'bell',    title: 'Session Reminders',       desc: '15-min reminder before each class'     },
];

export default function Profile() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme: t, isDark, toggleTheme } = useTheme();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  // ── existing state ──────────────────────────────────────────
  const [editMode,      setEditMode]      = useState(false);
  const [activeTab,     setActiveTab]     = useState('info');
  const [pwExpanded,    setPwExpanded]    = useState(false);
  const [twoFAEnabled,  setTwoFAEnabled]  = useState(false);
  const [editForm,      setEditForm]      = useState({});
  const [notifications, setNotifications] = useState({
    email: true, attendance: true, lowAttendance: true, reminders: false,
  });

  // ── new state ───────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(null); // null = show initials
  const [lang, setLang] = useState(
    () => localStorage.getItem('attendify-lang') || 'en'
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentStudent) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const initials      = currentStudent.name.split(' ').map((w) => w[0]).join('').toUpperCase();
  const activity      = mockRecentActivity[currentStudent.studentId] || [];
  const presentCount  = activity.filter((a) => a.status === 'Present').length;
  const avgAttendance = activity.length > 0 ? Math.round((presentCount / activity.length) * 100) : 0;
  const totalCourses  = currentStudent.courses.length;

  // ── existing handlers ───────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem('currentStudent');
    navigate('/login');
  }

  function handleEditToggle() {
    if (!editMode) {
      setEditForm({ name: currentStudent.name, email: currentStudent.email, department: currentStudent.department });
    }
    setEditMode((e) => !e);
  }

  function handleFormChange(key, value) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  function toggleNotification(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }));
  }

  // ── new handlers ────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Language: mock only — saves preference but does NOT translate page
  // TODO: wire to i18n library when full translation is implemented
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('attendify-lang', newLang);
  };

  const displayStudent = editMode ? { ...currentStudent, ...editForm } : currentStudent;

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
            {isDark ? <LogoMarkDark size={32} /> : <LogoMark size={32} />}
            <span style={{ fontWeight: 800, fontSize: 17, color: t.txt }}>Attendify</span>
          </div>
          <button type="button" onClick={handleEditToggle} style={{
            background: editMode ? t.okL : t.priLL,
            border: `1px solid ${editMode ? 'rgba(5,150,105,.2)' : t.priL}`,
            borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700,
            color: editMode ? t.ok : t.pri, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {editMode ? (
              <>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke={t.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save
              </>
            ) : (
              <>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke={t.pri} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </>
            )}
          </button>
        </div>

        {/* Hidden file input for avatar upload */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />

        {/* Avatar section */}
        <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#3730a3,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: '#fff',
                boxShadow: '0 6px 18px rgba(67,56,202,.35)',
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (currentStudent.avatar
                    ? <img src={currentStudent.avatar} alt={currentStudent.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <span>{initials}</span>
                  )
              }
            </div>
            {/* Camera badge */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3730a3,#4f46e5)',
              border: `2px solid ${t.hdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(67,56,202,.4)',
              cursor: 'pointer',
            }} onClick={() => fileInputRef.current?.click()}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {/* Change photo link */}
          <span
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: 11, color: t.pri, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
          >
            Change Photo
          </span>

          <p style={{ fontWeight: 800, fontSize: 18, color: t.txt, margin: 0, textAlign: 'center' }}>
            {displayStudent.name}
          </p>
          <p style={{ fontSize: 13, color: t.txtL, marginTop: 2 }}>{displayStudent.email}</p>

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

        {/* ══ TAB 1: Info ══ */}
        {activeTab === 'info' && (
          <>
            {/* Mini stats bar */}
            <div style={{
              background: 'linear-gradient(135deg,#1e1b4b,#3730a3 55%,#0d9488 100%)',
              borderRadius: 14, display: 'flex', overflow: 'hidden', marginBottom: 14,
            }}>
              {[
                { val: `${avgAttendance}%`, label: 'Attendance', rose: true  },
                { val: activity.length,     label: 'Sessions',   rose: false },
                { val: totalCourses,        label: 'Courses',    rose: false },
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
                          type="text"
                          style={inputStyle}
                          value={editForm[row.key] ?? currentStudent[row.key]}
                          onChange={(e) => handleFormChange(row.key, e.target.value)}
                        />
                      ) : (
                        <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>
                          {displayStudent[row.key]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
            {/* Change Password */}
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
                  <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>Last changed 30 days ago</p>
                </div>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: pwExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              {pwExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${t.bdr}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="password" placeholder="Current password" style={inputStyle} />
                  <input type="password" placeholder="New password" style={inputStyle} />
                  <input type="password" placeholder="Confirm new password" style={inputStyle} />
                  <ul style={{ fontSize: 12, color: t.txtL, paddingLeft: 18, margin: '4px 0', lineHeight: 1.8 }}>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One number or special character</li>
                  </ul>
                  <button type="button" style={{
                    background: t.priG, color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Update Password</button>
                </div>
              )}
            </div>

            {/* 2FA */}
            <p style={sectionLabel}>Authentication</p>
            <div style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.bdr}`, marginBottom: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>Two-Factor Auth</p>
                  <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>
                    {twoFAEnabled ? 'Enabled — account protected' : 'Not enabled'}
                  </p>
                </div>
                <ToggleSwitch on={twoFAEnabled} onToggle={() => setTwoFAEnabled((e) => !e)} ariaLabel="Toggle two-factor authentication" />
              </div>
              {twoFAEnabled && (
                <p style={{ fontSize: 12, color: t.txtL, background: t.bg, borderRadius: 8, padding: '10px 12px', marginTop: 12, lineHeight: 1.5 }}>
                  Two-factor authentication is enabled. You'll receive a code via email when signing in.
                </p>
              )}
            </div>

            {/* Face Recognition */}
            <p style={sectionLabel}>Biometrics</p>
            <div style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.bdr}`, marginBottom: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>Face Recognition</p>
                <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>Configured · Used for attendance</p>
              </div>
              <button type="button" onClick={() => navigate('/face-setup')} style={{
                background: t.priLL, border: `1px solid ${t.priL}`, borderRadius: 9,
                padding: '7px 13px', fontSize: 12, fontWeight: 700, color: t.pri,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Re-setup</button>
            </div>

            {/* Active Sessions */}
            <p style={sectionLabel}>Active Sessions</p>
            <div style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.bdr}`, overflow: 'hidden' }}>
              {SESSIONS.map((s, i) => (
                <div key={s.id} style={{ borderBottom: i < SESSIONS.length - 1 ? `1px solid ${t.bdr}` : 'none' }}>
                  <div style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>{s.device}</p>
                      <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>{s.location} · {s.time}</p>
                    </div>
                    {s.current ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: t.okL, color: t.ok }}>Current</span>
                    ) : (
                      <button type="button" style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                        background: t.accL, color: t.acc, border: 'none', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>Revoke</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ TAB 3: Alerts ══ */}
        {activeTab === 'alerts' && (
          <>
            {/* Notification toggles */}
            <p style={sectionLabel}>Notifications</p>
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.bdr}`, overflow: 'hidden', marginBottom: 14 }}>
              {ALERT_ROWS.map((item, i) => (
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
