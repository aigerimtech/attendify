import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

const TIMEOUT_MS = 30_000;
const SCAN_INTERVAL_MS = 600;

const REPORT_REASONS = [
  {
    id: 'qr_failed',
    label: 'QR Code not working',
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" />
        <path d="M14 14h3v3 M17 14v3h3 M17 20h3" />
      </svg>
    ),
  },
  {
    id: 'camera_error',
    label: 'Camera not working',
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other issue',
    icon: (color) => (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

function dataUrlToFile(dataUrl, filename = 'frame.jpg') {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// Extract the JWT token from the QR content.
// QR encodes a URL like: http://localhost:5173/student/scan?token=<jwt>
// Fall back to using the raw text if it's not a URL (future-proof).
function extractToken(text) {
  try {
    const url = new URL(text);
    const token = url.searchParams.get('token');
    if (token) return token;
  } catch {
    // not a URL — treat the raw text as the token
  }
  return text;
}

export default function QRScan() {
  const navigate = useNavigate();
  const { theme: t } = useTheme();
  const webcamRef   = useRef(null);
  const decoderRef  = useRef(null);
  const intervalRef = useRef(null);
  const timerRef    = useRef(null);
  const busyRef     = useRef(false);
  const resolvedRef = useRef(false);
  const scanDirRef  = useRef(1);

  const [status,  setStatus]  = useState('loading');
  const [scanPos, setScanPos] = useState(5);
  const [error,   setError]   = useState('');

  // Report modal state
  const [reportOpen,      setReportOpen]      = useState(false);
  const [selectedReason,  setSelectedReason]  = useState(null);
  const [scannedToken,    setScannedToken]    = useState(null);
  const [notifyLoading,   setNotifyLoading]   = useState(false);
  const [notifySuccess,   setNotifySuccess]   = useState(false);
  const [notifyError,     setNotifyError]     = useState('');

  useEffect(() => {
    decoderRef.current = new Html5Qrcode('qr-decode-worker');
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== 'scanning') { setScanPos(5); return; }
    const id = setInterval(() => {
      setScanPos(p => {
        const next = p + scanDirRef.current * 0.6;
        if (next >= 88) { scanDirRef.current = -1; return 88; }
        if (next <= 5)  { scanDirRef.current =  1; return 5; }
        return next;
      });
    }, 18);
    return () => clearInterval(id);
  }, [status]);

  const stopScanning = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  }, []);

  // QR scanned successfully — extract token, pass it to FaceVerify.
  // No backend call here; attendance submit happens after face verification.
  function handleQRScanned(rawText) {
    const qrToken = extractToken(rawText);
    setScannedToken(qrToken);
    navigate('/student/verify', { state: { qr_token: qrToken } });
  }

  const startScanning = useCallback(() => {
    if (resolvedRef.current) return;
    setStatus('scanning');

    timerRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      stopScanning();
      setStatus('timeout');
    }, TIMEOUT_MS);

    intervalRef.current = setInterval(async () => {
      if (resolvedRef.current || busyRef.current) return;
      if (!webcamRef.current || !decoderRef.current) return;

      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return;

      busyRef.current = true;
      try {
        const file = dataUrlToFile(screenshot);
        const text = await decoderRef.current.scanFile(file, false);
        if (text && !resolvedRef.current) {
          resolvedRef.current = true;
          stopScanning();
          setStatus('success');
          handleQRScanned(text);
        }
      } catch {
        // No QR in frame — keep polling
      } finally {
        busyRef.current = false;
      }
    }, SCAN_INTERVAL_MS);
  }, [stopScanning]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserMedia      = useCallback(() => startScanning(), [startScanning]);
  const handleUserMediaError = useCallback(() => setStatus('denied'), []);

  // Dev bypass: navigate directly with a mock token
  const devMockScan = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopScanning();
    setStatus('success');
    navigate('/student/verify', { state: { qr_token: 'dev-mock-token-123' } });
  }, [navigate, stopScanning]);

  const handleRetry = useCallback(() => {
    resolvedRef.current = false;
    setError('');
    setStatus('loading');
  }, []);

  async function handleNotifyInstructor() {
    if (!selectedReason) return;
    setNotifyLoading(true);
    setNotifyError('');
    try {
      await api.post('/attendance/notify-instructor', { reason: selectedReason, qr_token: scannedToken });
      setNotifySuccess(true);
    } catch {
      setNotifyError('Could not send notification. Please try again.');
    } finally {
      setNotifyLoading(false);
    }
  }

  function closeReport() {
    setReportOpen(false);
    setSelectedReason(null);
    setNotifySuccess(false);
    setNotifyError('');
  }

  const scanning = status === 'scanning' || status === 'loading';
  const failed   = status === 'denied'   || status === 'timeout';
  const vfSize   = 'min(270px, 80vw)';

  return (
    <div style={{ background: t.bg, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`@keyframes qr-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {/* ── Header ── */}
      <header style={{
        background: t.hdr, borderBottom: `1px solid ${t.bdr}`,
        display: 'flex', alignItems: 'center', padding: '14px 18px', flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate('/student/dashboard')} aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <BackArrowIcon color={t.txt} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 800, color: t.txt, margin: 0, letterSpacing: -0.3 }}>
          Scan QR Code
        </h1>
        <div style={{ width: 40 }} />
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 20 }}>

        {/* ══ SCANNING STATE ══ */}
        {scanning && (
          <>
            <p style={{ fontSize: 13, color: t.txtL, textAlign: 'center', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Point your camera at the QR code displayed on the projector screen
            </p>

            {/* Viewfinder */}
            <div style={{ position: 'relative', width: vfSize, height: vfSize }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 20, background: '#060412', overflow: 'hidden', position: 'relative' }}>
                <Webcam
                  ref={webcamRef} audio={false}
                  screenshotFormat="image/jpeg" screenshotQuality={0.85}
                  videoConstraints={{ facingMode: 'environment' }}
                  onUserMedia={handleUserMedia} onUserMediaError={handleUserMediaError}
                  mirrored={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
                  backgroundImage: ['linear-gradient(#fff 1px,transparent 1px)', 'linear-gradient(90deg,#fff 1px,transparent 1px)'].join(','),
                  backgroundSize: '26px 26px',
                }} />
                {status === 'scanning' && (
                  <div aria-hidden="true" style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg,transparent,#e11d48,#fb7185,#e11d48,transparent)',
                    boxShadow: '0 0 12px rgba(244,63,94,.6)',
                    top: `${scanPos}%`, transition: 'top .018s linear', pointerEvents: 'none',
                  }} />
                )}
              </div>
              {[
                { top: 0,    left: 0,    borderTop: `3px solid ${t.pri}`,    borderLeft:   `3px solid ${t.pri}`, borderRadius: '12px 0 0 0'  },
                { top: 0,    right: 0,   borderTop: `3px solid ${t.pri}`,    borderRight:  `3px solid ${t.pri}`, borderRadius: '0 12px 0 0'  },
                { bottom: 0, left: 0,    borderBottom: `3px solid ${t.pri}`, borderLeft:   `3px solid ${t.pri}`, borderRadius: '0 0 0 12px' },
                { bottom: 0, right: 0,   borderBottom: `3px solid ${t.pri}`, borderRight:  `3px solid ${t.pri}`, borderRadius: '0 0 12px 0' },
              ].map((s, i) => (
                <div key={i} aria-hidden="true" style={{ position: 'absolute', width: 26, height: 26, pointerEvents: 'none', ...s }} />
              ))}
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: t.acc, animation: 'qr-pulse 1.4s infinite' }} />
              <span style={{ fontSize: 12, color: t.txtL }}>Searching for QR code...</span>
            </div>

            {/* Having trouble? */}
            <button type="button" onClick={() => setReportOpen(true)} style={{
              background: t.priLL, border: `1.5px solid ${t.priL}`, borderRadius: 12,
              padding: '9px 18px', fontSize: 13, fontWeight: 700, color: t.pri,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Having trouble?
            </button>

            {/* Dev bypass */}
            {import.meta.env.DEV && (
              <button type="button" onClick={devMockScan} style={{
                background: t.card, border: `1.5px solid ${t.bdr}`, borderRadius: 10,
                padding: '8px 16px', fontSize: 12, fontWeight: 700, color: t.txtL,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <BeakerIcon color={t.txtL} />
                Dev: Mock Scan
              </button>
            )}
          </>
        )}

        {/* ══ SUCCESS STATE ══ */}
        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: t.okL, border: '3px solid rgba(5,150,105,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckLgIcon color={t.ok} />
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: t.txt, margin: '0 0 6px', letterSpacing: -0.3 }}>QR Code Scanned</h2>
              <p style={{ fontSize: 13, color: t.txtL, margin: 0 }}>Proceeding to face verification…</p>
            </div>
          </div>
        )}

        {/* ══ FAILED STATE ══ */}
        {failed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: t.accL, border: `3px solid ${t.accLL}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningCircleIcon color={t.acc} />
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: t.txt, margin: '0 0 6px', letterSpacing: -0.3 }}>
                {error ? 'Scan Failed' : 'QR Scan Failed'}
              </h2>
              <p style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, margin: 0 }}>
                {error || "We couldn't detect a QR code. Try the tips below."}
              </p>
            </div>
            <div style={{ background: t.accL, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.accLL}`, width: '100%', textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: t.acc, margin: '0 0 6px' }}>Why might this happen?</p>
              {['QR code may be too far or not clearly visible', 'Poor lighting conditions in the room', 'Camera access was denied or unavailable'].map((r) => (
                <p key={r} style={{ fontSize: 12, color: t.txtL, margin: '0 0 4px', lineHeight: 1.5 }}>· {r}</p>
              ))}
            </div>
            <button type="button" onClick={() => setReportOpen(true)} style={{
              width: '100%', background: 'linear-gradient(135deg,#047857,#059669)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '13px 16px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 6px 18px rgba(5,150,105,.3)',
            }}>
              Notify Instructor
            </button>
            <button type="button" onClick={handleRetry} style={{
              width: '100%', padding: 12, borderRadius: 12,
              border: `1.5px solid ${t.bdr}`, background: t.card,
              fontSize: 13, fontWeight: 700, color: t.txtL,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Try Again
            </button>
          </div>
        )}

        <div id="qr-decode-worker" aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', top: 0, width: 1, height: 1, overflow: 'hidden' }} />
      </div>

      {/* ══ REPORT MODAL ══ */}
      {reportOpen && (
        <div
          onClick={closeReport}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.card, borderRadius: '20px 20px 0 0',
              padding: '20px 18px 32px', width: '100%', maxWidth: 430,
              boxShadow: '0 -8px 32px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: t.bdr, margin: '0 auto 18px' }} />

            {notifySuccess ? (
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: t.okL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                    stroke={t.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.txt, margin: '0 0 8px' }}>Instructor Notified</p>
                <p style={{ fontSize: 13, color: t.txtL, lineHeight: 1.5, margin: '0 0 20px' }}>
                  Your instructor has been notified. They will mark your attendance manually.
                </p>
                <button type="button" onClick={closeReport} style={{
                  width: '100%', padding: 12, borderRadius: 12,
                  border: `1.5px solid ${t.bdr}`, background: t.bg,
                  fontSize: 13, fontWeight: 700, color: t.txt,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: t.txt, margin: '0 0 16px', letterSpacing: -0.3 }}>
                  Report an Issue
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {REPORT_REASONS.map((r) => {
                    const selected = selectedReason === r.id;
                    return (
                      <button key={r.id} type="button" onClick={() => setSelectedReason(r.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 14px', borderRadius: 13, cursor: 'pointer',
                        background: selected ? t.priLL : t.bg,
                        border: `1.5px solid ${selected ? t.pri : t.bdr}`,
                        fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
                        transition: 'border-color .15s, background .15s',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: selected ? t.pri : t.bdr,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          transition: 'background .15s',
                        }}>
                          {r.icon(selected ? '#fff' : t.txtL)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: selected ? t.pri : t.txt }}>
                          {r.label}
                        </span>
                        {selected && (
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                            stroke={t.pri} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {notifyError && (
                  <p style={{ fontSize: 12, color: t.acc, marginBottom: 10, textAlign: 'center' }}>{notifyError}</p>
                )}

                <button type="button"
                  onClick={handleNotifyInstructor}
                  disabled={!selectedReason || notifyLoading}
                  style={{
                    width: '100%', background: selectedReason ? 'linear-gradient(135deg,#047857,#059669)' : t.bdr,
                    color: '#fff', border: 'none', borderRadius: 13,
                    padding: '13px 16px', fontSize: 14, fontWeight: 700,
                    cursor: selectedReason && !notifyLoading ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: selectedReason ? '0 6px 18px rgba(5,150,105,.3)' : 'none',
                    marginBottom: 10, opacity: notifyLoading ? 0.7 : 1,
                    transition: 'background .2s, box-shadow .2s',
                  }}>
                  {notifyLoading ? 'Sending…' : 'Notify Instructor'}
                </button>

                <button type="button" onClick={closeReport} style={{
                  width: '100%', padding: 12, borderRadius: 12,
                  border: `1.5px solid ${t.bdr}`, background: 'none',
                  fontSize: 13, fontWeight: 700, color: t.txtL,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SVG icons ── */

function BackArrowIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckLgIcon({ color }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function WarningCircleIcon({ color }) {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4" /><path d="M12 16h.01" />
      <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
    </svg>
  );
}

function BeakerIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v11l4 7H5l4-7V3z" /><line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  );
}