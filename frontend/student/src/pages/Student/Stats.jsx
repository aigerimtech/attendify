import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCourses, mockCourseAttendance } from '../../data/mockData';
import './Stats.css';

const COURSE_COLORS = {
  CS101:   '#2563eb',
  CS202:   '#7c3aed',
  MATH201: '#0891b2',
  PHYS101: '#0d9488',
  IS101:   '#059669',
  SE301:   '#d97706',
};

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', icon: 'home'     },
  { label: 'Schedule', path: '/student/schedule',  icon: 'calendar' },
  { label: 'Stats',    path: '/student/stats',     icon: 'stats'    },
  { label: 'Profile',  path: '/student/profile',   icon: 'user'     },
];

/** Returns 'ok' | 'atrisk' | 'critical' */
function getStatus(pct) {
  if (pct >= 80) return 'ok';
  if (pct >= 65) return 'atrisk';
  return 'critical';
}

/** First 2 alpha chars of a course code, e.g. "CS101" → "CS" */
function codeAbbr(code) {
  return code.replace(/\d/g, '').slice(0, 2);
}

export default function Stats() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  useEffect(() => {
    if (!currentStudent) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const attendanceMap = mockCourseAttendance[currentStudent.studentId] ?? {};

  // Build per-course stat objects
  const courseStats = currentStudent.courses
    .map((code) => {
      const course = mockCourses[code];
      const stats  = attendanceMap[code] ?? { present: 0, absent: 0, total: 0 };
      const pct    = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      return { code, course, ...stats, pct, status: getStatus(pct) };
    })
    .filter((s) => s.course);

  // Overall totals
  const totalPresent = courseStats.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent  = courseStats.reduce((sum, s) => sum + s.absent,  0);
  const totalSessions = courseStats.reduce((sum, s) => sum + s.total,  0);
  const overallPct   = totalSessions > 0
    ? Math.round((totalPresent / totalSessions) * 100)
    : 0;

  // At-risk courses (< 80%)
  const atRiskCourses = courseStats.filter((s) => s.pct < 80);

  return (
    <div className="stats-root">

      {/* ── Header ── */}
      <header className="stats-header">
        <div className="stats-header-top">
          <div className="stats-header-left">
            <div className="stats-logo-icon" aria-hidden="true">
              <GraduationCapIcon />
            </div>
            <span className="stats-logo-text">Attendify</span>
          </div>
          <div className="stats-bell-wrap">
            <button type="button" className="stats-icon-btn" aria-label="Notifications">
              <BellIcon />
            </button>
            <span className="stats-bell-dot" aria-hidden="true" />
          </div>
        </div>
        <h1 className="stats-page-title">Attendance Stats</h1>
        <p className="stats-page-sub">Spring Semester 2025</p>
      </header>

      {/* ── Scrollable body ── */}
      <div className="stats-body">

        {/* 1. Overall summary card */}
        <div className="stats-summary-card">
          <div>
            <p className="stats-summary-label">Overall Attendance</p>
            <p className="stats-summary-pct">{overallPct}%</p>
          </div>
          <div className="stats-summary-row">
            <div className="stats-summary-stat">
              <span className="stats-summary-stat-value">{totalPresent}</span>
              <span className="stats-summary-stat-label">Present</span>
            </div>
            <div className="stats-summary-divider" />
            <div className="stats-summary-stat">
              <span className="stats-summary-stat-value">{totalAbsent}</span>
              <span className="stats-summary-stat-label">Absent</span>
            </div>
            <div className="stats-summary-divider" />
            <div className="stats-summary-stat">
              <span className="stats-summary-stat-value">{totalSessions}</span>
              <span className="stats-summary-stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* 2. At-risk warning banner */}
        {atRiskCourses.length > 0 && (
          <div className="stats-atrisk-banner" role="alert">
            <span className="stats-atrisk-icon"><WarningTriangleIcon /></span>
            <div>
              <p className="stats-atrisk-title">At-Risk Warning</p>
              <p className="stats-atrisk-body">
                {atRiskCourses.map((s) => s.course.name).join(', ')}{' '}
                {atRiskCourses.length === 1 ? 'is' : 'are'} below the 80% attendance
                threshold required to sit the final exam.
              </p>
            </div>
          </div>
        )}

        {/* 3. By-course section */}
        <p className="stats-section-label">By Course</p>

        {courseStats.map((s) => {
          const color    = COURSE_COLORS[s.code] ?? '#2563eb';
          const cardClass =
            s.status === 'critical' ? ' stats-course-card-critical' :
            s.status === 'atrisk'   ? ' stats-course-card-atrisk'   : '';
          const pctClass  =
            s.status === 'ok'       ? 'stats-pct-ok'       :
            s.status === 'atrisk'   ? 'stats-pct-atrisk'   : 'stats-pct-critical';
          const fillClass =
            s.status === 'ok'       ? 'stats-fill-ok'       :
            s.status === 'atrisk'   ? 'stats-fill-atrisk'   : 'stats-fill-critical';

          return (
            <div key={s.code} className={`stats-course-card${cardClass}`}>

              {/* Top row */}
              <div className="stats-course-top">
                <div
                  className="stats-course-icon"
                  style={{ background: color + '33', color }}
                >
                  {codeAbbr(s.code)}
                </div>
                <div className="stats-course-info">
                  <p className="stats-course-code" style={{ color }}>{s.code}</p>
                  <p className="stats-course-name">{s.course.name}</p>
                </div>
                <div className="stats-course-pct-wrap">
                  <span className={`stats-course-pct ${pctClass}`}>{s.pct}%</span>
                  {s.status === 'atrisk' && (
                    <span className="stats-status-tag stats-status-tag-atrisk">● AT RISK</span>
                  )}
                  {s.status === 'critical' && (
                    <span className="stats-status-tag stats-status-tag-critical">● CRITICAL</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="stats-progress-track">
                <div
                  className={`stats-progress-fill ${fillClass}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>

              {/* Footer */}
              <div className="stats-course-footer">
                <span className="stats-footer-present">✓ {s.present} present</span>
                <span className="stats-footer-absent">✗ {s.absent} absent</span>
                <span className="stats-footer-total">{s.total} total</span>
              </div>

            </div>
          );
        })}

      </div>

      {/* ── Bottom navigation ── */}
      <nav className="stats-nav">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`stats-nav-item${active ? ' stats-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <NavIcon type={item.icon} />
              <span className="stats-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}

/* ── Icon switcher ───────────────────────────────────────────── */
function NavIcon({ type }) {
  if (type === 'home')     return <HomeIcon />;
  if (type === 'calendar') return <CalendarIcon />;
  if (type === 'stats')    return <StatsIcon />;
  if (type === 'user')     return <UserIcon />;
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

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function WarningTriangleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon() {
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

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
