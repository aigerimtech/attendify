import './FaceSetup.css';
import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { api } from '../../api/client';
import { useTheme } from "../../context/ThemeContext";

const WEBCAM_CONSTRAINTS = { width: 280, height: 280, facingMode: 'user' };
const TOTAL = 3;

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function FaceSetup() {
  const navigate = useNavigate();
  const { theme: t } = useTheme();
  const webcamRef = useRef(null);

  const [photos,          setPhotos]          = useState([]); // accepted: { dataUrl, blob }
  const [currentCapture,  setCurrentCapture]  = useState(null); // pending: dataUrl string
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState('');

  const step        = photos.length;           // 0‥2: which photo we're collecting
  const allCaptured = step === TOTAL;

  const handleCapture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) setCurrentCapture(screenshot);
  }, []);

  const handleRetake = () => setCurrentCapture(null);

  const handleUseThis = async () => {
    const blob = await dataUrlToBlob(currentCapture);
    setPhotos((prev) => [...prev, { dataUrl: currentCapture, blob }]);
    setCurrentCapture(null);
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setSubmitError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      fd.append('consent', 'true');
      photos.forEach(({ blob }) => fd.append('photos', blob, 'photo.jpg'));
      await api.form('/face/enroll', fd);
      const stored = JSON.parse(localStorage.getItem('currentStudent') || 'null');
      if (stored) {
        stored.face_enrolled = true;
        localStorage.setItem('currentStudent', JSON.stringify(stored));
      }
      navigate('/student/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fs-root">
      <div className="fs-content">

        {/* Back button */}
        <div style={{ width: '100%', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#2563eb',
              fontFamily: "'DM Sans', sans-serif", padding: 0,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Login
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="fs-app-name">Face Registration Required</div>
          <div className="fs-tagline" style={{ lineHeight: 1.5 }}>
            Please take 3 clear photos to enable attendance tracking
          </div>
        </div>

        {/* Step counter pill */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            background: allCaptured ? '#f0fdf4' : '#eff6ff',
            color: allCaptured ? '#15803d' : '#2563eb',
            borderRadius: 20, padding: '5px 16px',
            border: `1px solid ${allCaptured ? '#bbf7d0' : '#bfdbfe'}`,
          }}>
            {allCaptured ? 'All 3 photos ready' : `Photo ${step + 1} of ${TOTAL}`}
          </span>
        </div>

        {/* Card */}
        <div className="fs-card">
          <p className="fs-subtitle" style={{ marginBottom: allCaptured ? 8 : 16 }}>
            {allCaptured
              ? 'Review your photos below, then submit to complete enrollment.'
              : [
                  'Look straight at the camera',
                  'Slowly turn your head slightly to the left',
                  'Slowly turn your head slightly to the right',
                ][step]}
          </p>

          {/* Permission denied */}
          {permissionDenied && (
            <div className="fs-permission-error" role="alert">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Camera access denied. Please allow camera access in your browser settings.
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="fs-permission-error" role="alert">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {submitError}
            </div>
          )}

          {/* Camera + capture — only while collecting */}
          {!allCaptured && !permissionDenied && (
            <>
              <div className="fs-camera-wrap">
                <div className="fs-camera-outer">
                  <div className={`fs-camera-glow${currentCapture ? ' fs-camera-glow-captured' : ''}`} />
                  <div className={`fs-camera-ring${currentCapture ? ' fs-camera-ring-captured' : ''}`}>
                    {currentCapture ? (
                      <>
                        <img src={currentCapture} alt="Captured" className="fs-camera-preview" />
                        <div className="fs-capture-overlay">
                          <div className="fs-capture-badge">
                            <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
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
                        onUserMediaError={() => setPermissionDenied(true)}
                        mirrored
                        className="fs-webcam"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="fs-btn-group">
                {currentCapture ? (
                  <>
                    <button type="button" className="fs-retake-btn" onClick={handleRetake}>
                      Retake
                    </button>
                    <button type="button" className="fs-continue-btn" onClick={handleUseThis}>
                      Use This
                    </button>
                  </>
                ) : (
                  <button type="button" className="fs-capture-btn" onClick={handleCapture}>
                    <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Take Photo
                  </button>
                )}
              </div>
            </>
          )}

          {/* Photo strip — previews + empty slots */}
          {(photos.length > 0 || allCaptured) && (
            <div style={{ marginTop: allCaptured ? 4 : 20 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: '#94a3b8',
                letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 12,
              }}>
                Captured Photos
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {photos.map(({ dataUrl }, idx) => (
                  <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={dataUrl}
                      alt={`Photo ${idx + 1}`}
                      style={{
                        width: 68, height: 68, borderRadius: 12,
                        objectFit: 'cover', border: '2px solid #16a34a', display: 'block',
                      }}
                    />
                    {/* Green check badge */}
                    <div style={{
                      position: 'absolute', top: -7, right: -7,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#16a34a', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    {/* Remove link */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      style={{
                        display: 'block', width: '100%', marginTop: 4,
                        fontSize: 10, fontWeight: 700, color: '#dc2626',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif", padding: 0, textAlign: 'center',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {/* Empty slot placeholders */}
                {Array.from({ length: TOTAL - photos.length }).map((_, idx) => (
                  <div key={`slot-${idx}`} style={{
                    width: 68, height: 68, borderRadius: 12,
                    border: '2px dashed #cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f8fafc', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22, color: '#cbd5e1', lineHeight: 1 }}>+</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit — only when all 3 accepted */}
          {allCaptured && (
            <button
              type="button"
              className="fs-capture-btn"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: 22, width: '100%', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Submitting…' : 'Submit Photos'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}