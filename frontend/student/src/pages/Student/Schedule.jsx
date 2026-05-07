import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark } from "../../components/LogoMark";

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#0d9488', '#059669', '#d97706'];
const colorFor = (i) => COLORS[i % COLORS.length];

const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
];

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getTodayIdx() {
  const dow = new Date().getDay();
  return dow >= 1 && dow <= 5 ? dow - 1 : -1;
}

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5); // "09:00:00" → "09:00"
}

export default function Schedule() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme: t, isDark } = useTheme();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent') || 'null');

  const todayIdx = getTodayIdx();
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [schedule,    setSchedule]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!currentStudent) { navigate('/login'); return; }
    api.get('/students/me/schedule')
      .then((data) => setSchedule(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load schedule.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t.bg, gap: 14 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${t.priL}`, borderTopColor: t.pri,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: t.txtL, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Loading schedule…</p>
    </div>
  );

  const weekDays = getWeekDays();

  // Assign a stable color per unique course_id by order of first appearance
  const uniqueIds = [...new Set(schedule.map((s) => s.course_id))];
  const colorMap  = Object.fromEntries(uniqueIds.map((id, i) => [id, colorFor(i)]));

  const selectedDayName = DAY_NAMES[selectedIdx];
  const dayClasses = schedule
    .filter((s) => s.day_of_week === selectedDayName)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  function dayHasClasses(idx) {
    return schedule.some((s) => s.day_of_week === DAY_NAMES[idx]);
  }

  const isToday  = selectedIdx === todayIdx;
  const dayLabel = isToday
    ? `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${selectedDayName} (Today)`
    : `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${selectedDayName}`;

  const displayName = currentStudent?.full_name ?? currentStudent?.name ?? '';
  const initials    = displayName.split(' ').map((w) => w[0]).join('').toUpperCase();

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{ background: t.hdr, borderBottom: `1px solid ${t.bdr}`, flexShrink: 0 }}>

        {/* Top bar */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={38} bgColor={t.hdr} />
            <span style={{ fontWeight: 800, fontSize: 18, color: t.txt, letterSpacing: -0.3 }}>Attendify</span>
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
              const isSelected  = idx === selectedIdx;
              const isThisToday = idx === todayIdx;

              let bg = t.bg;
              let border = 'none';
              if (isSelected)       { bg = t.pri;   border = 'none'; }
              else if (isThisToday) { bg = t.priLL; border = `1.5px solid ${t.priL}`; }

              const dayLabelColor = isSelected ? 'rgba(255,255,255,.7)' : t.txtL;
              const dayNumColor   = isSelected ? '#fff' : t.txt;
              const dotColor      = isSelected ? 'rgba(255,255,255,.65)' : isThisToday ? t.pri : t.acc;

              return (
                <button key={idx} type="button" role="tab" aria-selected={isSelected}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    flex: 1, textAlign: 'center', borderRadius: 13, padding: '9px 3px',
                    cursor: 'pointer', transition: 'all .15s', background: bg, border, outline: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: dayLabelColor }}>{DAY_ABBRS[idx]}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: dayNumColor }}>{date.getDate()}</span>
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

        {error ? (
          <p style={{ fontSize: 13, color: t.acc, textAlign: 'center', marginTop: 32 }}>{error}</p>
        ) : schedule.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, padding: '40px 12px 0' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: t.priLL,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: t.txt, margin: '0 0 6px', textAlign: 'center' }}>
              No classes scheduled yet
            </p>
            <p style={{ fontSize: 13, color: t.txtL, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              Your schedule will appear once your instructor sets up courses.
            </p>
          </div>
        ) : dayClasses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: t.priLL,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: t.txt, margin: '0 0 4px', textAlign: 'center' }}>
              No classes today
            </p>
            <p style={{ fontSize: 13, color: t.txtL, margin: 0, textAlign: 'center' }}>Enjoy your free day!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.txtL, marginBottom: 12 }}>{dayLabel}</p>

            {dayClasses.map((course, idx) => {
              const color     = colorMap[course.course_id] ?? colorFor(0);
              const timeLabel = course.start_time
                ? `${formatTime(course.start_time)} – ${formatTime(course.end_time)}`
                : '—';

              const showScan = isToday && todayIdx >= 0;

              return (
                <div key={idx} style={{
                  background: t.card, borderRadius: 16, marginBottom: 12,
                  border: `1px solid ${t.bdr}`, borderLeft: `4px solid ${color}`,
                  boxShadow: t.sh, padding: 15,
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.6, display: 'block', marginBottom: 2 }}>
                        {course.course_code}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.txt }}>
                        {course.course_name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      whiteSpace: 'nowrap', flexShrink: 0,
                      background: isToday ? t.accL : t.bg,
                      color: isToday ? t.acc : t.txtL,
                      border: isToday ? `1px solid ${t.accLL}` : 'none',
                    }}>
                      {isToday ? '● Today' : 'Upcoming'}
                    </span>
                  </div>

                  {/* Info row */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 10,
                    fontSize: 11, color: t.txtL,
                    marginBottom: showScan ? 12 : 0,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {timeLabel}
                    </span>
                    {course.room && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                            stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {course.room}
                        </span>
                      </>
                    )}
                    {course.instructor_name && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                            stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {course.instructor_name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Scan QR button — today's classes */}
                  {showScan && (
                    <button type="button" onClick={() => navigate('/student/scan')}
                      style={{
                        background: 'linear-gradient(135deg,#047857,#059669)',
                        borderRadius: 11, padding: '10px 16px', fontSize: 13, fontWeight: 700,
                        color: '#fff', border: 'none', display: 'flex', gap: 7, alignItems: 'center',
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
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
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{ background: t.nav, borderTop: `1px solid ${t.bdr}`, display: 'flex', padding: '8px 0 18px', flexShrink: 0 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} type="button" aria-label={item.label}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 0', border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
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
