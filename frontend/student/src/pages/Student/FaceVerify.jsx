import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './FaceVerify.css';

const WEBCAM_CONSTRAINTS = {
  width: 640,
  height: 640,
  facingMode: 'user',
};

// --- Python Flask backend ---
// Artık n8n kullanmıyoruz. Frontend doğrudan Python'a istek atıyor,
// Python da Postgres'e yoklamayı kendisi kaydediyor.
const API_URL = `${import.meta.env.VITE_ML_API_URL || 'http://localhost:5001'}/recognize`;

// Varsayılan mesaj
const DEFAULT_MSG = 'Please hold your phone steady and look directly at the screen.';

export default function FaceVerify() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [phase, setPhase] = useState('verifying'); // 'verifying' | 'success'
  const [message, setMessage] = useState(DEFAULT_MSG);
  // Uyarı tipi: 'info' (varsayılan), 'warning' (iki kişi vb.), 'error' (yüz yok / tanınmıyor)
  const [messageType, setMessageType] = useState('info');

  // Python backend'e fotoğraf gönderip doğrulama yapan fonksiyon
  // (Gerçek sistemde bu, login olan kullanıcıdan gelir)
  const userEmail = "student@test.com";

  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current || phase !== 'verifying') return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = await fetch(imageSrc).then(res => res.blob());
    const formData = new FormData();
    formData.append('file', blob, 'student_capture.jpg');

    try {
      const response = await fetch(`${API_URL}?email=${userEmail}`, {
        method: 'POST',
        body: formData,
      });

      // HTTP status ne olursa olsun JSON parse etmeye çalış.
      // Python 400/401 dönse bile JSON gövdesi var.
      let result = null;
      try { result = await response.json(); } catch { /* JSON yoksa yok */ }

      // BAŞARILI (HTTP 200 + status:success)
      if (response.ok && result && result.status === 'success') {
        setMessage(result.message || `Welcome, ${result.name || ''}!`);
        setMessageType('info');
        setPhase('success');
        setTimeout(() => navigate('/student/confirmation'), 3000);
        return;
      }

      // HATA DURUMLARI (HTTP 400/401 veya status:fail/warning)
      if (result && result.message) {
        // Uyarı tipini belirle
        if (result.status === 'warning') {
          // Birden fazla yüz -> sarı uyarı
          setMessageType('warning');
        } else {
          // Yüz yok, tanınmadı, yanlış hesap -> kırmızı hata
          setMessageType('error');
        }
        setMessage(result.message);
      } else {
        // Beklenmedik sunucu cevabı
        setMessageType('error');
        setMessage('Sunucuya ulaşılamadı. Tekrar deneniyor...');
      }
      // phase 'verifying' kalıyor -> 3 sn sonra otomatik tekrar denenir
    } catch (error) {
      console.error("Verification error:", error);
      setMessageType('error');
      setMessage('Bağlantı hatası. Tekrar deneniyor...');
    }
  }, [navigate, phase]);

  // Sayfa açık olduğu sürece her 1.5 saniyede bir otomatik tarama yap.
  // Blink detection için daha hızlı polling gerekli; kullanıcı fazla beklemesin.
  useEffect(() => {
    let interval;
    if (phase === 'verifying' && !permissionDenied) {
      interval = setInterval(() => {
        captureAndVerify();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [phase, permissionDenied, captureAndVerify]);

  const verifying = phase === 'verifying' && !permissionDenied;
  const success   = phase === 'success'   && !permissionDenied;
  const failed    = permissionDenied;

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

        {/* Durum mesajı - renk messageType'a göre değişir */}
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
            Verifying...
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

/* ── İkonlar (Eski kodla birebir aynı) ── */
function BackArrowIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>); }
function SmallCameraIcon() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>); }
function CheckLgIcon() { return (<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>); }
function XLgIcon() { return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>); }
function LockIcon() { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>); }
function CameraOffIcon() { return (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2.5" /><circle cx="12" cy="13" r="3" /></svg>); }
