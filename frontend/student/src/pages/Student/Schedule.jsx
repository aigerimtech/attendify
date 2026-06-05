import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockCourses, mockRecentActivity } from '../../data/mockData';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";

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
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
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
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: t, isDark } = useTheme();

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

  const isToday = selectedIdx === todayIdx;
  const dayName = DAY_NAMES[selectedIdx];
  const dayLabel = isToday
    ? `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${dayName} (Today)`
    : `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${dayName}`;

  const initials = currentStudent.name.split(' ').map((w) => w[0]).join('').toUpperCase();

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: t.hdr,
        borderBottom: `1px solid ${t.bdr}`,
        flexShrink: 0,
      }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDark ? <LogoMarkDark size={34} /> : <LogoMark size={34} />}
            <span style={{ fontWeight: 800, fontSize: 18, color: t.txt, letterSpacing: -0.3 }}>
              Attendify
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button type="button" aria-label="Notifications"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <svg width={21} height={21} viewBox="0 0 24 24" fill="none"
                  stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <span aria-hidden="true" style={{
                position: 'absolute', top: -2, right: -2,
                width: 8, height: 8, borderRadius: '50%',
                background: t.acc, border: `2px solid ${t.hdr}`,
              }} />
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3730a3,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Title + subtitle */}
        <div style={{ padding: '0 18px 14px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.txt, letterSpacing: -0.4, margin: '0 0 2px' }}>
            Schedule
          </h1>
          <p style={{ fontSize: 12, color: t.txtL, margin: '0 0 14px' }}>Spring Semester 2025</p>

          {/* Weekly day strip */}
          <div style={{ display: 'flex', gap: 6 }} role="tablist" aria-label="Select day">
            {weekDays.map((date, idx) => {
              const isSelected = idx === selectedIdx;
              const isThisToday = idx === todayIdx;

              let bg = t.bg;
              let border = 'none';
              if (isSelected) { bg = t.pri; border = 'none'; }
              else if (isThisToday) { bg = t.priLL; border = `1.5px solid ${t.priL}`; }

              const dayLabelColor = isSelected ? 'rgba(255,255,255,.7)' : t.txtL;
              const dayNumColor   = isSelected ? '#fff' : t.txt;
              const dotColor      = isSelected ? 'rgba(255,255,255,.65)' : isThisToday ? t.pri : t.acc;

              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    borderRadius: 13,
                    padding: '9px 3px',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    background: bg,
                    border,
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: dayLabelColor }}>
                    {DAY_ABBRS[idx]}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: dayNumColor }}>
                    {date.getDate()}
                  </span>
                  {dayHasClasses(idx) && (
                    <span aria-hidden="true" style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: dotColor, marginTop: 4, display: 'block',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Class list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>

        {dayClasses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: t.priLL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: t.txt, margin: '0 0 4px', textAlign: 'center' }}>
              No classes today
            </p>
            <p style={{ fontSize: 13, color: t.txtL, margin: 0, textAlign: 'center' }}>
              Enjoy your free day!
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.txtL, marginBottom: 12 }}>
              {dayLabel}
            </p>

            {dayClasses.map((course) => {
              const color   = COURSE_COLORS[course.code] ?? '#2563eb';
              const attended = isToday && attendedToday.has(course.code);
              const live     = isToday && !attended;

              // Determine badge
              let badgeBg, badgeColor, badgeBorder, badgeText;
              if (attended) {
                badgeBg = t.priLL; badgeColor = t.pri; badgeBorder = 'none'; badgeText = 'Completed';
              } else if (live) {
                badgeBg = t.accL; badgeColor = t.acc; badgeBorder = `1px solid ${t.accLL}`; badgeText = '● LIVE';
              } else {
                badgeBg = t.bg; badgeColor = t.txtL; badgeBorder = 'none'; badgeText = 'Upcoming';
              }

              return (
                <div
                  key={course.code}
                  style={{
                    background: t.card,
                    borderRadius: 16,
                    marginBottom: 12,
                    border: `1px solid ${t.bdr}`,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: t.sh,
                    padding: 15,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.6, display: 'block', marginBottom: 2 }}>
                        {course.code}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.txt }}>
                        {course.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 20,
                      whiteSpace: 'nowrap', flexShrink: 0,
                      background: badgeBg, color: badgeColor, border: badgeBorder,
                    }}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Info row */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 10,
                    fontSize: 11, color: t.txtL,
                    marginBottom: (live || attended) ? 12 : 0,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {course.time}
                    </span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {course.room}
                    </span>
                    {course.instructor && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                            stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {course.instructor}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Active session → green scan button */}
                  {live && (
                    <button
                      type="button"
                      onClick={() => navigate('/student/scan')}
                      style={{
                        background: 'linear-gradient(135deg,#047857,#059669)',
                        borderRadius: 11,
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        gap: 7,
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: '0 6px 18px rgba(5,150,105,.3)',
                      }}
                    >
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" />
                        <path d="M14 14h3v3 M17 14v3h3 M17 20h3" />
                      </svg>
                      Scan QR
                    </button>
                  )}

                  {/* Completed session → green strip */}
                  {attended && (
                    <div style={{
                      background: t.okL,
                      borderRadius: 9,
                      padding: '8px 13px',
                      border: '1px solid rgba(5,150,105,.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke={t.ok} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.ok }}>
                        Attendance recorded
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{
        background: t.nav,
        borderTop: `1px solid ${t.bdr}`,
        display: 'flex',
        padding: '8px 0 18px',
        flexShrink: 0,
      }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              aria-label={item.label}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke={active ? t.pri : t.txtL} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d={item.iconPath} />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? t.pri : t.txtL }}>
                {item.label}
              </span>
              {active && (
                <div style={{ width: 18, height: 3, borderRadius: 999, background: t.pri }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
