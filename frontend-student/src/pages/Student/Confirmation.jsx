import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Confirmation() {
  const navigate      = useNavigate();
  const locationState = useLocation();
  const { theme: t }  = useTheme();

  const session = locationState.state?.session ?? {};

  // Geolocation — only attempted when location is 'Current Location'
  const needsGeo = session.location === 'Current Location';
  const [geoState, setGeoState] = useState(needsGeo ? 'loading' : 'skip');
  const [coords,   setCoords]   = useState(null);

  useEffect(() => {
    if (!needsGeo) return;
    if (!navigator.geolocation) { setGeoState('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('ready');
      },
      () => setGeoState('denied'),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Decide whether to show the location card at all
  const hasLocation = !!session.location;
  const showMap     = geoState === 'ready' && coords !== null;

  return (
    <div style={{ background: t.bg, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: t.hdr, borderBottom: `1px solid ${t.bdr}`,
        display: 'flex', alignItems: 'center', padding: '14px 18px', flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate('/student/dashboard')} aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <XIcon color={t.txt} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 800, color: t.txt, margin: 0, letterSpacing: -0.3 }}>
          Confirmation
        </h1>
        <div style={{ width: 40 }} />
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Success circle */}
        <div aria-hidden="true" style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'linear-gradient(135deg,#047857,#059669)',
          boxShadow: '0 8px 28px rgba(5,150,105,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LargeCheckIcon />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: t.txt, margin: '0 0 8px', letterSpacing: -0.5 }}>
            Attendance Confirmed
          </h2>
          <p style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, margin: 0 }}>
            Your presence has been successfully recorded in the Attendify system.
          </p>
        </div>

        {/* Session details card */}
        <div style={{ background: t.card, borderRadius: 20, padding: '18px 20px', border: `1px solid ${t.bdr}`, boxShadow: t.shMd, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: t.txtM }}>CURRENT SESSION</span>
            <GraduationCapIcon color={t.pri} />
          </div>

          <p style={{ fontSize: 16, fontWeight: 800, color: t.txt, margin: '0 0 4px', letterSpacing: -0.3 }}>
            {session.course_name ?? '—'}
          </p>
          <p style={{ fontSize: 13, color: t.txtL, margin: '0 0 16px' }}>
            {session.instructor_name ?? ''}
          </p>

          <div style={{ height: 1, background: t.bdr, marginBottom: 16 }} />

          {/* Date & Time row */}
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <CalendarIcon color={t.txtL} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: t.txtL }}>DATE</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.txt, margin: 0 }}>{session.date ?? '—'}</p>
            </div>
            <div style={{ width: 1, background: t.bdr, margin: '0 16px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <ClockIcon color={t.txtL} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: t.txtL }}>TIME</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: t.txt, margin: 0 }}>{session.time ?? '—'}</p>
            </div>
          </div>

          <div style={{ height: 1, background: t.bdr, margin: '16px 0' }} />

          {/* Status row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: t.ok, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: t.txtL, fontWeight: 600 }}>Status</span>
            </div>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: t.okL, border: '1px solid rgba(5,150,105,.2)',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, color: t.ok,
            }}>
              <SmallCheckIcon color={t.ok} />
              {session.status ?? 'VERIFIED'}
            </span>
          </div>
        </div>

        {/* Location card — only shown when session has a location */}
        {hasLocation && (
          <div style={{ background: t.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.bdr}`, width: '100%', boxShadow: t.sh }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showMap || (needsGeo && geoState !== 'skip') ? 12 : 0 }}>
              <PinIcon color={t.pri} />
              <span style={{ fontSize: 13, fontWeight: 700, color: t.txt }}>
                {needsGeo ? 'Current Location' : session.location}
              </span>
            </div>

            {/* Geo loading */}
            {needsGeo && geoState === 'loading' && (
              <div style={{ fontSize: 12, color: t.txtL, padding: '8px 0', textAlign: 'center' }}>
                Detecting location…
              </div>
            )}

            {/* Geo denied */}
            {needsGeo && geoState === 'denied' && (
              <div style={{ fontSize: 12, color: t.acc, padding: '8px 0', textAlign: 'center' }}>
                Location unavailable
              </div>
            )}

            {/* Real map */}
            {showMap && (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01},${coords.lat - 0.01},${coords.lng + 0.01},${coords.lat + 0.01}&marker=${coords.lat},${coords.lng}`}
                width="100%"
                height="150"
                style={{ borderRadius: 12, border: 'none', display: 'block' }}
                title="Location map"
              />
            )}
          </div>
        )}
      </div>

      {/* ── Done button ── */}
      <div style={{ padding: '12px 20px 28px', flexShrink: 0 }}>
        <button type="button" onClick={() => navigate('/student/dashboard')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg,#047857,#059669)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 16px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 6px 18px rgba(5,150,105,.35)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function XIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function LargeCheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
      stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function GraduationCapIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
function CalendarIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function SmallCheckIcon({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function PinIcon({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
