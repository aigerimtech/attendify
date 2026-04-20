import { useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useTheme } from "../../context/ThemeContext";
import { IndigoBtn } from "../../components/shared/IndigoBtn";

const WEBCAM_CONSTRAINTS = {
  width: 280,
  height: 280,
  facingMode: 'user',
};

export default function FaceSetup() {
  const navigate = useNavigate();
  const { theme: t } = useTheme();
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

  const steps = [
    { label: 'Register', done: true, active: false, num: 1 },
    { label: 'Face Setup', done: false, active: true, num: 2 },
    { label: 'Done', done: false, active: false, num: 3 },
  ];

  return (
    <div style={{
      background: t.bgAlt,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 22px 32px',
      overflowY: 'auto',
      flex: 1,
      minHeight: '100vh',
    }}>

      {/* Step indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        width: '100%',
      }}>
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: s.done ? t.ok : s.active ? t.pri : t.bdr,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: s.done || s.active ? '#fff' : t.txtL,
              }}>
                {s.done ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <span>{s.num}</span>
                )}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: s.done ? t.ok : s.active ? t.pri : t.txtL,
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 44,
                height: 2,
                margin: '0 6px',
                marginBottom: 18,
                background: steps[i].done ? t.ok : t.bdr,
                borderRadius: 999,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: t.card,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        border: `1px solid ${t.bdr}`,
        boxShadow: t.shMd,
      }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: t.txt, textAlign: 'center', marginBottom: 6 }}>
          Set Up Face Recognition
        </div>
        <div style={{ fontSize: 13, color: t.txtL, textAlign: 'center', lineHeight: 1.6, marginBottom: 22 }}>
          We need to scan your face to verify your identity during attendance.
        </div>

        {/* Permission denied alert */}
        {permissionDenied && (
          <div style={{
            background: t.accL,
            border: `1.5px solid rgba(244,63,94,.2)`,
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            fontSize: 13,
            color: t.acc,
            fontWeight: 600,
          }} role="alert">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={t.acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Camera access denied. Please allow camera access in your browser settings.
          </div>
        )}

        {/* Camera circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Glow ring */}
            <div style={{
              position: 'absolute',
              inset: -7,
              borderRadius: '50%',
              border: `3px solid ${photo ? 'rgba(5,150,105,.25)' : t.priL}`,
              transition: 'border-color .4s',
              pointerEvents: 'none',
            }} />
            {/* Camera circle */}
            <div style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: '#080718',
              border: `4px solid ${photo ? t.ok : t.pri}`,
              transition: 'border-color .3s',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {permissionDenied ? (
                <svg width={54} height={54} viewBox="0 0 24 24" fill="none"
                  stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
              ) : photo ? (
                <>
                  <img
                    src={photo}
                    alt="Captured face"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(5,150,105,.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#047857,#059669)',
                      boxShadow: '0 4px 14px rgba(5,150,105,.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={WEBCAM_CONSTRAINTS}
                  onUserMediaError={handleCameraError}
                  mirrored
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* After capture: success banner */}
        {photo && (
          <div style={{
            background: t.okL,
            border: '1.5px solid rgba(5,150,105,.2)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }} role="alert">
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#047857,#059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.ok }}>
              Photo captured successfully!
            </span>
          </div>
        )}

        {/* Before capture: instruction text */}
        {!photo && !permissionDenied && (
          <p style={{
            fontSize: 13,
            color: t.txtL,
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            Position your face inside the circle and look directly at the camera.
          </p>
        )}

        {/* Buttons */}
        {!permissionDenied && (
          <div>
            {photo ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleRetake}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    border: `1.5px solid ${t.bdr}`,
                    background: t.card,
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.txtL,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Retake
                </button>
                <IndigoBtn
                  onClick={handleContinue}
                  style={{ flex: 2, width: 'auto', borderRadius: 14 }}
                >
                  Continue
                </IndigoBtn>
              </div>
            ) : (
              <IndigoBtn onClick={handleCapture}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Capture Photo
              </IndigoBtn>
            )}
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: t.txtL }}>
        <Link to="/login" style={{ color: t.pri, fontWeight: 700, textDecoration: 'none' }}>
          Back to Login
        </Link>
      </p>
    </div>
  );
}
