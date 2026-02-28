import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCourses, mockRecentActivity } from '../../data/mockData';
import './Dashboard.css';

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', icon: 'home'     },
  { label: 'Schedule', path: '/student/schedule',  icon: 'calendar' },
  { label: 'Stats',    path: '/student/stats',     icon: 'stats'    },
  { label: 'Profile',  path: '/student/profile',   icon: 'user'     },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const avatarRef = useRef(null);

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  // Auth guard — must be before any early return, after all hooks
  useEffect(() => {
    if (!currentStudent) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close popup when clicking outside
  useEffect(() => {
    if (!popupOpen) return;
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popupOpen]);

  if (!currentStudent) return null;

  const todaysClasses = currentStudent.courses.map((code) => mockCourses[code]).filter(Boolean);
  const recentActivity = mockRecentActivity[currentStudent.studentId] ?? [];
  const initials = currentStudent.name.split(' ').map((w) => w[0]).join('').toUpperCase();

  function handleLogout() {
    localStorage.removeItem('currentStudent');
    setPopupOpen(false);
    navigate('/login');
  }

  return (
    <div className="dash-root">
      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="dash-logo-icon">
            <GraduationCapIcon />
          </div>
          <span className="dash-logo-text">Attendify</span>
        </div>
        <div className="dash-header-right">
          <button type="button" className="dash-icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>
          <div className="dash-avatar-wrap" ref={avatarRef}>
            <button
              type="button"
              className="dash-avatar"
              aria-label="Open profile menu"
              aria-expanded={popupOpen}
              onClick={() => setPopupOpen((v) => !v)}
            >
              {currentStudent.avatar
                ? <img src={currentStudent.avatar} alt={currentStudent.name} />
                : <span>{initials}</span>}
            </button>

            {popupOpen && (
              <div className="dash-avatar-popup" role="menu">
                <div className="dash-popup-info">
                  <p className="dash-popup-name">{currentStudent.name}</p>
                  <p className="dash-popup-email">{currentStudent.email}</p>
                </div>
                <div className="dash-popup-divider" />
                <button
                  type="button"
                  className="dash-popup-item"
                  role="menuitem"
                  onClick={() => { setPopupOpen(false); navigate('/student/profile'); }}
                >
                  <UserCircleIcon />
                  View Profile
                </button>
                <button
                  type="button"
                  className="dash-popup-item dash-popup-item-logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOutIcon />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-body">
        {/* ── Subtitle ── */}
        <p className="dash-subtitle">
          You have {todaysClasses.length} classes scheduled for today.
        </p>

        {/* ── Success banner ── */}
        {bannerVisible && (
          <div className="dash-banner" role="alert">
            <div className="dash-banner-icon">
              <CheckCircleIcon />
            </div>
            <div className="dash-banner-text">
              <p className="dash-banner-title">Attendance Recorded</p>
              <p className="dash-banner-sub">
                Successfully checked in for Physics 101 at 09:05 AM.
              </p>
            </div>
            <button
              type="button"
              className="dash-banner-close"
              onClick={() => setBannerVisible(false)}
              aria-label="Dismiss"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* ── Next class card ── */}
        <div className="dash-next-card">
          <div className="dash-next-overlay">
            <span className="dash-next-label">
              Next Class: {todaysClasses[0]?.name ?? 'No classes today'}
            </span>
          </div>
        </div>

        {/* ── Mark attendance card ── */}
        <div className="dash-attend-card">
          <h2 className="dash-attend-title">Mark Attendance</h2>
          <p className="dash-attend-sub">
            Scan the QR code displayed on the projector screen.
          </p>
          <button
            type="button"
            className="dash-attend-btn"
            onClick={() => navigate('/student/scan')}
          >
            <QrIcon />
            Scan QR Code
          </button>
        </div>

        {/* ── Recent activity ── */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Recent Activity</h2>
            <button type="button" className="dash-view-all">View All</button>
          </div>

          <div className="dash-activity-list">
            {recentActivity.map((item) => (
              <div key={item.code} className="dash-activity-card">
                <div className="dash-activity-icon">
                  <BookIcon />
                </div>
                <div className="dash-activity-info">
                  <p className="dash-activity-name">{item.name}</p>
                  <p className="dash-activity-date">{item.date}</p>
                </div>
                <span className={`dash-badge${item.status === 'Present' ? ' dash-badge-present' : ' dash-badge-absent'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <nav className="dash-nav">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`dash-nav-item${active ? ' dash-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <NavIcon type={item.icon} />
              <span className="dash-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── Nav icon switcher ───────────────────────────────────────── */
function NavIcon({ type }) {
  if (type === 'home')     return <HomeIcon />;
  if (type === 'calendar') return <CalendarIcon />;
  if (type === 'stats')    return <StatsIcon />;
  if (type === 'user')     return <UserIcon />;
  return null;
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="19" y1="14" x2="19" y2="17" />
      <line x1="17" y1="19" x2="21" y2="19" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
