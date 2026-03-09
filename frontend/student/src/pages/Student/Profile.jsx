import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockRecentActivity } from '../../data/mockData';
import './Profile.css';

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', icon: 'home'     },
  { label: 'Schedule', path: '/student/schedule',  icon: 'calendar' },
  { label: 'Stats',    path: '/student/stats',     icon: 'stats'    },
  { label: 'Profile',  path: '/student/profile',   icon: 'user'     },
];

const INFO_ROWS = [
  { label: 'Full Name',  key: 'name',       icon: 'user',     editable: true  },
  { label: 'Email',      key: 'email',      icon: 'mail',     editable: true  },
  { label: 'Student ID', key: 'studentId',  icon: 'id',       editable: false },
  { label: 'Department', key: 'department', icon: 'building', editable: true  },
  { label: 'Joined',     key: 'joined',     icon: 'calendar', editable: false },
];

const SESSIONS = [
  { id: 1, device: 'iPhone 15',        location: 'Almaty, KZ', time: 'Active now',  current: true  },
  { id: 2, device: 'MacBook Pro',      location: 'Almaty, KZ', time: '2 hours ago', current: false },
  { id: 3, device: 'Chrome · Windows', location: 'Almaty, KZ', time: '3 days ago',  current: false },
];

const ALERT_ROWS = [
  { key: 'email',         icon: 'mail',    bg: '#eff6ff', color: '#2563eb', title: 'Email Alerts',            desc: 'Receive attendance updates by email'    },
  { key: 'attendance',    icon: 'check',   bg: '#f0fdf4', color: '#16a34a', title: 'Attendance Confirmation', desc: 'Notify when attendance is recorded'     },
  { key: 'lowAttendance', icon: 'warning', bg: '#fef3c7', color: '#d97706', title: 'Low Attendance Warning',  desc: 'Alert when below 75% attendance'        },
  { key: 'reminders',     icon: 'bell',    bg: '#fdf4ff', color: '#9333ea', title: 'Session Reminders',       desc: '15-min reminder before each class'      },
];

