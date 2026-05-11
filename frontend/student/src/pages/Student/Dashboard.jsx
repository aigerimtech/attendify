import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";
import { LogoMark } from "../../components/LogoMark";

const COURSE_COLORS = {
  CS101:   '#2563eb',
  CS202:   '#7c3aed',
  MATH201: '#0891b2',
  PHYS101: '#0d9488',
  IS101:   '#059669',
  SE301:   '#d97706',
};

const NAV_ITEMS = [
  { label: 'Home',     path: '/student/dashboard', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { label: 'Schedule', path: '/student/schedule',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Stats',    path: '/student/stats',     iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Profile',  path: '/student/profile',   iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: t, isDark } = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const avatarRef = useRef(null);

  const currentStudent = JSON.parse(localStorage.getItem('currentStudent') || 'null');

  useEffect(() => {
    if (!currentStudent) { navigate('/login'); return; }
    api.get('/students/me/dashboard')
      .then(data => setDashboard(data))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
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
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t.bg }}>
      <p style={{ fontSize: 14, color: t.txtL, fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
    </div>
  );

  const todaysClasses = dashboard?.enrolled_courses ?? [];
  const recentActivity = dashboard?.recent_activity ?? [];
  const displayName = currentStudent.full_name ?? currentStudent.name ?? '';
  const initials = (displayName).split(' ').map((w) => w[0]).join('').toUpperCase();

  function handleLogout() {
    localStorage.removeItem('currentStudent');
    setPopupOpen(false);
    navigate('/login');
  }

  const nextClass = todaysClasses[0];

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: t.hdr,
        padding: '14px 18px',
        borderBottom: `1px solid ${t.bdr}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={38} bgColor={t.hdr} />
          <span style={{ fontWeight: 800, fontSize: 18, color: t.txt, letterSpacing: -0.3 }}>
            Attendify
          </span>
        </div>

        {/* Right: bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Bell */}
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

          {/* Avatar with popup */}
          <div style={{ position: 'relative' }} ref={avatarRef}>
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={popupOpen}
              onClick={() => setPopupOpen((v) => !v)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#3730a3,#4f46e5)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
              }}
            >
              {currentStudent.avatar
                ? <img src={currentStudent.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span>{initials}</span>}
            </button>

            {popupOpen && (
              <div role="menu" style={{
                position: 'absolute', top: 42, right: 0, zIndex: 100,
                background: t.card, border: `1px solid ${t.bdr}`,
                borderRadius: 16, boxShadow: t.shMd,
                minWidth: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.bdr}` }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: t.txt, margin: 0 }}>{displayName}</p>
                  <p style={{ fontSize: 12, color: t.txtL, margin: '2px 0 0' }}>{currentStudent.email}</p>
                </div>
                <button type="button" role="menuitem"
                  onClick={() => { setPopupOpen(false); navigate('/student/profile'); }}
                  style={{
                    width: '100%', padding: '12px 16px', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: t.txt, fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                  View Profile
                </button>
                <button type="button" role="menuitem" onClick={handleLogout}
                  style={{
                    width: '100%', padding: '12px 16px', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: t.acc, fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke={t.acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* Greeting */}
        <div>
          <p style={{ fontSize: 13, color: t.txtL, margin: 0 }}>Good morning</p>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: t.txt, letterSpacing: -0.5, margin: '2px 0' }}>
            {displayName}
          </h2>
          <p style={{ fontSize: 13, color: t.txtL, margin: 0 }}>
            You have{' '}
            <span style={{ color: t.pri, fontWeight: 700 }}>{dashboard?.today_class_count ?? 0}</span>{' '}
            classes scheduled for today.
          </p>
        </div>

        {/* Attendance recorded banner */}
        {bannerVisible && (
          <div role="alert" style={{
            background: t.accL,
            borderRadius: 14,
            padding: '13px 16px',
            border: `1px solid ${t.accLL}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: t.acc,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.acc, margin: 0 }}>Attendance Recorded</p>
                <p style={{ fontSize: 12, color: t.txtL, margin: '2px 0 0' }}>
                  Successfully checked in for Physics 101 at 09:05 AM.
                </p>
              </div>
            </div>
            <button type="button" aria-label="Dismiss"
              onClick={() => setBannerVisible(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: t.txtL, padding: 0, flexShrink: 0 }}>
              ×
            </button>
          </div>
        )}

        {/* Next class hero card */}
        <div style={{
          height: 155,
          borderRadius: 22,
          overflow: 'hidden',
          background: 'linear-gradient(140deg,#1e1b4b 0%,#3730a3 50%,#0d9488 100%)',
          boxShadow: '0 10px 30px rgba(55,48,163,.4)',
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div aria-hidden="true" style={{
            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,.04)', top: -40, right: -30,
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,.06)', top: 50, right: 44,
          }} />
          {/* Rose right edge strip */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 4, height: '100%',
            background: 'linear-gradient(180deg,#f43f5e60,#f43f5e20)',
          }} />

          {/* NEXT CLASS pill */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(244,63,94,.18)',
            borderRadius: 999, padding: '3px 10px',
            border: '1px solid rgba(244,63,94,.25)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb7185' }} />
            <span style={{ fontSize: 9, color: '#fb7185', fontWeight: 700, letterSpacing: 1.5 }}>
              NEXT CLASS
            </span>
          </div>

          {/* Course info */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.3, marginBottom: 6, margin: '0 0 6px' }}>
              {nextClass?.name ?? 'No classes today'}
            </p>
            {nextClass && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {nextClass.time}
                </span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {nextClass.room}
                </span>
                {nextClass.instructor && (
                  <>
                    <span>·</span>
                    <span>{nextClass.instructor}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mark attendance card */}
        <div style={{
          background: t.card,
          borderRadius: 18,
          padding: 18,
          border: `1px solid ${t.bdr}`,
          boxShadow: t.sh,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: t.txt, marginBottom: 4, margin: '0 0 4px' }}>
            Mark Attendance
          </h2>
          <p style={{ fontSize: 13, color: t.txtL, marginBottom: 14, margin: '0 0 14px' }}>
            Scan the QR code displayed on the projector screen.
          </p>
          <button
            type="button"
            onClick={() => navigate('/student/scan')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg,#047857,#059669)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '13px 16px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 6px 18px rgba(5,150,105,.3)',
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" />
              <path d="M14 14h3v3 M17 14v3h3 M17 20h3" />
            </svg>
            Scan QR Code
          </button>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: t.txt, margin: 0 }}>Recent Activity</h2>
            <button type="button" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: t.pri, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>View All</button>
          </div>

          {recentActivity.map((item, idx) => {
            const color = COURSE_COLORS[item.code] ?? '#2563eb';
            const abbr = (item.code ?? '').slice(0, 2);
            const present = item.status === 'Present';
            return (
              <div key={item.code ?? idx} style={{
                background: t.card,
                borderRadius: 14,
                padding: '13px 15px',
                border: `1px solid ${t.bdr}`,
                marginBottom: 8,
                boxShadow: t.sh,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color,
                    flexShrink: 0,
                  }}>
                    {abbr}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.txt, margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: t.txtL, margin: '2px 0 0' }}>{item.date}</p>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 11px',
                  borderRadius: 20,
                  background: present ? t.okL : t.accL,
                  color: present ? t.ok : t.acc,
                }}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
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
