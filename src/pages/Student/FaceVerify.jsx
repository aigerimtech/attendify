import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { api } from '../../api/client';
import './FaceVerify.css';

const WEBCAM_CONSTRAINTS = {
  width: 640,
  height: 640,
  facingMode: 'user',
};

const DEFAULT_MSG = 'Please hold your phone steady and look directly at the screen.';
const BLINK_MSG   = 'Please blink once to confirm you are real.';

// Convert a base64 data URL to a File object
function dataUrlToFile(dataUrl, filename = 'capture.jpg') {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// Unique key per session so ML service tracks blinks correctly
const CLIENT_KEY = `fv_${Date.now()}`;

export default function FaceVerify() {
  const navigate      = useNavigate();
  const locationState = useLocation();
  const webcamRef     = useRef(null);

  const qrToken = locationState.state?.qr_token ?? null;

  const [permissionDenied, setPermissionDenied] = useState(false);
  // step: 'liveness' → blink check first, then 'submit' → face match
  const [step,        setStep]        = useState('liveness');
  const [phase,       setPhase]       = useState('verifying'); // 'verifying' | 'success'
  const [message,     setMessage]     = useState(DEFAULT_MSG);
  const [messageType, setMessageType] = useState('info');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!qrToken) navigate('/student/scan', { replace: true });
  }, [qrToken, navigate]);

  // Show blink instruction only on initial liveness step (not after error reset — setTimeout handles that)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    // step changed back to liveness — message already set by setTimeout
  }, [step]);

  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current || phase !== 'verifying' || submitting || !qrToken) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setSubmitting(true);

    try {
      const imageFile = dataUrlToFile(imageSrc, 'capture.jpg');

      // ── Step 1: Liveness (blink) check ──
      if (step === 'liveness') {
        const fd = new FormData();
        fd.append('image', imageFile);
        const result = await api.form(`/attendance/liveness-check?client_key=${CLIENT_KEY}`, fd);

        if (result?.is_live) {
          setStep('submit');
          setMessage('Blink detected! Verifying identity…');
          setMessageType('info');
        } else {
          const reason = result?.reason || '';
          if (reason === 'no_face') {
            setMessageType('error');
            setMessage('No face detected. Please look directly at the camera.');
          } else if (reason === 'multiple_faces') {
            setMessageType('error');
            setMessage('Multiple faces detected. Please make sure only your face is visible.');
          } else if (reason === 'blur') {
            setMessageType('warning');
            setMessage('Image too blurry. Hold your phone steady.');
          } else if (reason === 'no_eye_landmarks') {
            setMessageType('warning');
            setMessage('Cannot detect eyes. Move closer to the camera.');
          } else {
            setMessageType('warning');
            setMessage('Please blink once to confirm you are real.');
          }
        }
        return;
      }

      // ── Step 2: Face match + attendance submit ──
      const fd = new FormData();
      fd.append('qr_token', qrToken);
      fd.append('image', imageFile);
      const data = await api.form('/attendance/submit', fd);

      setMessage('Identity confirmed!');
      setMessageType('info');
      setPhase('success');
      const submittedAt = data.submitted_at ? new Date(data.submitted_at) : new Date();
      const sessionData = {
        ...data,
        date: submittedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: submittedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        status: data.status ?? 'present',
      };
      setTimeout(() => navigate('/student/confirmation', { state: { session: sessionData } }), 1500);

    } catch (err) {
      const detail = err.message || '';

      if (detail.includes('No face detected')) {
        setMessageType('error');
        setMessage('No face detected. Please look directly at the camera.');
      } else if (detail.includes('Face verification failed') || detail.includes('similarity')) {
        setMessageType('error');
        setMessage('Your face does not match this account. Please try again or contact your instructor.');
        setTimeout(() => {
          setStep('liveness');
          setMessage(BLINK_MSG);
          setMessageType('info');
        }, 3000);
      } else if (detail.includes('Liveness')) {
        setMessageType('warning');
        setMessage('Liveness check failed. Please use a real face, not a photo.');
        setTimeout(() => {
          setStep('liveness');
          setMessage(BLINK_MSG);
          setMessageType('info');
        }, 3000);
      } else if (detail.includes('Invalid or expired QR')) {
        setMessageType('error');
        setMessage('QR code has expired. Please scan again.');
        setTimeout(() => navigate('/student/scan', { replace: true }), 2500);
      } else if (detail.includes('already recorded')) {
        setMessageType('warning');
        setMessage('Attendance already recorded for this session.');
        setTimeout(() => navigate('/student/dashboard'), 2500);
      } else if (detail.includes('not enrolled')) {
        setMessageType('error');
        setMessage('You are not enrolled in this course.');
      } else {
        setMessageType('error');
        setMessage('Verification failed. Retrying…');
      }
    } finally {
      setSubmitting(false);
    }
  }, [navigate, phase, step, qrToken, submitting]);

  // Poll every 1.5 seconds
  useEffect(() => {
    if (phase !== 'verifying' || permissionDenied) return;
    const interval = setInterval(() => {
      captureAndVerify();
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, permissionDenied, captureAndVerify]);

  const verifying = phase === 'verifying' && !permissionDenied;
  const success   = phase === 'success';
  const failed    = permissionDenied;

  return (
    <div className="fv-root">
      {/* ── Header ── */}
      <header className="fv-header">
        <button
          type="button"
          className="fv-back-btn"
          onClick={() => navigate('/student/scan')}
          aria-label="Go back"
        >
          <BackArrowIcon />
        </button>
        <h1 className="fv-header-title">Verify Identity</h1>
        <Link to="/student/dashboard" className="fv-cancel-link">Cancel</Link>
      </header>

      {/* ── Body ── */}
      <div className="fv-body">
        <div className="fv-camera-outer" aria-label="Camera viewfinder">
          <div className={`fv-camera-ring${success ? ' fv-ring-success' : failed ? ' fv-ring-failed' : ''}`}>
            {failed ? (
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

            {verifying && (
              <div className="fv-face-dots" aria-hidden="true">
                <span className="fv-dot fv-dot-1" />
                <span className="fv-dot fv-dot-2" />
                <span className="fv-dot fv-dot-3" />
                <span className="fv-dot fv-dot-4" />
                <span className="fv-dot fv-dot-5" />
              </div>
            )}

            {success && (
              <div className="fv-overlay fv-overlay-success" aria-hidden="true">
                <div className="fv-overlay-badge fv-overlay-badge-success">
                  <CheckLgIcon />
                </div>
              </div>
            )}
          </div>

          <svg
            className={`fv-arc-svg${verifying ? ' fv-arc-spin' : ''}`}
            width="240"
            height="240"
            viewBox="0 0 240 240"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="120" cy="120" r="112" stroke="#bfdbfe" strokeWidth="3" fill="none" />
            {verifying && (
              <circle
                cx="120" cy="120" r="112"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="80 480"
                fill="none"
              />
            )}
            {success && (
              <circle cx="120" cy="120" r="112" stroke="#86efac" strokeWidth="3" fill="none" />
            )}
          </svg>

          {verifying && (
            <div className="fv-cam-btn" aria-hidden="true">
              <SmallCameraIcon />
            </div>
          )}
        </div>

        {/* ── Text ── */}
        <h2 className="fv-title">
          {success ? 'Identity Confirmed' : failed ? 'Verification Failed' : 'Face Verification'}
        </h2>

        {verifying && (
          <div className={`fv-alert fv-alert-${messageType}`} role="status" aria-live="polite">
            {messageType === 'error'   && <span className="fv-alert-icon">✕</span>}
            {messageType === 'warning' && <span className="fv-alert-icon">!</span>}
            {messageType === 'info'    && <span className="fv-alert-icon">i</span>}
            <span>{message}</span>
          </div>
        )}

        {(success || failed) && (
          <p className="fv-subtitle">
            {success ? message : 'Camera access denied.'}
          </p>
        )}

        {verifying && (
          <div className="fv-status-pill" role="status" aria-live="polite">
            <span className="fv-status-dot" aria-hidden="true" />
            {submitting ? 'Submitting…' : 'Verifying...'}
          </div>
        )}

        {success && (
          <button
            type="button"
            className="fv-continue-btn"
            onClick={() => navigate('/student/confirmation')}
          >
            Continue
          </button>
        )}
      </div>

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

/* ── Icons ── */
function BackArrowIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>); }
function SmallCameraIcon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>); }
function CheckLgIcon() { return (<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>); }
function LockIcon() { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>); }
function CameraOffIcon() { return (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2.5" /><circle cx="12" cy="13" r="3" /></svg>); }