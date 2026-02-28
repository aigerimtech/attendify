import { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './FaceVerify.css';

const WEBCAM_CONSTRAINTS = {
  width: 280,
  height: 280,
  facingMode: 'user',
};

// Arc geometry: container 260px, circle r=126
// Circumference ≈ 791.7 → 270° dash ≈ 594, gap ≈ 198
const ARC_DASHARRAY = '594 198';

export default function FaceVerify() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Auto-capture and navigate after 3 s (skipped if camera was denied)
  useEffect(() => {
    if (permissionDenied) return;
    const id = setTimeout(() => navigate('/student/confirmation'), 5000);
    return () => clearTimeout(id);
  }, [navigate, permissionDenied]);

  return (
    <div className="fv-root">
      {/* ── Header ── */}
      <header className="fv-header">
        <button
          type="button"
          className="fv-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <BackArrowIcon />
        </button>
        <h1 className="fv-header-title">Verify Identity</h1>
        <Link to="/student/dashboard" className="fv-cancel-link">Cancel</Link>
      </header>

      {/* ── Body ── */}
      <div className="fv-body">
        {/* Camera outer — holds arc SVG + ring + cam button */}
        <div className="fv-camera-outer" aria-label="Camera viewfinder">
          {/* Spinning blue arc */}
          <svg
            className="fv-arc-svg"
            viewBox="0 0 260 260"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="130"
              cy="130"
              r="126"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={ARC_DASHARRAY}
            />
          </svg>

          {/* Dark circular camera ring with dashed inner border */}
          <div className="fv-camera-ring">
            {permissionDenied ? (
              <div className="fv-cam-denied">
                <CameraOffIcon />
              </div>
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={WEBCAM_CONSTRAINTS}
                className="fv-webcam"
                onUserMediaError={() => setPermissionDenied(true)}
                mirrored
              />
            )}
          </div>

          {/* Small camera icon button at bottom center */}
          <div className="fv-cam-btn" aria-hidden="true">
            <SmallCameraIcon />
          </div>
        </div>

        <h2 className="fv-title">Face Verification</h2>
        <p className="fv-subtitle">
          Please hold your phone steady and look directly at the screen.
        </p>

        {/* Permission denied error */}
        {permissionDenied && (
          <div className="fv-error-banner" role="alert">
            <AlertIcon />
            Camera access denied. Please allow camera access in your browser settings.
          </div>
        )}

        {/* Verifying status pill */}
        {!permissionDenied && (
          <div className="fv-status-pill" role="status" aria-live="polite">
            <span className="fv-status-dot" aria-hidden="true" />
            Verifying...
          </div>
        )}

        {/* DEV-only skip button */}
        {import.meta.env.DEV && (
          <button
            type="button"
            className="fv-skip-btn"
            onClick={() => navigate('/student/confirmation')}
          >
            Skip Verification
          </button>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="fv-footer">
        <div className="fv-encrypted">
          <LockIcon />
          <span>ENCRYPTED &amp; SECURE</span>
        </div>
        <p className="fv-privacy-text">
          Your biometric data is processed securely and is never shared with third parties.
        </p>
      </footer>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function BackArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SmallCameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2.5" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
