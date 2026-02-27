import { useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './FaceSetup.css';

const WEBCAM_CONSTRAINTS = {
  width: 280,
  height: 280,
  facingMode: 'user',
};

export default function FaceSetup() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleCapture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) setPhoto(screenshot);
  }, []);

  const handleRetake = () => setPhoto(null);

  const handleContinue = () => {
    navigate('/login', { state: { successMessage: 'Registration complete! Please sign in.' } });
  };

  const handleCameraError = () => {
    setPermissionDenied(true);
  };

  return (
    <div className="fs-root">
      {/* Dot-pattern background */}
      <div className="fs-bg" aria-hidden="true">
        <div className="fs-dots" />
      </div>

      <div className="fs-content">
        {/* Logo */}
        <div className="fs-logo-wrap">
          <div className="fs-logo-icon">
            <CalendarIcon />
            <span className="fs-logo-badge">
              <CheckIcon />
            </span>
          </div>
          <h1 className="fs-app-name">Attendify</h1>
          <p className="fs-tagline">Smart Attendance Management</p>
        </div>

        {/* Step indicators */}
        <div className="fs-steps">
          <div className="fs-step fs-step-done">
            <div className="fs-step-circle"><CheckIcon /></div>
            <span className="fs-step-label">Register</span>
          </div>
          <div className="fs-step-line fs-step-line-done" />
          <div className="fs-step fs-step-active">
            <div className="fs-step-circle">2</div>
            <span className="fs-step-label">Face Setup</span>
          </div>
          <div className="fs-step-line" />
          <div className="fs-step">
            <div className="fs-step-circle">3</div>
            <span className="fs-step-label">Done</span>
          </div>
        </div>

        {/* Card */}
        <div className="fs-card">
          <h2 className="fs-title">Set Up Face Recognition</h2>
          <p className="fs-subtitle">
            We need to scan your face to verify your identity during attendance.
          </p>

          {/* Camera permission denied */}
          {permissionDenied && (
            <div className="fs-permission-error" role="alert">
              <AlertIcon />
              Camera access denied. Please allow camera access in your browser settings.
            </div>
          )}

          {/* Camera circle */}
          {!permissionDenied && (
            <div className="fs-camera-wrap">
              <div className={`fs-camera-ring${photo ? ' fs-camera-ring-captured' : ''}`}>
                {photo ? (
                  <img src={photo} alt="Captured face" className="fs-camera-preview" />
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={WEBCAM_CONSTRAINTS}
                    className="fs-webcam"
                    onUserMediaError={handleCameraError}
                    mirrored
                  />
                )}
              </div>
            </div>
          )}

          {/* Post-capture success message */}
          {photo && (
            <div className="fs-success" role="alert">
              <CheckCircleIcon />
              Photo captured successfully!
            </div>
          )}

          {/* Instructions */}
          {!photo && !permissionDenied && (
            <p className="fs-instructions">
              Position your face inside the circle and look directly at the camera.
            </p>
          )}

          {/* Buttons */}
          {!permissionDenied && (
            <div className="fs-btn-group">
              {photo ? (
                <>
                  <button type="button" className="fs-retake-btn" onClick={handleRetake}>
                    Retake
                  </button>
                  <button type="button" className="fs-continue-btn" onClick={handleContinue}>
                    Continue
                  </button>
                </>
              ) : (
                <button type="button" className="fs-capture-btn" onClick={handleCapture}>
                  <CameraIcon />
                  Capture Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="fs-back-note">
          <Link to="/login" className="fs-back-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function CalendarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
