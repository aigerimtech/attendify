import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';

const TIMEOUT_MS = 30_000;
const SCAN_INTERVAL_MS = 600;

function dataUrlToFile(dataUrl, filename = 'frame.jpg') {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// Decode JWT payload without a library — backend QR tokens are JWTs
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
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
  const [token,   setToken]   = useState('');
  const [session, setSession] = useState(null);
  const [scanPos, setScanPos] = useState(5);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    decoderRef.current = new Html5Qrcode('qr-decode-worker');
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Animate scan line
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

  // After a successful scan: decode the JWT to get session_id,
  // then fetch session details from the backend
  const onScanSuccess = useCallback(async (scannedToken) => {
    resolvedRef.current = true;
    stopScanning();
    setToken(scannedToken);
    setStatus('success');

    // Store token for FaceVerify
    localStorage.setItem('qrToken', scannedToken);

    // Decode session_id from JWT payload
    const payload = decodeJwtPayload(scannedToken);
    const sessionId = payload?.session_id ?? payload?.sub ?? null;

    if (sessionId) {
      try {
        const data = await api.get(`/sessions/${sessionId}`);
        setSession(data);
      } catch {
        // non-fatal — details card just won't populate
      }
    }

    setTimeout(() => navigate('/student/verify', { state: { token: scannedToken, session } }), 1500);
  }, [navigate, stopScanning, session]);

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
        if (text && !resolvedRef.current) await onScanSuccess(text);
      } catch {
        // no QR in frame — normal
      } finally {
        busyRef.current = false;
      }
    }, SCAN_INTERVAL_MS);
  }, [onScanSuccess, stopScanning]);

  const handleUserMedia = useCallback(() => { startScanning(); }, [startScanning]);
  const handleUserMediaError = useCallback(() => { setStatus('denied'); }, []);

  const simulateScan = useCallback(async () => {
    if (resolvedRef.current) return;
    await onScanSuccess('SESSION-TEST-123');
  }, [onScanSuccess]);

  const handleRetry = useCallback(() => {
    resolvedRef.current = false;
    setStatus('loading');
  }, []);

  const handleNotifyInstructor = async () => {
    const payload = decodeJwtPayload(token);
    const sessionId = payload?.session_id ?? payload?.sub ?? null;
    if (!sessionId) return;
    setNotifying(true);
    try {
      await api.post('/attendance/notify-instructor', { session_id: sessionId, reason: 'qr_failed' });
    } catch {
      // best-effort
    } finally {
      setNotifying(false);
    }
  };

  const scanning = status === 'scanning' || status === 'loading';
  const failed   = status === 'denied'   || status === 'timeout';
  const vfSize   = 'min(270px, 80vw)';

  return (
    <div style={{ background: t.bg, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`@keyframes qr-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {/* Header */}
      <header style={{ background: t.hdr, borderBottom: `1px solid ${t.bdr}`, display: 'flex', alignItems: 'center', padding: '14px 18px', flexShrink: 0 }}>
        <button type="button" onClick={() => navigate('/student/dashboard')} aria-label="Back to dashboard" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <BackArrowIcon color={t.txt} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 800, color: t.txt, margin: 0, letterSpacing: -0.3 }}>Scan QR Code</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 20 }}>

        {/* Scanning state */}
        {scanning && (
          <>
            <p style={{ fontSize: 13, color: t.txtL, textAlign: 'center', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Point your camera at the QR code displayed on the projector screen
            </p>
            <div style={{ position: 'relative', width: vfSize, height: vfSize }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 20, background: '#060412', overflow: 'hidden', position: 'relative' }}>
                <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" screenshotQuality={0.85} videoConstraints={{ facingMode: 'environment' }} onUserMedia={handleUserMedia} onUserMediaError={handleUserMediaError} mirrored={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: ['linear-gradient(#fff 1px, transparent 1px)', 'linear-gradient(90deg, #fff 1px, transparent 1px)'].join(','), backgroundSize: '26px 26px' }} />
                {status === 'scanning' && (
                  <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#e11d48,#fb7185,#e11d48,transparent)', boxShadow: '0 0 12px rgba(244,63,94,.6)', top: `${scanPos}%`, transition: 'top .018s linear', pointerEvents: 'none' }} />
                )}
              </div>
              {[
                { top: 0, left: 0,     borderTop: `3px solid ${t.pri}`, borderLeft:   `3px solid ${t.pri}`, borderRadius: '12px 0 0 0'  },
                { top: 0, right: 0,    borderTop: `3px solid ${t.pri}`, borderRight:  `3px solid ${t.pri}`, borderRadius: '0 12px 0 0'  },
                { bottom: 0, left: 0,  borderBottom: `3px solid ${t.pri}`, borderLeft: `3px solid ${t.pri}`, borderRadius: '0 0 0 12px' },
                { bottom: 0, right: 0, borderBottom: `3px solid ${t.pri}`, borderRight:`3px solid ${t.pri}`, borderRadius: '0 0 12px 0' },
              ].map((s, i) => <div key={i} aria-hidden="true" style={{ position: 'absolute', width: 26, height: 26, pointerEvents: 'none', ...s }} />)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: t.acc, animation: 'qr-pulse 1.4s infinite' }} />
              <span style={{ fontSize: 12, color: t.txtL }}>Searching for QR code…</span>
            </div>
            {import.meta.env.DEV && (
              <button type="button" onClick={simulateScan} style={{ background: t.card, border: `1.5px solid ${t.bdr}`, borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: t.txtL, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                <BeakerIcon color={t.txtL} /> Test Scan
              </button>
            )}
          </>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: t.okL, border: '3px solid rgba(5,150,105,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckLgIcon color={t.ok} />
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: t.txt, margin: '0 0 6px', letterSpacing: -0.3 }}>QR Code Scanned</h2>
              <p style={{ fontSize: 13, color: t.txtL, margin: 0 }}>{session ? `${session.course_code ?? ''} · Session #${session.id}` : `Token: ${token.slice(0, 16)}…`}</p>
            </div>
            {session && (
              <div style={{ background: t.card, borderRadius: 16, padding: 16, border: `1px solid ${t.bdr}`, width: '100%' }}>
                {[
                  { label: 'Course',   value: session.course_name ?? session.course_code ?? '—' },
                  { label: 'Status',   value: session.status ?? '—' },
                  { label: 'Started',  value: session.started_at ? new Date(session.started_at).toLocaleTimeString() : '—' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                      <span style={{ fontSize: 13, color: t.txtL }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.txt }}>{value}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: t.bdr }} />}
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => navigate('/student/verify', { state: { token, session } })} style={{ width: '100%', background: 'linear-gradient(135deg,#047857,#059669)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 18px rgba(5,150,105,.3)' }}>
              Continue to Face Verify
            </button>
            <button type="button" onClick={handleRetry} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: t.txtL, fontFamily: "'DM Sans', sans-serif", padding: '4px 8px' }}>Scan again</button>
          </div>
        )}

        {/* Failed state */}
        {failed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: t.accL, border: `3px solid ${t.accLL}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningCircleIcon color={t.acc} />
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: t.txt, margin: '0 0 6px', letterSpacing: -0.3 }}>QR Scan Failed</h2>
              <p style={{ fontSize: 13, color: t.txtL, lineHeight: 1.6, margin: 0 }}>We couldn't detect a QR code. Try the tips below.</p>
            </div>
            <div style={{ background: t.accL, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.accLL}`, width: '100%', textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: t.acc, margin: '0 0 6px' }}>Why might this happen?</p>
              {['QR code may be too far or not clearly visible', 'Poor lighting conditions in the room', 'Camera access was denied or unavailable'].map((reason) => (
                <p key={reason} style={{ fontSize: 12, color: t.txtL, margin: '0 0 4px', lineHeight: 1.5 }}>· {reason}</p>
              ))}
            </div>
            <button type="button" onClick={handleNotifyInstructor} disabled={notifying} style={{ width: '100%', background: 'linear-gradient(135deg,#047857,#059669)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 18px rgba(5,150,105,.3)' }}>
              {notifying ? 'Notifying…' : 'Notify Instructor'}
            </button>
            <button type="button" onClick={handleRetry} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${t.bdr}`, background: t.card, fontSize: 13, fontWeight: 700, color: t.txtL, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Try Again</button>
          </div>
        )}

        <div id="qr-decode-worker" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: 1, height: 1, overflow: 'hidden' }} />
      </div>
    </div>
  );
}

function BackArrowIcon({ color }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function CheckLgIcon({ color }) {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
}
function WarningCircleIcon({ color }) {
  return <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4" /><path d="M12 16h.01" /><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>;
}
function BeakerIcon({ color }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v11l4 7H5l4-7V3z" /><line x1="9" y1="9" x2="15" y2="9" /></svg>;
}
