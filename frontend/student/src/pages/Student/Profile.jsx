import { useNavigate, useLocation } from 'react-router-dom';
import { mockStudent } from '../../data/mockData';
import './Profile.css';

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', icon: 'home'     },
  { label: 'Schedule', path: '/student/schedule',  icon: 'calendar' },
  { label: 'Stats',    path: '/student/stats',     icon: 'stats'    },
  { label: 'Profile',  path: '/student/profile',   icon: 'user'     },
];

const INFO_ROWS = [
  { label: 'Full Name',   key: 'name',       icon: 'user'     },
  { label: 'Email',       key: 'email',      icon: 'mail'     },
  { label: 'Student ID',  key: 'studentId',  icon: 'id'       },
  { label: 'Department',  key: 'department', icon: 'building' },
  { label: 'Joined',      key: 'joined',     icon: 'calendar' },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const initials = mockStudent.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="prof-root">
      {/* ── Header ── */}
      <header className="prof-header">
        <button
          type="button"
          className="prof-back-btn"
          aria-label="Go back"
          onClick={() => navigate('/student/dashboard')}
        >
          <ArrowLeftIcon />
        </button>
        <span className="prof-header-title">Profile</span>
        <div className="prof-header-spacer" />
      </header>

      <div className="prof-body">
        {/* ── Avatar block ── */}
        <div className="prof-avatar-block">
          <div className="prof-avatar">
            {mockStudent.avatar
              ? <img src={mockStudent.avatar} alt={mockStudent.name} />
              : <span>{initials}</span>}
          </div>
          <h1 className="prof-name">{mockStudent.name}</h1>
          <p className="prof-email">{mockStudent.email}</p>
        </div>

        {/* ── Info card ── */}
        <div className="prof-card">
          <h2 className="prof-card-title">Student Information</h2>
          {INFO_ROWS.map((row) => (
            <div key={row.key} className="prof-row">
              <div className="prof-row-icon">
                <RowIcon type={row.icon} />
              </div>
              <div className="prof-row-body">
                <p className="prof-row-label">{row.label}</p>
                <p className="prof-row-value">{mockStudent[row.key]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Edit button ── */}
        <button type="button" className="prof-edit-btn">
          <EditIcon />
          Edit Profile
        </button>

        {/* ── Danger zone ── */}
        <div className="prof-danger-card">
          <h2 className="prof-danger-title">Account</h2>
          <button
            type="button"
            className="prof-logout-btn"
            onClick={() => navigate('/login')}
          >
            <LogOutIcon />
            Log Out
          </button>
        </div>
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

/* ── Inline SVG icons ────────────────────────────────────────── */

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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

function IdIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4M14 12h4M14 15h2" />
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

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ── Nav icons (20px) ────────────────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarNavIcon() {
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

function UserNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
