import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { mockSession } from '../../data/mockData';
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
  const [scanPos, setScanPos] = useState(0);

  // Init the decoder once (needs a real DOM node, even if off-screen)
  useEffect(() => {
    decoderRef.current = new Html5Qrcode('qr-decode-worker');
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Animate the scan line via state — 0% → 100%, reset on loop
  useEffect(() => {
    if (status !== 'scanning') { setScanPos(0); return; }
    const id = setInterval(() => {
      setScanPos(p => (p >= 100 ? 0 : p + 0.6));
    }, 18);
    return () => clearInterval(id);
  }, [status]);

  const stopScanning = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  }, []);

  const startScanning = useCallback(() => {
    if (resolvedRef.current) return;
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

  const handleRetry = useCallback(() => {
    resolvedRef.current = false;
    setStatus('loading');
  }, []);

  const scanning = status === 'scanning' || status === 'loading';
  const failed   = status === 'denied'   || status === 'timeout';

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

        {/* ══ SCANNING STATE ══ */}
        {scanning && (
          <>
            <p className="qrscan-subtitle">
              Point your camera at the QR code displayed on the projector screen
            </p>

            {/* Viewfinder: outer positions corners, inner clips webcam */}
            <div className="qrscan-viewfinder-outer">
              <div className="qrscan-viewfinder-inner">
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
                {/* Subtle grid overlay */}
                <div className="qrscan-grid" aria-hidden="true" />
                {/* Scan line animated via state */}
                {status === 'scanning' && (
                  <div
                    className="qrscan-scan-line"
                    style={{ top: `${scanPos}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              {/* Corner brackets outside inner div so they aren't clipped */}
              <span className="qrscan-corner qrscan-corner-tl" aria-hidden="true" />
              <span className="qrscan-corner qrscan-corner-tr" aria-hidden="true" />
              <span className="qrscan-corner qrscan-corner-bl" aria-hidden="true" />
              <span className="qrscan-corner qrscan-corner-br" aria-hidden="true" />
            </div>

            {/* Pulsing indicator row */}
            <div className="qrscan-searching">
              <span className="qrscan-pulse-dot" aria-hidden="true" />
              <span className="qrscan-hint">Searching for QR code...</span>
            </div>

            {/* Dev-only test trigger */}
            {import.meta.env.DEV && (
              <button type="button" className="qrscan-test-btn" onClick={simulateScan}>
                <BeakerIcon />
                Test Scan
              </button>
            )}
          </>
        )}

        {/* ══ SUCCESS STATE ══ */}
        {status === 'success' && (
          <div className="qrscan-result">
            <div className="qrscan-result-circle qrscan-result-circle-success">
              <CheckLgIcon />
            </div>
            <h2 className="qrscan-result-title">QR Code Scanned</h2>
            <p className="qrscan-result-sub">Session · {token}</p>

            <div className="qrscan-info-card">
              <div className="qrscan-info-row">
                <span className="qrscan-info-label">Course</span>
                <span className="qrscan-info-value">{mockSession.courseName}</span>
              </div>
              <div className="qrscan-info-divider" />
              <div className="qrscan-info-row">
                <span className="qrscan-info-label">Location</span>
                <span className="qrscan-info-value">{mockSession.location}</span>
              </div>
              <div className="qrscan-info-divider" />
              <div className="qrscan-info-row">
                <span className="qrscan-info-label">Time</span>
                <span className="qrscan-info-value">{mockSession.time}</span>
              </div>
            </div>

            <button
              type="button"
              className="qrscan-continue-btn"
              onClick={() => navigate('/student/verify')}
            >
              Continue to Face Verify
            </button>
          </div>
        )}

        {/* ══ FAILED STATE (denied | timeout) ══ */}
        {failed && (
          <div className="qrscan-result">
            <div className="qrscan-result-circle qrscan-result-circle-fail">
              <WarningLgIcon />
            </div>
            <h2 className="qrscan-result-title">QR Scan Failed</h2>

            <div className="qrscan-fail-box">
              <ul className="qrscan-fail-reasons">
                <li>QR code may be too far or not clearly visible</li>
                <li>Poor lighting conditions in the room</li>
                <li>Camera access was denied or unavailable</li>
              </ul>
            </div>

            <button type="button" className="qrscan-continue-btn">
              Notify Instructor
            </button>
            <button type="button" className="qrscan-retry-btn" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        )}

        {/*
          Hidden anchor required by the Html5Qrcode constructor.
          It is off-screen and invisible; scanFile() does not render into it
          when showImage=false.
        */}
        <div id="qr-decode-worker" className="qrscan-worker" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ── SVG icons ─────────────────────────────────────────────── */

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckLgIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WarningLgIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
