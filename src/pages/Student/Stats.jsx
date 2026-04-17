import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark, LogoMarkDark } from "../../components/LogoMark";
import { api } from '../../api/client';

const COURSE_COLORS = ['#2563eb','#7c3aed','#0891b2','#0d9488','#059669','#d97706','#dc2626'];

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
];

function getStatus(pct) {
  if (pct >= 80) return 'ok';
  if (pct >= 65) return 'atrisk';
  return 'critical';
}

function codeAbbr(code) {
  return (code ?? '').replace(/\d/g, '').slice(0, 2);
}

export default function Stats() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: t, isDark } = useTheme();

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent'));

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStudent) { navigate('/login'); return; }
    api.get('/attendance/my/summary')
      .then(setSummaries)
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStudent) return null;

  const full_name = currentStudent.full_name ?? 'Student';
  const initials = full_name.split(' ').map((w) => w[0]).join('').toUpperCase();

  // Map backend fields: attended → present, total_sessions - attended → absent
  const courseStats = summaries.map((s, idx) => {
    const present = s.attended ?? 0;
    const total   = s.total_sessions ?? 0;
    const absent  = total - present;
    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      ...s,
      present, absent, total, pct,
      status: getStatus(pct),
      color: COURSE_COLORS[idx % COURSE_COLORS.length],
    };
  });

  const totalPresent  = courseStats.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent   = courseStats.reduce((sum, s) => sum + s.absent,  0);
  const totalSessions = courseStats.reduce((sum, s) => sum + s.total,   0);
  const overallPct    = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
  const atRiskCourses = courseStats.filter((s) => s.pct < 80);

  function statusColor(status) {
    if (status === 'ok')     return t.ok;
    if (status === 'atrisk') return t.warn;
    return t.acc;
  }

  function statusBorder(status) {
    if (status === 'ok')     return `1px solid ${t.bdr}`;
    if (status === 'atrisk') return '1px solid rgba(245,158,11,.2)';
    return `1px solid ${t.accLL}`;
  }

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: t.hdr, padding: '14px 18px', borderBottom: `1px solid ${t.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3730a3,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{initials}</div>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.txt, letterSpacing: -0.4, margin: 0 }}>Attendance Stats</h1>
          <p style={{ fontSize: 12, color: t.txtL, marginTop: 2, marginBottom: 0 }}>Spring Semester 2025</p>
        </div>

        {/* Overall summary card */}
        <div style={{ background: 'linear-gradient(140deg,#1e1b4b 0%,#3730a3 55%,#4338ca 100%)', borderRadius: 22, padding: '20px 22px', boxShadow: '0 10px 28px rgba(55,48,163,.38)', position: 'relative', overflow: 'hidden', color: '#fff' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(244,63,94,.12)' }} />
          <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, letterSpacing: 0.8, margin: '0 0 6px' }}>OVERALL ATTENDANCE</p>
          <p style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: t.accMid, margin: '0 0 18px' }}>
            {loading ? '…' : `${overallPct}%`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[
              { val: totalPresent, label: 'Present', rose: false },
              { val: totalAbsent,  label: 'Absent',  rose: true  },
              { val: totalSessions,label: 'Total',   rose: false },
            ].map((col, i) => (
              <div key={col.label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,.14)', margin: '0 18px' }} />}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: col.rose ? t.accMid : 'rgba(255,255,255,.85)' }}>{loading ? '—' : col.val}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase' }}>{col.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-risk banner */}
        {!loading && atRiskCourses.length > 0 && (
          <div role="alert" style={{ background: t.accL, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.accLL}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.acc, margin: '0 0 4px' }}>At-Risk Warning</p>
              <p style={{ fontSize: 12, color: t.txtL, lineHeight: 1.5, margin: 0 }}>
                {atRiskCourses.map((s) => s.course_name).join(', ')} {atRiskCourses.length === 1 ? 'is' : 'are'} below the 80% attendance threshold required to sit the final exam.
              </p>
            </div>
          </div>
        )}

        {loading && <p style={{ fontSize: 13, color: t.txtL, textAlign: 'center', padding: '20px 0' }}>Loading…</p>}

        {!loading && courseStats.length > 0 && <p style={{ fontSize: 15, fontWeight: 800, color: t.txt, margin: 0 }}>By Course</p>}

        {/* Per-course cards */}
        {courseStats.map((s) => {
          const pctCol = statusColor(s.status);
          return (
            <div key={s.course_id} style={{ background: t.card, borderRadius: 16, padding: 16, boxShadow: t.sh, border: statusBorder(s.status) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: s.color, flexShrink: 0 }}>{codeAbbr(s.course_code)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: s.color, margin: '0 0 2px' }}>{s.course_code}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.course_name}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 23, fontWeight: 800, color: pctCol, margin: 0, lineHeight: 1 }}>{s.pct}%</p>
                  {s.status !== 'ok' && <p style={{ fontSize: 9, fontWeight: 700, color: pctCol, margin: '3px 0 0' }}>{s.status === 'atrisk' ? '● AT RISK' : '● CRITICAL'}</p>}
                </div>
              </div>
              <div style={{ background: t.bdr, height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: pctCol, borderRadius: 999, transition: 'width .4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: t.ok,  fontWeight: 600 }}>✓ {s.present} present</span>
                <span style={{ color: t.acc, fontWeight: 600 }}>✗ {s.absent} absent</span>
                <span style={{ color: t.txtL }}>{s.total} total</span>
              </div>
            </div>
          );
        })}

        {!loading && courseStats.length === 0 && (
          <p style={{ fontSize: 13, color: t.txtL, textAlign: 'center', padding: '20px 0' }}>No attendance data yet.</p>
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
