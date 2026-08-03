import React, { useCallback, useEffect, useRef, useState } from "react";

const HISTORY_KEY = "medtrack-scan-history";
const HISTORY_LIMIT = 5;

/** Barcode formats the native BarcodeDetector should accept. */
const SUPPORTED_FORMATS = [
  "qr_code",
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "data_matrix",
];

/**
 * Parses the content of a MedTrack asset tag into a structured result.
 *
 * The backend encodes QR tags as multi-line text:
 *   MedTrack Asset:
 *   ID: <id>
 *   Code: <code>
 *   Name: <name>
 *   SN: <sn>
 *   Dept: <dept>
 *
 * Also tolerates a bare numeric ID, an "EQ-..." code, or any single-line value so
 * third-party labels and barcodes keep working.
 */
export function parseAssetTag(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const idMatch = text.match(/^ID:\s*(.+)$/im);
  const codeMatch = text.match(/^Code:\s*(.+)$/im);
  const nameMatch = text.match(/^Name:\s*(.+)$/im);

  if (idMatch || codeMatch) {
    return {
      id: (idMatch ? idMatch[1] : codeMatch[1]).trim(),
      code: codeMatch ? codeMatch[1].trim() : null,
      name: nameMatch ? nameMatch[1].trim() : null,
      raw: text,
    };
  }

  const singleLine = text.split("\n")[0].trim();
  if (/^EQ-[\w-]+$/i.test(singleLine) || /^\d+$/.test(singleLine)) {
    return { id: singleLine, code: singleLine, name: null, raw: text };
  }

  return { id: text, code: null, name: null, raw: text };
}

/** Reads the persisted last-scanned history. */
export function getScanHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

/** Records a scan into the last-scanned history (most recent first). */
export function addScanHistory(entry) {
  const history = getScanHistory().filter(
    (item) => String(item.id) !== String(entry.id)
  );
  history.unshift({ ...entry, at: Date.now() });
  const trimmed = history.slice(0, HISTORY_LIMIT);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable (private mode, quota) - history is best-effort only
  }
  return trimmed;
}

/**
 * Camera-based QR / barcode scanner modal.
 *
 * Uses the native BarcodeDetector API (Chromium-based browsers: Chrome, Edge,
 * Android Chrome) with zero external dependencies. Where BarcodeDetector or a
 * camera is unavailable, the modal falls back to manual ID entry and the
 * last-scanned history, so the flow always works.
 *
 * @param {boolean}  open     whether the modal is visible
 * @param {Function} onClose  called when the user dismisses the modal
 * @param {Function} onScan   called with the parsed result ({id, code, name, raw})
 * @param {string}   title    modal heading, defaults to "Scan Asset Tag"
 */
export default function QrScannerModal({ open, onClose, onScan, title }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [detectorSupported] = useState(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  });
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleResult = useCallback(
    (result) => {
      if (!result || firedRef.current) return;
      firedRef.current = true;
      const parsed = parseAssetTag(result);
      if (parsed) {
        addScanHistory({ id: parsed.id, name: parsed.name });
        onScan(parsed);
      }
    },
    [onScan]
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || firedRef.current || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    detector
      .detect(video)
      .then((codes) => {
        if (codes && codes.length > 0 && codes[0].rawValue) {
          handleResult(codes[0].rawValue);
          return;
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
  }, [handleResult]);

  useEffect(() => {
    setHistory(getScanHistory());
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    firedRef.current = false;
    setCameraError(null);
    setScanning(false);

    if (!detectorSupported) {
      setCameraError(
        "Live camera scanning is not supported in this browser. Use the manual ID entry below instead."
      );
      return undefined;
    }

    let cancelled = false;

    const start = async () => {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: SUPPORTED_FORMATS,
        });
      } catch (err) {
        console.error("BarcodeDetector init failed:", err);
        detectorRef.current = null;
      }
      if (!detectorRef.current) {
        if (!cancelled) {
          setCameraError(
            "Camera scanning is unavailable in this browser. Use the manual ID entry below instead."
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setScanning(true);
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error("Camera start failed:", err);
        if (!cancelled) {
          setCameraError(
            "Camera is unavailable or permission was denied. Use the manual ID entry below instead."
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopCamera();
      detectorRef.current = null;
    };
  }, [open, detectorSupported, scanFrame, stopCamera]);

  if (!open) return null;

  const submitManual = (e) => {
    e.preventDefault();
    const value = manualId.trim();
    if (!value) {
      setManualError("Enter an asset ID, e.g. EQ-001 or 12.");
      return;
    }
    setManualError(null);
    const parsed = parseAssetTag(value);
    addScanHistory({ id: parsed.id, name: parsed.name });
    onScan(parsed);
  };

  const reuseHistory = (entry) => {
    onScan({ id: entry.id, name: entry.name, raw: entry.id });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-subtle">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-hover text-secondary border-none flex items-center justify-center text-xl font-bold cursor-pointer transition-colors hover:bg-subtle"
          aria-label="Close scanner"
        >
          &times;
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
            📷
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary m-0">
              {title || "Scan Asset Tag"}
            </h2>
            <p className="text-secondary text-sm mt-1">
              Point the camera at the equipment QR tag or barcode.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-h-72 w-full flex items-center justify-center">
            {detectorSupported && !cameraError && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}
            {!scanning && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                <div className="inline-block w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-xs font-semibold">Starting camera...</p>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="text-3xl">📵</span>
                <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
              </div>
            )}
          </div>

          <form onSubmit={submitManual} className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Or enter asset ID manually (e.g. EQ-001)"
              className="flex-1 px-4 py-3 rounded-xl border border-subtle bg-surface text-primary text-sm outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm border-none cursor-pointer shadow-sm"
            >
              Look Up
            </button>
          </form>
          {manualError && (
            <p className="text-red-500 text-xs font-semibold -mt-2">{manualError}</p>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-wider mb-2">
                Last Scanned
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((entry) => (
                  <button
                    key={`${entry.id}-${entry.at}`}
                    onClick={() => reuseHistory(entry)}
                    className="px-3 py-1.5 rounded-full bg-hover hover:bg-subtle border border-subtle text-xs font-bold text-primary cursor-pointer transition-colors"
                  >
                    {entry.name ? `${entry.name} (${entry.id})` : entry.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 text-secondary font-bold hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
