import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCourses, mockRecentActivity } from '../../data/mockData';
import './Schedule.css';

const COURSE_COLORS = {
  CS101:   '#2563eb',
  CS202:   '#7c3aed',
  MATH201: '#0891b2',
  PHYS101: '#0d9488',
  IS101:   '#059669',
  SE301:   '#d97706',
};

// Which weekdays (0=Mon … 4=Fri) each course meets
const COURSE_DAYS = {
  CS101:   [0, 2, 4],
  CS202:   [1, 3],
  MATH201: [0, 2],
  PHYS101: [1, 3],
  IS101:   [1, 3],
  SE301:   [2, 4],
};

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', icon: 'home'     },
  { label: 'Schedule', path: '/student/schedule',  icon: 'calendar' },
  { label: 'Stats',    path: '/student/stats',     icon: 'stats'    },
  { label: 'Profile',  path: '/student/profile',   icon: 'user'     },
];

/** Returns an array of 5 Date objects for Mon–Fri of the current week */
function getWeekDays() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Today's Mon-Fri index (0-4); -1 on weekends */
function getTodayIdx() {
  const dow = new Date().getDay();
  return dow >= 1 && dow <= 5 ? dow - 1 : -1;
}

export default function Schedule() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  const todayIdx = getTodayIdx();
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);

  useEffect(() => {
    if (!currentStudent) navigate('/login');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const weekDays = getWeekDays();

  // Courses for the selected day, sorted by time
  const dayClasses = currentStudent.courses
    .filter((code) => (COURSE_DAYS[code] ?? []).includes(selectedIdx))
    .map((code) => mockCourses[code])
    .filter(Boolean)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Courses-per-day lookup for dot indicators
  function dayHasClasses(idx) {
    return currentStudent.courses.some((code) =>
      (COURSE_DAYS[code] ?? []).includes(idx)
    );
  }

  // Courses attended today (for status badge)
  const activity = mockRecentActivity[currentStudent.studentId] ?? [];
  const attendedToday = new Set(
    activity
      .filter((a) => a.date.includes('Today') && a.status === 'Present')
      .map((a) => a.code)
  );

  const isToday  = selectedIdx === todayIdx;
  const dayName  = DAY_NAMES[selectedIdx];
  const dayLabel = isToday
    ? `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${dayName} (Today)`
    : `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${dayName}`;

  return (
    <div className="sched-root">

      {/* ── Header ── */}
      <header className="sched-header">
        <div className="sched-header-top">
          <div className="sched-header-left">
            <div className="sched-logo-icon" aria-hidden="true">
              <GraduationCapIcon />
            </div>
            <span className="sched-logo-text">Attendify</span>
          </div>
          <div className="sched-bell-wrap">
            <button type="button" className="sched-icon-btn" aria-label="Notifications">
              <BellIcon />
            </button>
            <span className="sched-bell-dot" aria-hidden="true" />
          </div>
        </div>

        <div className="sched-header-titles">
          <h1 className="sched-page-title">Schedule</h1>
          <p className="sched-page-sub">Spring Semester 2025</p>
        </div>

        {/* Weekly strip */}
        <div className="sched-week-strip" role="tablist" aria-label="Select day">
          {weekDays.map((date, idx) => {
            const isSelectedToday = idx === todayIdx;
            const isSelected      = idx === selectedIdx;
            let cellClass = 'sched-day-cell';
            if (isSelectedToday)       cellClass += ' sched-day-cell-today';
            else if (isSelected)       cellClass += ' sched-day-cell-selected';

            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={cellClass}
                onClick={() => setSelectedIdx(idx)}
              >
                <span className="sched-day-abbr">{DAY_ABBRS[idx]}</span>
                <span className="sched-day-num">{date.getDate()}</span>
                {dayHasClasses(idx) && (
                  <span className="sched-day-dot" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Class list ── */}
      <div className="sched-body">
        <p className="sched-day-label">{dayLabel}</p>

        {dayClasses.length === 0 ? (
          <div className="sched-empty">
            <div className="sched-empty-icon"><CalendarOffIcon /></div>
            <p className="sched-empty-title">No classes</p>
            <p className="sched-empty-sub">Enjoy your free day!</p>
          </div>
        ) : (
          dayClasses.map((course) => {
            const color    = COURSE_COLORS[course.code] ?? '#2563eb';
            const attended = isToday && attendedToday.has(course.code);
            return (
              <div
                key={course.code}
                className="sched-card"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <span className="sched-card-code" style={{ color }}>
                  {course.code}
                </span>
                <p className="sched-card-name">{course.name}</p>

                <div className="sched-card-divider" />

                <div className="sched-card-meta">
                  <span className="sched-card-meta-item">
                    <ClockIcon />
                    {course.time}
                  </span>
                  <span className="sched-card-meta-dot">·</span>
                  <span className="sched-card-meta-item">
                    <PinIcon />
                    {course.room}
                  </span>
                </div>

                <div className="sched-card-instructor">
                  <UserSmIcon />
                  {course.instructor}
                </div>

                {isToday && (
                  <div className="sched-card-footer">
                    {attended ? (
                      <span className="sched-badge-present">Present</span>
                    ) : (
                      <button
                        type="button"
                        className="sched-scan-btn"
                        onClick={() => navigate('/student/scan')}
                      >
                        <QrSmIcon />
                        Scan QR
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <nav className="sched-nav">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`sched-nav-item${active ? ' sched-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <NavIcon type={item.icon} />
              <span className="sched-nav-label">{item.label}</span>
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

function CalendarOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="10" y1="14" x2="14" y2="18" />
      <line x1="14" y1="14" x2="10" y2="18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UserSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function QrSmIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="19" y1="14" x2="19" y2="17" />
      <line x1="17" y1="19" x2="21" y2="19" />
    </svg>
  );
}

/* ── Nav icons ───────────────────────────────────────────────── */
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
