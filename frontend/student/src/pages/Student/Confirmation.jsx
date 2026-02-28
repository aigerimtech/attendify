import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockSession } from '../../data/mockData';
import './Confirmation.css';

export default function Confirmation() {
  const navigate = useNavigate();

  // 'loading' | 'ready' | 'denied'
  const [geoState, setGeoState] = useState('loading');
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ lat: latitude, lng: longitude });
        setGeoState('ready');
      },
      () => setGeoState('denied'),
    );
  }, []);

  return (
    <div className="cf-root">
      {/* ── Header ── */}
      <header className="cf-header">
        <button
          type="button"
          className="cf-close-btn"
          onClick={() => navigate('/student/dashboard')}
          aria-label="Close"
        >
          <XIcon />
        </button>
        <h1 className="cf-header-title">Confirmation</h1>
        {/* Spacer mirrors the close button so the title stays centred */}
        <div className="cf-header-spacer" />
      </header>

      {/* ── Body ── */}
      <div className="cf-body">
        {/* Success circle */}
        <div className="cf-check-circle" aria-hidden="true">
          <LargeCheckIcon />
        </div>

        <h2 className="cf-title">Attendance Confirmed</h2>
        <p className="cf-subtitle">
          Your presence has been successfully recorded in the Attendify system.
        </p>

        {/* Session details card */}
        <div className="cf-card">
          {/* Card header row */}
          <div className="cf-card-top-row">
            <span className="cf-session-label">CURRENT SESSION</span>
            <GraduationCapIcon />
          </div>

          <p className="cf-course-name">
            {mockSession.courseCode}: {mockSession.courseName}
          </p>
          <p className="cf-instructor">{mockSession.instructor}</p>

          <div className="cf-divider" />

          {/* Date & Time row */}
          <div className="cf-datetime-row">
            <div className="cf-datetime-item">
              <div className="cf-datetime-label-row">
                <CalendarIcon />
                <span className="cf-datetime-label">DATE</span>
              </div>
              <p className="cf-datetime-value">{mockSession.date}</p>
            </div>
            <div className="cf-datetime-sep" />
            <div className="cf-datetime-item">
              <div className="cf-datetime-label-row">
                <ClockIcon />
                <span className="cf-datetime-label">TIME</span>
              </div>
              <p className="cf-datetime-value">{mockSession.time}</p>
            </div>
          </div>

          <div className="cf-divider" />

          {/* Status row */}
          <div className="cf-status-row">
            <div className="cf-status-left">
              <span className="cf-status-dot" aria-hidden="true" />
              <span className="cf-status-label">Status</span>
            </div>
            <span className="cf-verified-badge">
              <SmallCheckIcon />
              {mockSession.status}
            </span>
          </div>
        </div>

        {/* Location section */}
        <div className="cf-location">
          <div className="cf-location-header">
            <PinIcon />
            <span className="cf-location-text">{mockSession.location}</span>
          </div>
          {geoState === 'loading' && (
            <div className="cf-map-status">Detecting location…</div>
          )}
          {geoState === 'denied' && (
            <div className="cf-map-status cf-map-status-error">Location unavailable</div>
          )}
          {geoState === 'ready' && coords && (
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01},${coords.lat - 0.01},${coords.lng + 0.01},${coords.lat + 0.01}&marker=${coords.lat},${coords.lng}`}
              width="100%"
              height="150"
              style={{ borderRadius: '12px', border: 'none' }}
              title="Location map"
            />
          )}
        </div>
      </div>

      {/* ── Done button ── */}
      <div className="cf-done-wrap">
        <button
          type="button"
          className="cf-done-btn"
          onClick={() => navigate('/student/dashboard')}
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LargeCheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
      stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SmallCheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

