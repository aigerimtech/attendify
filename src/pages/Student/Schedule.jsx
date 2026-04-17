import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";
import { api } from '../../api/client';

const COURSE_COLORS = ['#2563eb','#7c3aed','#0891b2','#0d9488','#059669','#d97706','#dc2626'];
const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
// Backend returns day_of_week as lowercase string e.g. "monday"
const DAY_NAME_TO_IDX = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4 };

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

export default function Schedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: t, isDark } = useTheme();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));
  const todayIdx = getTodayIdx();
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStudent) { navigate('/login'); return; }
    api.get('/students/me/schedule')
      .then(setScheduleItems)
      .catch(() => setScheduleItems([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const weekDays = getWeekDays();
  const full_name = currentStudent.full_name ?? 'Student';
  const initials = full_name.split(' ').map((w) => w[0]).join('').toUpperCase();

  // Filter items for selected day using backend's day_of_week string
  const selectedDayName = DAY_NAMES[selectedIdx].toLowerCase();
  const dayClasses = scheduleItems
    .filter((item) => item.day_of_week === selectedDayName)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  function dayHasClasses(idx) {
    return scheduleItems.some((item) => item.day_of_week === DAY_NAMES[idx].toLowerCase());
  }

  const isToday = selectedIdx === todayIdx;
  const dayLabel = `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''} · ${DAY_NAMES[selectedIdx]}${isToday ? ' (Today)' : ''}`;

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: t.hdr, borderBottom: `1px solid ${t.bdr}`, flexShrink: 0 }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDark ? <LogoMarkDark size={34} /> : <LogoMark size={34} />}
            <span style={{ fontWeight: 800, fontSize: 18, color: t.txt, letterSpacing: -0.3 }}>Attendify</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button type="button" aria-label="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </button>
              <span aria-hidden="true" style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: t.acc, border: `2px solid ${t.hdr}` }} />
            </div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3730a3,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
              {initials}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 18px 14px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.txt, letterSpacing: -0.4, margin: '0 0 2px' }}>Schedule</h1>
          <p style={{ fontSize: 12, color: t.txtL, margin: '0 0 14px' }}>Spring Semester 2025</p>

          {/* Day strip */}
          <div style={{ display: 'flex', gap: 6 }} role="tablist" aria-label="Select day">
            {weekDays.map((date, idx) => {
              const isSelected = idx === selectedIdx;
              const isThisToday = idx === todayIdx;
              let bg = t.bg;
              let border = 'none';
              if (isSelected) { bg = t.pri; }
              else if (isThisToday) { bg = t.priLL; border = `1.5px solid ${t.priL}`; }
              return (
                <button key={idx} type="button" role="tab" aria-selected={isSelected} onClick={() => setSelectedIdx(idx)} style={{ flex: 1, textAlign: 'center', borderRadius: 13, padding: '9px 3px', cursor: 'pointer', transition: 'all .15s', background: bg, border, outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? 'rgba(255,255,255,.7)' : t.txtL }}>{DAY_ABBRS[idx]}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: isSelected ? '#fff' : t.txt }}>{date.getDate()}</span>
                  {dayHasClasses(idx) && <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,.65)' : isThisToday ? t.pri : t.acc, marginTop: 4, display: 'block' }} />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Class list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {loading && <p style={{ fontSize: 13, color: t.txtL, textAlign: 'center', paddingTop: 40 }}>Loading…</p>}

        {!loading && dayClasses.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: t.priLL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={t.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: t.txt, margin: '0 0 4px', textAlign: 'center' }}>No classes today</p>
            <p style={{ fontSize: 13, color: t.txtL, margin: 0, textAlign: 'center' }}>Enjoy your free day!</p>
          </div>
        )}

        {!loading && dayClasses.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.txtL, marginBottom: 12 }}>{dayLabel}</p>
            {dayClasses.map((course, idx) => {
              const color = COURSE_COLORS[idx % COURSE_COLORS.length];
              const sessionStatus = course.session_status; // 'active' | 'completed' | null/undefined

              let badgeBg, badgeColor, badgeBorder, badgeText;
              if (sessionStatus === 'completed') {
                badgeBg = t.priLL; badgeColor = t.pri; badgeBorder = 'none'; badgeText = 'Completed';
              } else if (sessionStatus === 'active') {
                badgeBg = t.accL; badgeColor = t.acc; badgeBorder = `1px solid ${t.accLL}`; badgeText = '● LIVE';
              } else {
                badgeBg = t.bg; badgeColor = t.txtL; badgeBorder = 'none'; badgeText = 'Upcoming';
              }

              return (
                <div key={`${course.course_id}-${course.day_of_week}-${course.start_time}`} style={{ background: t.card, borderRadius: 16, marginBottom: 12, border: `1px solid ${t.bdr}`, borderLeft: `4px solid ${color}`, boxShadow: t.sh, padding: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.6, display: 'block', marginBottom: 2 }}>{course.course_code}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.txt }}>{course.course_name}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, background: badgeBg, color: badgeColor, border: badgeBorder }}>{badgeText}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: t.txtL, marginBottom: (sessionStatus === 'active' || sessionStatus === 'completed') ? 12 : 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {course.start_time} – {course.end_time}
                    </span>
                    {course.room && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>{course.room}</span></>}
                    {course.instructor_name && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={t.txtL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>{course.instructor_name}</span></>}
                  </div>

                  {sessionStatus === 'active' && (
                    <button type="button" onClick={() => navigate('/student/scan')} style={{ background: 'linear-gradient(135deg,#047857,#059669)', borderRadius: 11, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#fff', border: 'none', display: 'flex', gap: 7, alignItems: 'center', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 18px rgba(5,150,105,.3)' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" /><path d="M14 14h3v3 M17 14v3h3 M17 20h3" /></svg>
                      Scan QR
                    </button>
                  )}

                  {sessionStatus === 'completed' && (
                    <div style={{ background: t.okL, borderRadius: 9, padding: '8px 13px', border: '1px solid rgba(5,150,105,.2)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.ok} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.ok }}>Attendance recorded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ background: t.nav, borderTop: `1px solid ${t.bdr}`, display: 'flex', padding: '8px 0 18px', flexShrink: 0 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} type="button" aria-label={item.label} onClick={() => navigate(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? t.pri : t.txtL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.iconPath} /></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? t.pri : t.txtL }}>{item.label}</span>
              {active && <div style={{ width: 18, height: 3, borderRadius: 999, background: t.pri }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
