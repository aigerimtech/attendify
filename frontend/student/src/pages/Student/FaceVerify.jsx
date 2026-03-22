import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { mockSession } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';

const WEBCAM_CONSTRAINTS = {
  width: 280,
  height: 280,
  facingMode: 'user',
};

// Spec-defined guide dot positions (% within camera circle)
const GUIDE_DOTS = [
  { top: '30%', left: '24%' },
  { top: '30%', right: '24%' },
  { top: '50%', left: '42%' },
  { top: '63%', left: '33%' },
  { top: '63%', right: '33%' },
];

export default function FaceVerify() {
  const navigate = useNavigate();
  const { theme: t, isDark } = useTheme();
  const webcamRef = useRef(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [phase, setPhase] = useState('verifying'); // 'verifying' | 'success'
  const [verifyState, setVerifyState] = useState('verifying'); // 'verifying' | 'verified'

  // Visual success state at 3.5 s; existing navigate at 5 s is untouched
  useEffect(() => {
    if (permissionDenied) return;
    const successTimer = setTimeout(() => {
      setPhase('success');
      setVerifyState('verified'); // transition when API returns face_validated: true
    }, 3500);
    const navTimer = setTimeout(() => navigate('/student/confirmation'), 5000);
    return () => { clearTimeout(successTimer); clearTimeout(navTimer); };
  }, [navigate, permissionDenied]);

  const verifying = phase === 'verifying' && !permissionDenied;
  const success   = phase === 'success'   && !permissionDenied;
  const failed    = permissionDenied;

  return (
    <div style={{ background: t.bg, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: t.hdr, borderBottom: `1px solid ${t.bdr}`,
        display: 'flex', alignItems: 'center', padding: '14px 18px', flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
          }}
        >
          <BackArrowIcon color={t.txt} />
        </button>
        <h1 style={{
          flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 800,
          color: t.txt, margin: 0, letterSpacing: -0.3,
        }}>
          Verify Identity
        </h1>
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          style={{
            background: 'none', border: 'none',
            fontSize: 13, fontWeight: 600, color: t.txtL,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </header>

      {/* ── Main content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '28px 22px 20px',
      }}>

        {/* ── Camera ring (220×220) ── */}
        <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 26 }}>

          {/* SVG overlay — background ring + animated arc or static green ring */}
          <svg
            width="220" height="220"
            style={{ position: 'absolute', top: 0, left: 0 }}
            aria-hidden="true"
          >
            {/* Background ring */}
            <circle
              cx="110" cy="110" r="103" fill="none" strokeWidth="3"
              stroke={verifyState === 'verified' ? 'rgba(5,150,105,.2)' : t.accL}
            />

            {/* Verifying: animated spinning arc */}
            {verifyState === 'verifying' && (
              <circle
                cx="110" cy="110" r="103" fill="none"
                stroke={t.acc} strokeWidth="2.5" strokeDasharray="65 560"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-90 110 110"
                  to="270 110 110"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Verified: full static green ring */}
            {verifyState === 'verified' && (
              <circle cx="110" cy="110" r="103" fill="none"
                stroke={t.ok} strokeWidth="2.5"
              />
            )}
          </svg>

          {/* Camera circle */}
          <div style={{
            position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
            borderRadius: '50%', background: '#060412', overflow: 'hidden',
            border: `4px solid ${verifyState === 'verified' ? t.ok : t.pri}`,
            transition: 'border-color .4s',
          }}>
            {failed ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CameraOffIcon color={t.txtL} />
              </div>
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={WEBCAM_CONSTRAINTS}
                onUserMediaError={() => setPermissionDenied(true)}
                mirrored
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Verifying: rose guide dots */}
            {verifyState === 'verifying' && !failed && (
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {GUIDE_DOTS.map((pos, i) => (
                  <span key={i} style={{
                    position: 'absolute', width: 4, height: 4, borderRadius: '50%',
                    background: t.accMid, opacity: 0.7,
                    animation: `pulse ${1 + i * 0.2}s infinite`,
                    ...pos,
                  }} />
                ))}
              </div>
            )}

            {/* Verified: green overlay */}
            {verifyState === 'verified' && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,150,105,.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 66, height: 66, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#047857,#059669)',
                  boxShadow: '0 6px 20px rgba(5,150,105,.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={30} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>

          {/* Camera icon pill — verifying only */}
          {verifyState === 'verifying' && !failed && (
            <div aria-hidden="true" style={{
              position: 'absolute', bottom: 10,
              left: '50%', transform: 'translateX(-50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: t.card, border: `1px solid ${t.bdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SmallCameraIcon color={t.txtL} />
            </div>
          )}
        </div>

        {/* ── Text block ── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{
            fontWeight: 800, fontSize: 21, letterSpacing: -0.4, margin: '0 0 8px',
            color: verifyState === 'verified' ? t.ok : t.txt,
            transition: 'color .3s',
          }}>
            {verifyState === 'verified' ? 'Identity Verified!' : 'Face Verification'}
          </h2>
          <p style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, margin: 0 }}>
            {verifyState === 'verified'
              ? 'Your attendance has been successfully recorded.'
              : 'Please hold your phone steady and look directly at the screen.'}
          </p>
        </div>

        {/* ── Buttons ── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* VERIFYING state */}
          {verifyState === 'verifying' && !failed && (
            <>
              {/* Rose status pill */}
              <div role="status" aria-live="polite" style={{
                background: t.accL, border: `1px solid ${t.accLL}`, borderRadius: 13,
                padding: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              }}>
                <span aria-hidden="true" style={{
                  width: 7, height: 7, borderRadius: '50%', background: t.acc,
                  display: 'inline-block', animation: 'pulse 1s infinite',
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: t.acc }}>Verifying...</span>
              </div>

              {/* Skip button */}
              <button
                type="button"
                onClick={() => navigate('/student/confirmation')}
                style={{
                  width: '100%', background: t.card, border: `1.5px solid ${t.bdr}`,
                  borderRadius: 13, padding: 13, fontSize: 14, fontWeight: 700,
                  color: t.txtL, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Skip Verification
              </button>
            </>
          )}

          {/* FAILED state */}
          {failed && (
            <>
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                style={{
                  width: '100%', background: t.priG, color: '#fff', border: 'none',
                  borderRadius: 13, padding: 13, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 6px 18px rgba(67,56,202,.3)',
                }}
              >
                Notify Instructor
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  width: '100%', background: t.card, color: t.txtL,
                  border: `1.5px solid ${t.bdr}`, borderRadius: 13,
                  padding: 13, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Try Again
              </button>
            </>
          )}

          {/* VERIFIED state */}
          {verifyState === 'verified' && (
            <>
              {/* Green success banner */}
              <div style={{
                background: t.okL, border: '1.5px solid rgba(5,150,105,.2)',
                borderRadius: 13, padding: '13px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#047857,#059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={13} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t.ok, margin: '0 0 2px' }}>
                    Attendance Recorded
                  </p>
                  <p style={{ fontSize: 11, color: t.txtL, margin: 0 }}>
                    {mockSession.courseName} · {mockSession.time}
                  </p>
                </div>
              </div>

              {/* Green Go to Dashboard button */}
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg,#047857,#059669)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  padding: '13px 16px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 6px 18px rgba(5,150,105,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <HomeIcon />
                Go to Dashboard
              </button>
            </>
          )}
        </div>

        {/* ── Security note ── */}
        <div style={{ marginTop: 'auto', paddingTop: 22, textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
            <ShieldIcon color={t.txtL} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: t.txtL }}>
              ENCRYPTED &amp; SECURE
            </span>
          </div>
          <p style={{ fontSize: 11, color: t.txtL, lineHeight: 1.6, margin: 0 }}>
            Your biometric data is processed securely and is never shared with third parties.
          </p>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function BackArrowIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SmallCameraIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CheckIcon({ size = 24, strokeWidth = 2.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="#ffffff" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ShieldIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CameraOffIcon({ color }) {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2.5" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
