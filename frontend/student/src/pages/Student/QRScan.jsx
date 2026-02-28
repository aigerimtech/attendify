import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScan.css';

const TIMEOUT_MS = 30_000;
const SCAN_INTERVAL_MS = 600;

/** Convert a base64 data-URL to a File without fetch() */
function dataUrlToFile(dataUrl, filename = 'frame.jpg') {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export default function QRScan() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const decoderRef = useRef(null);    // Html5Qrcode instance
  const intervalRef = useRef(null);   // scan polling interval
  const timerRef = useRef(null);      // 30-second timeout
  const busyRef = useRef(false);      // prevent overlapping scan calls
  const resolvedRef = useRef(false);  // prevent double-resolve

  const [status, setStatus] = useState('loading'); // loading|scanning|success|denied|timeout
  const [token, setToken] = useState('');

  // Init the decoder once (needs a real DOM node, even if off-screen)
  useEffect(() => {
    decoderRef.current = new Html5Qrcode('qr-decode-worker');
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  const stopScanning = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  }, []);

  const startScanning = useCallback(() => {
    if (resolvedRef.current) return; // simulateScan may have fired before camera was ready
    setStatus('scanning');

    // Hard 30-second cutoff
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
        const text = await decoderRef.current.scanFile(file, /* showImage= */ false);

        if (text && !resolvedRef.current) {
          resolvedRef.current = true;
          stopScanning();
          setToken(text);
          setStatus('success');
          setTimeout(() => navigate('/student/verify'), 1500);
        }
      } catch {
        // No QR in this frame — normal, keep polling
      } finally {
        busyRef.current = false;
      }
    }, SCAN_INTERVAL_MS);
  }, [navigate, stopScanning]);

  const handleUserMedia = useCallback(() => {
    startScanning();
  }, [startScanning]);

  const handleUserMediaError = useCallback(() => {
    setStatus('denied');
  }, []);

  const simulateScan = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopScanning();
    setToken('SESSION-TEST-123');
    setStatus('success');
    setTimeout(() => navigate('/student/verify'), 1500);
  }, [navigate, stopScanning]);

  const scanning = status === 'scanning' || status === 'loading';

  return (
    <div className="qrscan-root">
      {/* ── Header ── */}
      <header className="qrscan-header">
        <button
          type="button"
          className="qrscan-back"
          onClick={() => navigate('/student/dashboard')}
          aria-label="Back to dashboard"
        >
          <BackArrowIcon />
        </button>
        <h1 className="qrscan-title">Scan QR Code</h1>
        {/* Spacer balances the back button so title is centred */}
        <div className="qrscan-header-spacer" />
      </header>

      <div className="qrscan-body">
        {/* ── Subtitle ── */}
        <p className="qrscan-subtitle">
          Point your camera at the QR code displayed on the projector screen
        </p>

        {/* ── Viewfinder ── */}
        <div className="qrscan-viewfinder-wrap">
          {/* Camera feed via react-webcam — full UI control, no library DOM interference */}
          {status !== 'denied' && (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.85}
              videoConstraints={{ facingMode: 'environment' }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="qrscan-webcam"
              mirrored={false}
            />
          )}

          {/* Blue corner brackets + animated scan line */}
          {scanning && (
            <div className="qrscan-overlay" aria-hidden="true">
              <span className="qrscan-corner qrscan-corner-tl" />
              <span className="qrscan-corner qrscan-corner-tr" />
              <span className="qrscan-corner qrscan-corner-bl" />
              <span className="qrscan-corner qrscan-corner-br" />
              {status === 'scanning' && <span className="qrscan-scan-line" />}
            </div>
          )}

          {/* Success check overlay */}
          {status === 'success' && (
            <div className="qrscan-success-overlay" aria-hidden="true">
              <SuccessCircleIcon />
            </div>
          )}

          {/* Camera-denied placeholder keeps the square visible */}
          {status === 'denied' && (
            <div className="qrscan-denied-placeholder" aria-hidden="true">
              <CameraOffIcon />
            </div>
          )}
        </div>

        {/* ── Dev-only test button ── */}
        {import.meta.env.DEV && status !== 'success' && (
          <button type="button" className="qrscan-test-btn" onClick={simulateScan}>
            <BeakerIcon />
            Test Scan
          </button>
        )}

        {/*
          Hidden anchor required by the Html5Qrcode constructor.
          It is off-screen and invisible; scanFile() does not render into it
          when showImage=false.
        */}
        <div id="qr-decode-worker" className="qrscan-worker" aria-hidden="true" />

        {/* ── Status banners ── */}
        {status === 'success' && (
          <div className="qrscan-banner qrscan-banner-success" role="status">
            <CheckIcon />
            <div>
              <p className="qrscan-banner-title">QR Code Detected!</p>
              <p className="qrscan-banner-token">{token}</p>
            </div>
          </div>
        )}

        {status === 'denied' && (
          <div className="qrscan-banner qrscan-banner-error" role="alert">
            <CameraOffIcon size={20} />
            <p>Camera access denied. Please allow camera access in your browser settings.</p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="qrscan-banner qrscan-banner-warning" role="alert">
            <WarningIcon />
            <p>No QR code found. Make sure the QR code is clearly visible.</p>
          </div>
        )}

        {status === 'scanning' && (
          <p className="qrscan-hint">Searching for QR code…</p>
        )}
      </div>
    </div>
  );
}

/* ── SVG icons ─────────────────────────────────────────── */

function BackArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SuccessCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
      stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function CameraOffIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2.5" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function BeakerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v11l4 7H5l4-7V3z" />
      <line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