const PREF_ROWS = [
  { icon: 'globe', bg: '#eff6ff', color: '#2563eb', label: 'Language',  value: 'English' },
  { icon: 'clock', bg: '#fef3c7', color: '#d97706', label: 'Time Zone', value: 'GMT+5'   },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  const [editMode,     setEditMode]     = useState(false);
  const [activeTab,    setActiveTab]    = useState('info');
  const [pwExpanded,   setPwExpanded]   = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [editForm,     setEditForm]     = useState({});
  const [notifications, setNotifications] = useState({
    email: true, attendance: true, lowAttendance: true, reminders: false,
  });

  useEffect(() => {
    if (!currentStudent) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const initials = currentStudent.name.split(' ').map((w) => w[0]).join('').toUpperCase();

  const activity       = mockRecentActivity[currentStudent.studentId] || [];
  const presentCount   = activity.filter((a) => a.status === 'Present').length;
  const avgAttendance  = activity.length > 0 ? Math.round((presentCount / activity.length) * 100) : 0;
  const totalCourses   = currentStudent.courses.length;

  function handleLogout() {
    localStorage.removeItem('currentStudent');
    navigate('/login');
  }

  function handleEditToggle() {
    if (!editMode) {
      setEditForm({
        name:       currentStudent.name,
        email:      currentStudent.email,
        department: currentStudent.department,
      });
    }
    setEditMode((e) => !e);
  }

  function handleFormChange(key, value) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  function toggleNotification(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }));
  }

  const displayStudent = editMode ? { ...currentStudent, ...editForm } : currentStudent;

  return (
    <div className="prof-root">

      {/* ── Header ── */}
      <header className="prof-header">
        <div className="prof-header-left">
          <div className="prof-logo-icon" aria-hidden="true">
            <GraduationCapIcon />
          </div>
          <span className="prof-logo-text">Attendify</span>
        </div>
        <button
          type="button"
          className={`prof-edit-toggle${editMode ? ' prof-edit-toggle-active' : ''}`}
          onClick={handleEditToggle}
        >
          {editMode ? <><CheckSmIcon /> Save</> : <><EditSmIcon /> Edit</>}
        </button>
      </header>

      <div className="prof-body">

        {/* ── Avatar section ── */}
        <div className="prof-avatar-section">
          <div className="prof-avatar-wrap">
            <div className="prof-avatar">
              {currentStudent.avatar
                ? <img src={currentStudent.avatar} alt={currentStudent.name} />
                : <span>{initials}</span>}
            </div>
            {editMode && (
              <div className="prof-camera-badge" aria-label="Change photo">
                <CameraSmIcon />
              </div>
            )}
          </div>
          <h1 className="prof-name">{displayStudent.name}</h1>
          <p className="prof-email">{displayStudent.email}</p>
          <div className="prof-badges">
            <span className="prof-badge-student">Student</span>
            <span className="prof-badge-active">● Active</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="prof-tabs">
          {['info', 'security', 'alerts'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`prof-tab-btn${activeTab === tab ? ' prof-tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ══ TAB 1: Info ══ */}
        {activeTab === 'info' && (
          <div className="prof-tab-content">

            {/* Stats bar */}
            <div className="prof-stats-card">
              <div className="prof-stats-col">
                <span className="prof-stats-value">{avgAttendance}%</span>
                <span className="prof-stats-label">Avg Attendance</span>
              </div>
              <div className="prof-stats-divider" />
              <div className="prof-stats-col">
                <span className="prof-stats-value">{activity.length}</span>
                <span className="prof-stats-label">Sessions</span>
              </div>
              <div className="prof-stats-divider" />
              <div className="prof-stats-col">
                <span className="prof-stats-value">{totalCourses}</span>
                <span className="prof-stats-label">Courses</span>
              </div>
            </div>

            {/* Student info list */}
            <p className="prof-section-label">Student Information</p>
            <div className="prof-info-card">
              {INFO_ROWS.map((row, i) => (
                <div key={row.key}>
                  <div className="prof-info-row">
                    <div className="prof-info-icon">
                      <RowIcon type={row.icon} />
                    </div>
                    <div className="prof-info-body">
                      <p className="prof-info-label">{row.label}</p>
                      {editMode && row.editable ? (
                        <input
                          type="text"
                          className="prof-info-input"
                          value={editForm[row.key] ?? currentStudent[row.key]}
                          onChange={(e) => handleFormChange(row.key, e.target.value)}
                        />
                      ) : (
                        <p className="prof-info-value">{displayStudent[row.key]}</p>
                      )}
                    </div>
                  </div>
                  {i < INFO_ROWS.length - 1 && <div className="prof-info-divider" />}
                </div>
              ))}
            </div>

            {/* Logout */}
            <button type="button" className="prof-logout-btn" onClick={handleLogout}>
              <LogOutIcon />
              Log Out
            </button>

          </div>
        )}

        {/* ══ TAB 2: Security ══ */}
        {activeTab === 'security' && (
          <div className="prof-tab-content">

            <p className="prof-section-label">Password</p>
            <div className="prof-pw-card">
              <div
                className="prof-pw-header"
                onClick={() => setPwExpanded((e) => !e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setPwExpanded((v) => !v)}
              >
                <div className="prof-pw-icon-box"><KeyIcon /></div>
                <div className="prof-pw-title-wrap">
                  <p className="prof-pw-title">Change Password</p>
                  <p className="prof-pw-sub">Last changed 30 days ago</p>
                </div>
                <span className={`prof-pw-chevron${pwExpanded ? ' prof-pw-chevron-open' : ''}`}>
                  <ChevronDownIcon />
                </span>
              </div>
              {pwExpanded && (
                <div className="prof-pw-body">
                  <input type="password" className="prof-pw-input" placeholder="Current password" />
                  <input type="password" className="prof-pw-input" placeholder="New password" />
                  <input type="password" className="prof-pw-input" placeholder="Confirm new password" />
                  <ul className="prof-pw-reqs">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One number or special character</li>
                  </ul>
                  <button type="button" className="prof-pw-update-btn">Update Password</button>
                </div>
              )}
            </div>

            <p className="prof-section-label">Authentication</p>
            <div className="prof-tfa-card">
              <div className="prof-tfa-row">
                <div className="prof-tfa-icon-box"><ShieldIcon /></div>
                <div className="prof-tfa-text">
                  <p className="prof-tfa-title">Two-Factor Auth</p>
                  <p className="prof-tfa-sub">Extra layer of account security</p>
                </div>
                <button
                  type="button"
                  className={`prof-toggle${twoFAEnabled ? ' prof-toggle-on' : ''}`}
                  onClick={() => setTwoFAEnabled((e) => !e)}
                  aria-label="Toggle two-factor authentication"
                />
              </div>
              {twoFAEnabled && (
                <p className="prof-tfa-info-box">
                  Two-factor authentication is enabled. You'll receive a code via email when signing in.
                </p>
              )}
            </div>

            <p className="prof-section-label">Biometrics</p>
            <div className="prof-face-card">
              <div className="prof-face-icon-box"><EyeIcon /></div>
              <div className="prof-face-text">
                <p className="prof-face-title">Face Recognition</p>
                <p className="prof-face-sub">Configured · Used for attendance</p>
              </div>
              <button
                type="button"
                className="prof-face-setup-btn"
                onClick={() => navigate('/face-setup')}
              >
                Re-setup
              </button>
            </div>

            <p className="prof-section-label">Active Sessions</p>
            <div className="prof-sessions-card">
              {SESSIONS.map((s, i) => (
                <div key={s.id}>
                  <div className="prof-session-row">
                    <div className="prof-session-icon"><DeviceIcon /></div>
                    <div className="prof-session-info">
                      <p className="prof-session-name">{s.device}</p>
                      <p className="prof-session-detail">{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <span className="prof-session-current">Current</span>
                      : <button type="button" className="prof-session-revoke">Revoke</button>
                    }
                  </div>
                  {i < SESSIONS.length - 1 && <div className="prof-session-divider" />}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ══ TAB 3: Alerts ══ */}
        {activeTab === 'alerts' && (
          <div className="prof-tab-content">

            <p className="prof-section-label">Notifications</p>
            <div className="prof-alert-card">
              {ALERT_ROWS.map((item, i) => (
                <div key={item.key}>
                  <div className="prof-alert-row">
                    <div className="prof-alert-icon" style={{ background: item.bg, color: item.color }}>
                      <AlertRowIcon type={item.icon} />
                    </div>
                    <div className="prof-alert-text">
                      <p className="prof-alert-title">{item.title}</p>
                      <p className="prof-alert-desc">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      className={`prof-toggle${notifications[item.key] ? ' prof-toggle-on' : ''}`}
                      onClick={() => toggleNotification(item.key)}
                      aria-label={`Toggle ${item.title}`}
                    />
                  </div>
                  {i < ALERT_ROWS.length - 1 && <div className="prof-alert-divider" />}
                </div>
              ))}
            </div>

            <p className="prof-section-label">Preferences</p>
            <div className="prof-pref-card">
              {PREF_ROWS.map((item, i) => (
                <div key={item.label}>
                  <div className="prof-pref-row">
                    <div className="prof-pref-icon" style={{ background: item.bg, color: item.color }}>
                      <PrefRowIcon type={item.icon} />
                    </div>
                    <div className="prof-pref-text">
                      <p className="prof-pref-label">{item.label}</p>
                      <p className="prof-pref-value">{item.value}</p>
                    </div>
                    <span className="prof-pref-arrow"><ChevronRightSmIcon /></span>
                  </div>
                  {i < PREF_ROWS.length - 1 && <div className="prof-pref-divider" />}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* ── Bottom navigation ── */}
      <nav className="prof-nav">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`prof-nav-item${active ? ' prof-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <NavIcon type={item.icon} />
              <span className="prof-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}

/* ── Icon switchers ──────────────────────────────────────────── */
function RowIcon({ type }) {
  if (type === 'user')     return <UserIcon />;
  if (type === 'mail')     return <MailIcon />;
  if (type === 'id')       return <IdIcon />;
  if (type === 'building') return <BuildingIcon />;
  if (type === 'calendar') return <CalendarIcon />;
  return null;
}

function NavIcon({ type }) {
  if (type === 'home')     return <HomeIcon />;
  if (type === 'calendar') return <CalendarNavIcon />;
  if (type === 'stats')    return <StatsIcon />;
  if (type === 'user')     return <UserNavIcon />;
  return null;
}

function AlertRowIcon({ type }) {
  if (type === 'mail')    return <MailIcon />;
  if (type === 'check')   return <CheckCircleIcon />;
  if (type === 'warning') return <WarningIcon />;
  if (type === 'bell')    return <BellIcon />;
  return null;
}

function PrefRowIcon({ type }) {
  if (type === 'globe') return <GlobeIcon />;
  if (type === 'clock') return <ClockIcon />;
  return null;
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function GraduationCapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function EditSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CameraSmIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4M14 12h4M14 15h2" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ChevronRightSmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ── Nav icons (20 px) ───────────────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}

function UserNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
