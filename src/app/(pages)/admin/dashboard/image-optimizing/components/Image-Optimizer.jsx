"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import JSZip from "jszip";

/* =============================
   Lightweight helpers
============================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, p) => (p > 0 ? String(n).padStart(p, "0") : String(n));
const KB = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const k = bytes / 1024;
  if (k < 1024) return `${k.toFixed(1)} KB`;
  return `${(k / 1024).toFixed(2)} MB`;
};

/* =============================
   MAIN COMPONENT
============================= */
export default function ImageOptimizer() {
  /* ---------- Core state ---------- */
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    processing: false,
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [batchComplete, setBatchComplete] = useState(false);
  const [showProcessingCenter, setShowProcessingCenter] = useState(false);

  // Ten “virtual servers” (single route handles them)
  const [apiEndpoints, setApiEndpoints] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      url: `/api/image/optimize/${i + 1}`,
      available: true,
      busy: false,
    }))
  );
  const apiEndpointsRef = useRef(apiEndpoints);
  useEffect(() => {
    apiEndpointsRef.current = apiEndpoints;
  }, [apiEndpoints]);

  /* ---------- Defaults (NO LOSSLESS) ---------- */
  const defaultSettings = {
    quality: 80,
    format: "original",
    width: "",
    height: "",
    maintainAspect: true,
    effort: 6,
  };

  /* ---------- Presets (exactly as requested) ---------- */
  const presets = [
    {
      id: "web",
      name: "Web Optimized",
      settings: { quality: 50, format: "webp", effort: 6 },
    },
    {
      id: "bank",
      name: "Bank Images",
      settings: { quality: 20, format: "avif", effort: 6 },
    },
    {
      id: "course",
      name: "Course Images",
      settings: { quality: 30, format: "avif", effort: 6 },
    },
  ];

  /* ---------- Viewer state ---------- */
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [scale, setScale] = useState(1); // zoom (5% per tick)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [canvasBg, setCanvasBg] = useState("dim"); // "dark" | "dim"

  // Pan/Grid controls visibility (toggle-able)
  const [showPanCtrl, setShowPanCtrl] = useState(true);
  const [showGridCtrl, setShowGridCtrl] = useState(true);
  const [showGrid, setShowGrid] = useState(false); // overlay itself

  /* ---------- ZIP naming ---------- */
  const [zipPattern, setZipPattern] = useState("base");
  const [zipStartIndex, setZipStartIndex] = useState(1);
  const [zipPad, setZipPad] = useState(0);

  /* ---------- Refs ---------- */
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const imageQueueRef = useRef([]);
  const processingRef = useRef(false);

  // in-flight fetches per image (so auto-optimizes cancel old ones)
  const inflightAutoRef = useRef(new Map()); // imageId -> AbortController

  // settings live store (no rerenders while typing)
  const settingsRef = useRef(new Map()); // id -> settings

  // Predicted labels
  const hudPredictedRef = useRef(null);

  // Per-image auto-optimise timers
  const autoTimersRef = useRef(new Map());
  const AUTO_DEBOUNCE_MS = 1000;

  // Complexity cache per image (0..1)
  const complexityRef = useRef(new Map());

  /* ---------- Current image helpers ---------- */
  const currentImage = images.find((img) => img.id === selectedImage) || null;
  const getSettings = (id) =>
    settingsRef.current.get(id) || { ...defaultSettings };

  /* ---------- Format helpers ---------- */
  const getOriginalExt = (image) => {
    if (!image?.file?.name) return "jpeg";
    const n = image.file.name.toLowerCase();
    const dot = n.lastIndexOf(".");
    if (dot === -1) return "jpeg";
    const ext = n.slice(dot + 1);
    if (ext === "jpg") return "jpg";
    if (ext === "jpeg") return "jpeg";
    if (ext === "png") return "png";
    if (ext === "webp") return "webp";
    if (ext === "avif") return "avif";
    return ext || "jpeg";
  };
  const uiFormatToApiFormat = (fmt, image) => {
    if (fmt === "original") {
      const ext = getOriginalExt(image);
      return ext === "jpg" ? "jpeg" : ext;
    }
    if (fmt === "jpg") return "jpeg";
    return fmt;
  };
  const finalDownloadExt = (img, s) => {
    if (img.processedFormat)
      return img.processedFormat === "jpeg" ? "jpg" : img.processedFormat;
    const fmt = s.format;
    if (fmt === "original") return getOriginalExt(img);
    return fmt === "jpeg" ? "jpg" : fmt;
  };

  /* ---------- Content complexity (cheap 32x32 pass) ---------- */
  async function computeComplexity(file) {
    try {
      const bmp = await createImageBitmap(file);
      const S = 32;
      const useOff = typeof OffscreenCanvas !== "undefined";
      const c = useOff
        ? new OffscreenCanvas(S, S)
        : document.createElement("canvas");
      if (!useOff) {
        c.width = S;
        c.height = S;
      }
      const ctx = c.getContext("2d", { willReadFrequently: false });
      const r = Math.min(S / bmp.width, S / bmp.height, 1);
      const dw = Math.max(1, Math.round(bmp.width * r));
      const dh = Math.max(1, Math.round(bmp.height * r));
      const dx = Math.floor((S - dw) / 2);
      const dy = Math.floor((S - dh) / 2);
      ctx.clearRect(0, 0, S, S);
      ctx.drawImage(bmp, dx, dy, dw, dh);
      const data = ctx.getImageData(0, 0, S, S).data;

      const L = new Float32Array(S * S);
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        L[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      let grad = 0,
        count = 0;
      for (let y = 1; y < S - 1; y++) {
        for (let x = 1; x < S - 1; x++) {
          const idx = y * S + x;
          const gx = (L[idx + 1] - L[idx - 1]) * 0.5;
          const gy = (L[idx + S] - L[idx - S]) * 0.5;
          grad += Math.hypot(gx, gy);
          count++;
        }
      }
      return clamp(grad / count / 32, 0, 1);
    } catch {
      return 0.5;
    }
  }

  /* ---------- Estimator (HQ-friendly, no heavy work) ---------- */
  const estimateTargetDims = (image, s) => {
    let w = image.dimensions.width,
      h = image.dimensions.height;
    const wSet = !!s.width && String(s.width).trim() !== "";
    const hSet = !!s.height && String(s.height).trim() !== "";
    if (wSet && hSet) {
      const W = parseInt(s.width, 10),
        H = parseInt(s.height, 10);
      if (s.maintainAspect) {
        const r = Math.min(W / w, H / h);
        w = Math.max(1, Math.floor(w * r));
        h = Math.max(1, Math.floor(h * r));
      } else {
        w = Math.max(1, W);
        h = Math.max(1, H);
      }
    } else if (wSet) {
      const W = parseInt(s.width, 10);
      if (s.maintainAspect) {
        const r = W / w;
        w = Math.max(1, W);
        h = Math.max(1, Math.floor(h * r));
      } else {
        w = Math.max(1, W);
      }
    } else if (hSet) {
      const H = parseInt(s.height, 10);
      if (s.maintainAspect) {
        const r = H / h;
        h = Math.max(1, H);
        w = Math.max(1, Math.floor(w * r));
      } else {
        h = Math.max(1, H);
      }
    }
    return { w, h };
  };

  const estimateBytes = (image, s) => {
    const { w, h } = estimateTargetDims(image, s);
    const px = Math.max(1, w * h);
    let fmt = s.format;
    if (fmt === "original") fmt = getOriginalExt(image);
    if (fmt === "jpg") fmt = "jpeg";
    const q = clamp(parseFloat(s.quality || 80), 1, 100);
    const effort = clamp(parseFloat(s.effort || 6), 1, 10);
    const C = complexityRef.current.get(image.id) ?? 0.5;

    let bpp;
    switch (fmt) {
      case "avif":
        bpp =
          0.34 *
          Math.pow(q / 70, 1.25) *
          (0.85 + 0.6 * C) *
          (1 - (effort - 6) * 0.012);
        break;
      case "webp":
        bpp =
          0.52 *
          Math.pow(q / 75, 1.18) *
          (0.9 + 0.5 * C) *
          (1 - (effort - 6) * 0.01);
        break;
      case "jpeg":
        bpp = 0.78 * Math.pow(q / 80, 1.08) * (0.92 + 0.45 * C);
        break;
      case "png":
        bpp = (2.1 - (effort - 6) * 0.05) * (0.8 + 0.35 * C);
        break;
      default:
        bpp = 0.9 * (0.85 + 0.45 * C);
        break;
    }
    if (q >= 90) {
      const hqBoost = 1 + 0.35 * ((q - 90) / 10) * (0.6 + 0.4 * C);
      bpp *= hqBoost;
    }

    bpp = clamp(bpp, 0.06, 5);
    return Math.max(300, Math.round((px * bpp) / 8));
  };

  const refreshEstForCurrent = () => {
    if (!currentImage) return;
    const s = getSettings(currentImage.id);
    const bytes = estimateBytes(currentImage, s);
    const txt = KB(bytes);
    if (hudPredictedRef.current) hudPredictedRef.current.textContent = txt;
  };

  /* ---------- Commit w/ single rerender ---------- */
  const commitImageSettings = useCallback((id) => {
    const s = settingsRef.current.get(id);
    if (!s) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, settings: { ...s }, _lastUpdate: Date.now() }
          : img
      )
    );
  }, []);
  const commitAllSettings = useCallback(() => {
    setImages((prev) =>
      prev.map((img) => {
        const s = settingsRef.current.get(img.id);
        return s
          ? { ...img, settings: { ...s }, _lastUpdate: Date.now() }
          : img;
      })
    );
  }, []);

  /* ---------- API ---------- */
  const updateEndpointStatus = useCallback((url, busy) => {
    setApiEndpoints((prev) =>
      prev.map((e) => (e.url === url ? { ...e, busy } : e))
    );
  }, []);
  const getAvailableEndpoint = () => {
    const eps = apiEndpointsRef.current || [];
    for (const e of eps) if (e.available && !e.busy) return e.url;
    return null;
  };

  const processImage = useCallback(
    async (image, endpointUrl, { isAuto = false } = {}) => {
      // Abort previous AUTO call for this image
      if (isAuto) {
        const prev = inflightAutoRef.current.get(image.id);
        if (prev) {
          try {
            prev.abort();
          } catch {}
        }
      }

      const controller = new AbortController();
      if (isAuto) inflightAutoRef.current.set(image.id, controller);

      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, processing: true, error: null } : img
        )
      );
      updateEndpointStatus(endpointUrl, true);

      try {
        const latest = getSettings(image.id);
        const apiFormat = uiFormatToApiFormat(latest.format, image);
        const settingsForApi = { ...latest, format: apiFormat };
        const fd = new FormData();
        fd.append("image", image.file);
        fd.append("settings", JSON.stringify(settingsForApi));

        const timeout = setTimeout(() => controller.abort(), 60000);
        const res = await fetch(endpointUrl, {
          method: "POST",
          body: fd,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const blob = await res.blob();
        const optimizedUrl = URL.createObjectURL(blob);
        const wH = res.headers.get("X-Image-Width");
        const hH = res.headers.get("X-Image-Height");
        const fH = res.headers.get("X-Image-Format");

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  optimizedUrl,
                  optimizedSize: blob.size,
                  processed: true,
                  processing: false,
                  error: null,
                  processedWidth: wH ? parseInt(wH, 10) : img.dimensions.width,
                  processedHeight: hH
                    ? parseInt(hH, 10)
                    : img.dimensions.height,
                  processedFormat: fH || null,
                }
              : img
          )
        );
        setBatchProgress((p) => ({ ...p, current: p.current + 1 }));
      } catch (err) {
        if (err?.name !== "AbortError") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? {
                    ...img,
                    processing: false,
                    error: String(err.message || err),
                  }
                : img
            )
          );
        }
        setBatchProgress((p) => ({ ...p, current: p.current + 1 }));
      } finally {
        updateEndpointStatus(endpointUrl, false);
        if (isAuto) inflightAutoRef.current.delete(image.id);
      }
    },
    [updateEndpointStatus]
  );

  const resetBatchState = () => {
    setApiEndpoints((prev) => prev.map((e) => ({ ...e, busy: false })));
    setBatchProgress({ current: 0, total: 0, processing: false });
    setBatchComplete(false);
  };

  const startQueueProcessing = useCallback(async () => {
    processingRef.current = true;
    setShowProcessingCenter(true); // keep open

    const loop = async () => {
      while (imageQueueRef.current.length > 0 && processingRef.current) {
        const available = (apiEndpointsRef.current || []).filter(
          (e) => e.available && !e.busy
        );
        if (!available.length) {
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
        const n = Math.min(available.length, imageQueueRef.current.length);
        const batch = imageQueueRef.current.splice(0, n);
        await Promise.all(
          batch.map((img, i) =>
            processImage(img, available[i].url, { isAuto: false })
          )
        );
        if (imageQueueRef.current.length)
          await new Promise((r) => setTimeout(r, 40));
      }
      processingRef.current = false;
      setBatchComplete(true);
      // Important: allow immediate next batch
      setBatchProgress((p) => ({ ...p, processing: false }));
    };

    loop().catch(() => {
      processingRef.current = false;
      setBatchProgress((p) => ({ ...p, processing: false }));
    });
  }, [processImage]);

  const processBatch = useCallback(() => {
    if (!images.length) return;
    // clean endpoints/busy from any previous run
    resetBatchState();
    commitAllSettings();

    const updated = images.map((img) => ({
      ...img,
      processing: false,
      error: null,
      optimizedUrl: null,
      optimizedSize: null,
      processed: false,
    }));

    setImages(updated);
    imageQueueRef.current = [...updated];

    setBatchProgress({ current: 0, total: updated.length, processing: true });
    setBatchComplete(false);

    startQueueProcessing();
  }, [images, commitAllSettings, startQueueProcessing]);

  const cancelBatch = useCallback(() => {
    processingRef.current = false; // stop loop
    resetBatchState();
    setImages((prev) => prev.map((i) => ({ ...i, processing: false })));
  }, []);

  /* ---------- Files ---------- */
  const handleFiles = useCallback(
    async (files, mode) => {
      const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!imgs.length) {
        alert("Please select image files");
        return;
      }

      const created = await Promise.all(
        imgs.map(async (file) => {
          try {
            const url = URL.createObjectURL(file);
            const tag = new Image();
            await new Promise((res, rej) => {
              tag.onload = res;
              tag.onerror = () => rej(new Error("load fail"));
              tag.src = url;
            });

            const base =
              mode === "batch" && selectedImage
                ? getSettings(selectedImage)
                : defaultSettings;
            const id = Math.random().toString(36).slice(2, 11);
            const settingsClone = { ...base, format: "original" };
            settingsRef.current.set(id, settingsClone);

            // compute complexity once
            const cx = await computeComplexity(file);
            complexityRef.current.set(id, cx);

            return {
              id,
              file,
              originalUrl: url,
              originalSize: file.size,
              optimizedUrl: null,
              optimizedSize: null,
              processed: false,
              processing: false,
              dimensions: {
                width: tag.naturalWidth,
                height: tag.naturalHeight,
              },
              processedFormat: null,
              settings: { ...settingsClone },
            };
          } catch {
            return null;
          }
        })
      );

      const valid = created.filter(Boolean);
      if (!valid.length) return;
      setImages((prev) => [...prev, ...valid]);
      if (!selectedImage) setSelectedImage(valid[0].id);
    },
    [selectedImage]
  );

  const handleFileInput = (files) => {
    if (!files.length) return;
    if (files.length === 1) handleFiles(files, "solo");
    else {
      setPendingFiles(Array.from(files));
      setShowImportModal(true);
    }
  };

  /* ---------- ZIP ---------- */
const buildZipName = (image, idx) => {
  const s = getSettings(image.id);
  const base = image.file.name.replace(/\.[^.]+$/, "");
  const ext = finalDownloadExt(image, s);
  const n = zipStartIndex + idx;
  const w = image.processedWidth || image.dimensions.width;
  const h = image.processedHeight || image.dimensions.height;
  switch (zipPattern) {
    case "index-dash-base":
      return `${pad(n, zipPad)} - ${base}.${ext}`;
    case "img-index":  
      return `img_${pad(n, zipPad)}.${ext}`;
    case "base-dims":
      return `${base}_${w}x${h}.${ext}`;
    case "original":
      return `${image.file.name}`;
    case "base-index":
    default:
      return `${base} ${pad(n, zipPad)}.${ext}`;
  }
};  const downloadImage = useCallback((image) => {
    if (!image.optimizedUrl) return;
    const s = getSettings(image.id);
    const base = image.file.name.replace(/\.[^.]+$/, "");
    const ext = finalDownloadExt(image, s);
    const a = document.createElement("a");
    a.href = image.optimizedUrl;
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);
  const downloadAllAsZip = useCallback(async () => {
    const done = images.filter((i) => i.optimizedUrl);
    if (!done.length) return;
    const zip = new JSZip();
    await Promise.all(
      done.map(async (img, idx) => {
        const r = await fetch(img.optimizedUrl);
        const b = await r.blob();
        zip.file(buildZipName(img, idx), b);
      })
    );
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized-images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 800);
  }, [images, zipPattern, zipStartIndex, zipPad]);

  /* ---------- Stats ---------- */
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);
  const calculateSavings = useCallback(
    (o, p) => (!p || !o ? 0 : Math.round(((o - p) / o) * 100)),
    []
  );
  const calculateBatchStats = useCallback(() => {
    const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
    const totalOptimized = images.reduce(
      (s, i) => s + (i.optimizedSize || 0),
      0
    );
    const totalSavings = calculateSavings(totalOriginal, totalOptimized);
    const processedCount = images.filter((i) => i.optimizedUrl).length;
    const totalCount = images.length;
    const individualSavings = images
      .filter((i) => i.optimizedUrl)
      .map((i) => ({
        name: i.file.name,
        original: i.originalSize,
        optimized: i.optimizedSize,
        savings: calculateSavings(i.originalSize, i.optimizedSize),
      }));
    const averageSavings = individualSavings.length
      ? Math.round(
          individualSavings.reduce((a, b) => a + b.savings, 0) /
            individualSavings.length
        )
      : 0;
    return {
      totalOriginal,
      totalOptimized,
      totalSavings,
      processedCount,
      totalCount,
      averageSavings,
    };
  }, [images, calculateSavings]);

  /* ---------- Keys (zoom 5%) ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "o") {
          e.preventDefault();
          fileInputRef.current?.click();
        }
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          setScale((s) => Math.min(s + 0.05, 5));
        }
        if (e.key === "-") {
          e.preventDefault();
          setScale((s) => Math.max(s - 0.05, 0.1));
        }
        if (e.key === "0") {
          e.preventDefault();
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- Canvas drag ---------- */
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDraggingSlider) {
        setIsDraggingCanvas(true);
        dragStartPos.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
    },
    [position, isDraggingSlider]
  );
  const handleMouseMove = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDraggingCanvas || isDraggingSlider) return;
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    },
    [isDraggingCanvas, isDraggingSlider]
  );
  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    setIsDraggingCanvas(false);
  }, []);

  /* ---------- Drag & drop ---------- */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileInput(Array.from(e.dataTransfer.files));
    },
    [handleFileInput]
  );

  /* ---------- Auto-optimise (debounced & abortable) ---------- */
  const triggerAutoOptimize = (imageId) => {
    if (!imageId || batchProgress.processing) return;
    const img = images.find((x) => x.id === imageId);
    if (!img || img.processing) return;
    const ep = getAvailableEndpoint();
    if (!ep) {
      const t = setTimeout(() => triggerAutoOptimize(imageId), 350);
      autoTimersRef.current.set(imageId, t);
      return;
    }
    processImage(img, ep, { isAuto: true });
  };
  const scheduleAutoOptimize = (imageId, delay = AUTO_DEBOUNCE_MS) => {
    if (!imageId) return;
    const prev = autoTimersRef.current.get(imageId);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => triggerAutoOptimize(imageId), delay);
    autoTimersRef.current.set(imageId, t);
  };

  /* ---------- UI bits (RIBBON / FILMSTRIP / CANVAS / SETTINGS) ---------- */

  const applyCurrentToAll = useCallback(() => {
    if (!currentImage) return;
    const src = getSettings(currentImage.id);
    images.forEach((img) => settingsRef.current.set(img.id, { ...src }));
    commitAllSettings();
    refreshEstForCurrent();
  }, [images, currentImage, commitAllSettings]);

  // Top Ribbon — neutral palette
  const Ribbon = () => (
    <div className="h-12 flex items-center justify-between px-4 bg-neutral-950 border-b border-neutral-800">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm"
        >
          Drop / Open
        </button>

        <div className="flex items-center rounded overflow-hidden">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.05, 0.1))}
            className="px-2 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-100 text-sm"
          >
            −
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800/80 text-neutral-100 text-sm"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.05, 5))}
            className="px-2 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-100 text-sm"
          >
            +
          </button>
        </div>

        <div className="w-px h-6 bg-neutral-800 mx-2" />

        <button
          onClick={() => setCanvasBg((p) => (p === "dark" ? "dim" : "dark"))}
          className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm"
        >
          BG: {canvasBg === "dark" ? "Black" : "Dark Gray"}
        </button>

        <button
          onClick={() => {
            setShowPanCtrl(false);
            setShowGridCtrl(false);
          }}
          className="px-2 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-sm"
          title="Hide Pan/Grid buttons"
        >
          Hide Pan/Grid
        </button>

        {showPanCtrl && (
          <button
            className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm"
            title="Pan (drag in canvas works too)"
          >
            ✋ Pan
          </button>
        )}
        {showGridCtrl && (
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm"
          >
            Grid {showGrid ? "On" : "Off"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={applyCurrentToAll}
          disabled={!currentImage}
          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-neutral-100 text-sm"
        >
          Apply to All
        </button>
        <button
          onClick={processBatch}
          disabled={batchProgress.processing}
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-neutral-100 text-sm font-semibold"
        >
          {batchProgress.processing ? "Optimizing…" : "Optimize All"}
        </button>
        <button
          onClick={() => setShowProcessingCenter(true)}
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-neutral-100 text-sm font-semibold"
        >
          Open  
        </button>
        <button
          onClick={downloadAllAsZip}
          disabled={!images.some((i) => i.optimizedUrl)}
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-neutral-100 text-sm font-semibold"
        >
          ZIP
        </button>
        <button
          onClick={cancelBatch}
          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm"
        >
          {batchComplete ? "Reset" : "Cancel"}
        </button>
      </div>
    </div>
  );

  // Left Filmstrip — neutral only; proper bottom anchoring via flex column
  const Filmstrip = () => {
    const stats = calculateBatchStats();
    return (
      <div className="w-56 flex-shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col min-h-0">
        <div className="p-3 border-b border-neutral-800">
          <div className="text-[11px] text-neutral-300">
            Loaded: <b>{images.length}</b>
          </div>
          {images.length > 0 && (
            <div className="text-[11px] text-neutral-400 mt-1">
              Total: {formatFileSize(stats.totalOriginal)}
              {stats.totalOptimized > 0 && (
                <>
                  {" "}
                  → {formatFileSize(stats.totalOptimized)} ({stats.totalSavings}
                  %)
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-2 flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[12px]"
          >
            Add
          </button>
          <button
            onClick={() => {
              images.forEach((img) => {
                if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
                if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
              });
              setImages([]);
              setSelectedImage(null);
              settingsRef.current.clear();
              resetBatchState();
            }}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[12px]"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {images.length === 0 ? (
            <div className="p-4 text-center text-neutral-400 text-[12px]">
              Drop images here
            </div>
          ) : (
            images.map((image) => {
              const s = getSettings(image.id);
              const est = estimateBytes(image, s);
              const active = selectedImage === image.id;
              return (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image.id)}
                  className={`flex items-center gap-2 px-2 py-2 cursor-pointer ${
                    active ? "bg-neutral-800/60" : "hover:bg-neutral-800/30"
                  }`}
                  title={`Est: ${KB(est)}`}
                >
                  <img
                    src={image.originalUrl}
                    className="w-10 h-10 rounded object-cover border border-neutral-800"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] text-neutral-200">
                      {image.file.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {image.dimensions.width}×{image.dimensions.height}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {KB(image.originalSize)}{" "}
                      {image.optimizedUrl ? (
                        <>
                          → {KB(image.optimizedSize)} (
                          {calculateSavings(
                            image.originalSize,
                            image.optimizedSize
                          )}
                          %)
                        </>
                      ) : (
                        <span className="text-neutral-400/80">
                          (est {KB(est)})
                        </span>
                      )}
                    </div>
                  </div>
                  {image.processing ? (
                    <div className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />
                  ) : image.optimizedUrl ? (
                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-neutral-700" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {images.length > 0 && (
          <div className="p-3 border-t border-neutral-800 space-y-2">
            <div className="text-[11px] text-neutral-300">ZIP naming</div>
            <select
              value={zipPattern}
              onChange={(e) => setZipPattern(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-[12px] px-2 py-1 rounded"
            >
              <option value="base-index">original</option>
              <option value="base-index">basename + index</option>
              <option value="index-dash-base">index - basename</option>
              <option value="img-index">img_index</option>
              <option value="base-dims">basename_dims</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={zipStartIndex}
                onChange={(e) =>
                  setZipStartIndex(parseInt(e.target.value || "1", 10))
                }
                className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 text-[12px] px-2 py-1 rounded"
                placeholder="Start"
              />
              <input
                type="number"
                min="0"
                value={zipPad}
                onChange={(e) => setZipPad(parseInt(e.target.value || "0", 10))}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 text-[12px] px-2 py-1 rounded"
                placeholder="Pad"
              />
            </div>
            <button
              onClick={downloadAllAsZip}
              disabled={!images.some((i) => i.optimizedUrl)}
              className="w-full px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-neutral-100 text-sm"
            >
              Download ZIP
            </button>
          </div>
        )}
      </div>
    );
  };

  // Center canvas — canvas BG: black or dark gray (no white)
  const Canvas = () => (
    <div
      className={`flex-1 ${canvasBg === "dark" ? "bg-black" : "bg-neutral-900"} relative overflow-hidden min-h-0`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="absolute inset-0 border-4 border-dashed border-neutral-600 bg-neutral-700/10 flex items-center justify-center z-10">
          <div className="text-center text-neutral-200">
            <div className="text-4xl mb-2">📁</div>
            <div className="text-lg font-semibold">Drop images</div>
          </div>
        </div>
      )}

      {currentImage ? (
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center relative"
          style={{
            cursor:
              isDraggingCanvas && !isDraggingSlider
                ? "grabbing"
                : isDraggingSlider
                  ? "ew-resize"
                  : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Original */}
          <div
            className="absolute"
            style={{
              clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)`,
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={currentImage.originalUrl}
              alt="Original"
              className="max-w-none"
              style={{
                width: currentImage.dimensions.width,
                height: currentImage.dimensions.height,
              }}
            />
          </div>

          {/* Optimized */}
          {currentImage.optimizedUrl && (
            <div
              className="absolute"
              style={{
                clipPath: `inset(0 0 0 ${comparisonPosition}%)`,
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={currentImage.optimizedUrl}
                alt="Optimized"
                className="max-w-none"
                style={{
                  width: currentImage.dimensions.width,
                  height: currentImage.dimensions.height,
                }}
              />
            </div>
          )}

          {/* Divider */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-neutral-300 cursor-ew-resize z-20 shadow-xl flex items-center justify-center hover:w-3"
            style={{ left: `${comparisonPosition}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingSlider(true);
              const sx = e.clientX,
                sp = comparisonPosition;
              const move = (ev) => {
                const delta = ((ev.clientX - sx) / window.innerWidth) * 100;
                setComparisonPosition(clamp(sp + delta, 0, 100));
              };
              const up = () => {
                setIsDraggingSlider(false);
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
              };
              document.addEventListener("mousemove", move);
              document.addEventListener("mouseup", up);
            }}
          >
            <div className="w-8 h-8 bg-neutral-200 rounded-full shadow-lg flex items-center justify-center text-neutral-800 text-lg hover:scale-110">
              ⇄
            </div>
          </div>

          {/* HUD */}
          <div className="absolute top-4 left-4 bg-neutral-950/85 text-neutral-100 px-3 py-2 rounded text-[12px] space-y-1 backdrop-blur-sm border border-neutral-800">
            <div className="font-semibold text-neutral-200">Image Info</div>
            <div>
              Display: {currentImage.dimensions.width}×
              {currentImage.dimensions.height}
            </div>
            {currentImage.processedWidth && (
              <div>
                Processed: {currentImage.processedWidth}×
                {currentImage.processedHeight}
              </div>
            )}
            <div>Original: {KB(currentImage.originalSize)}</div>
            {currentImage.optimizedUrl && (
              <div>
                Current: {KB(currentImage.optimizedSize)}
                <span className="text-neutral-300 ml-1">
                  (
                  {calculateSavings(
                    currentImage.originalSize,
                    currentImage.optimizedSize
                  )}
                  %)
                </span>
              </div>
            )}
            <div>Zoom: {Math.round(scale * 100)}%</div>
            <div>
              Format:{" "}
              {String(
                finalDownloadExt(currentImage, getSettings(currentImage.id))
              ).toUpperCase()}
            </div>
            <div>
              Quality: {Number(getSettings(currentImage.id).quality).toFixed(1)}
              %
            </div>
            <div>
              Estimated: <span ref={hudPredictedRef}>—</span>
            </div>
          </div>

          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(128,128,128,0.15) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(128,128,128,0.15) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />
          )}
        </div>
      ) : images.length ? (
        <div className="w-full h-full flex items-center justify-center text-neutral-300">
          <div className="text-center">
            <div className="text-6xl mb-3 opacity-60">👆</div>
            <div className="text-lg font-semibold">
              Pick an image from the filmstrip
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-300">
          <div className="text-center">
            <div className="text-6xl mb-3 opacity-60">🖼️</div>
            <div className="text-lg font-semibold">Let’s load some art!</div>
            <div className="mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
              >
                Open Images
              </button>
              <div className="text-[12px] mt-2">or drag & drop anywhere</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Bottom Settings Dock — fixed height, pinned bottom
  const SettingsDock = memo(function SettingsDock() {
    if (!currentImage)
      return (
        <div className="h-64 bg-neutral-950 border-t border-neutral-800 flex items-center justify-center text-neutral-300 text-sm">
          Select an image to tweak ✨
        </div>
      );

    const widthRef = useRef(null);
    const heightRef = useRef(null);
    const qualityRef = useRef(null);
    const qualityLabelRef = useRef(null);
    const effortRef = useRef(null);
    const effortLabelRef = useRef(null);
    const formatRef = useRef(null);

    const s = getSettings(currentImage.id);
    const setSettings = (patch) => {
      const cur = settingsRef.current.get(currentImage.id) || {
        ...defaultSettings,
      };
      const next = { ...cur, ...patch };
      settingsRef.current.set(currentImage.id, next);
    };
    const updateEstimates = () => {
      const bytes = estimateBytes(currentImage, getSettings(currentImage.id));
      const txt = KB(bytes);
      if (hudPredictedRef.current) hudPredictedRef.current.textContent = txt;
    };

    useEffect(() => {
      if (widthRef.current) widthRef.current.value = s.width ?? "";
      if (heightRef.current) heightRef.current.value = s.height ?? "";
      if (qualityRef.current) qualityRef.current.value = s.quality ?? 80;
      if (qualityLabelRef.current)
        qualityLabelRef.current.textContent = String(
          Number(s.quality ?? 80).toFixed(1)
        );
      if (effortRef.current) effortRef.current.value = s.effort ?? 6;
      if (effortLabelRef.current)
        effortLabelRef.current.textContent = String(
          Number(s.effort ?? 6).toFixed(1)
        );
      if (formatRef.current) formatRef.current.value = s.format ?? "original";
      updateEstimates();
    }, [currentImage?.id]);

    const commit = () => commitImageSettings(currentImage.id);
    const touch = () => {
      updateEstimates();
      scheduleAutoOptimize(currentImage.id);
    };

    const onFormat = (v) => {
      setSettings({ format: v });
      commit();
      touch();
    };
    const onQuality = (val) => {
      const q = clamp(parseFloat(val || 0), 1, 100);
      setSettings({ quality: q });
      if (qualityLabelRef.current)
        qualityLabelRef.current.textContent = String(q.toFixed(1));
      touch();
    };
    const onQualityCommit = () => commit();

    const onEffort = (val) => {
      const e = clamp(parseFloat(val || 0), 1, 10);
      setSettings({ effort: e });
      if (effortLabelRef.current)
        effortLabelRef.current.textContent = String(e.toFixed(1));
      touch();
    };
    const onEffortCommit = () => commit();

    const onWidth = (val) => {
      if (val === "") {
        setSettings({ width: "", height: "" });
        if (heightRef.current) heightRef.current.value = "";
        touch();
        return;
      }
      const w = parseInt(val, 10);
      if (isNaN(w) || w <= 0) return;
      const local = getSettings(currentImage.id);
      if (local.maintainAspect) {
        const r =
          currentImage.dimensions.height / currentImage.dimensions.width;
        const h = Math.round(w * r);
        if (heightRef.current) heightRef.current.value = String(h);
        setSettings({ width: String(w), height: String(h) });
      } else setSettings({ width: String(w) });
      touch();
    };
    const onWidthCommit = () => commit();

    const onHeight = (val) => {
      if (val === "") {
        setSettings({ width: "", height: "" });
        if (widthRef.current) widthRef.current.value = "";
        touch();
        return;
      }
      const h = parseInt(val, 10);
      if (isNaN(h) || h <= 0) return;
      const local = getSettings(currentImage.id);
      if (local.maintainAspect) {
        const r =
          currentImage.dimensions.width / currentImage.dimensions.height;
        const w = Math.round(h * r);
        if (widthRef.current) widthRef.current.value = String(w);
        setSettings({ height: String(h), width: String(w) });
      } else setSettings({ height: String(h) });
      touch();
    };
    const onHeightCommit = () => commit();

    const onAspect = (checked) => {
      const prev = getSettings(currentImage.id);
      setSettings({ maintainAspect: checked });
      if (checked) {
        if (prev.width && !prev.height) {
          const w = parseInt(prev.width, 10);
          if (!isNaN(w)) {
            const r =
              currentImage.dimensions.height / currentImage.dimensions.width;
            const h = Math.round(w * r);
            if (heightRef.current) heightRef.current.value = String(h);
            setSettings({ height: String(h) });
          }
        } else if (prev.height && !prev.width) {
          const h = parseInt(prev.height, 10);
          if (!isNaN(h)) {
            const r =
              currentImage.dimensions.width / currentImage.dimensions.height;
            const w = Math.round(h * r);
            if (widthRef.current) widthRef.current.value = String(w);
            setSettings({ width: String(w) });
          }
        }
      }
      commit();
      touch();
    };

    const applyPreset = (p) => {
      const patch = { ...p.settings };
      setSettings(patch);
      if (patch.width !== undefined && widthRef.current)
        widthRef.current.value = patch.width ?? "";
      if (patch.height !== undefined && heightRef.current)
        heightRef.current.value = patch.height ?? "";
      if (patch.quality !== undefined) {
        if (qualityRef.current) qualityRef.current.value = patch.quality;
        if (qualityLabelRef.current)
          qualityLabelRef.current.textContent = String(
            Number(patch.quality).toFixed(1)
          );
      }
      if (patch.effort !== undefined) {
        if (effortRef.current) effortRef.current.value = patch.effort;
        if (effortLabelRef.current)
          effortLabelRef.current.textContent = String(
            Number(patch.effort).toFixed(1)
          );
      }
      if (patch.format !== undefined && formatRef.current)
        formatRef.current.value = patch.format;
      commit();
      touch();
    };

    const applyPresetToAll = (p) => {
      images.forEach((img) => {
        const cur = settingsRef.current.get(img.id) || { ...defaultSettings };
        settingsRef.current.set(img.id, { ...cur, ...p.settings });
      });
      commitAllSettings();
      updateEstimates();
    };

    const reset = () => {
      settingsRef.current.set(currentImage.id, { ...defaultSettings });
      if (widthRef.current) widthRef.current.value = "";
      if (heightRef.current) heightRef.current.value = "";
      if (qualityRef.current)
        qualityRef.current.value = defaultSettings.quality;
      if (qualityLabelRef.current)
        qualityLabelRef.current.textContent = String(
          Number(defaultSettings.quality).toFixed(1)
        );
      if (effortRef.current) effortRef.current.value = defaultSettings.effort;
      if (effortLabelRef.current)
        effortLabelRef.current.textContent = String(
          Number(defaultSettings.effort).toFixed(1)
        );
      if (formatRef.current) formatRef.current.value = "original";
      commit();
      touch();
    };

    return (
      <div className="h-56   bg-neutral-950 border-t border-neutral-800 px-4 py-3">
        <div className="grid grid-cols-4 gap-4 h-full">
          {/* Format & Presets */}
          <div className="col-span-1 rounded-xl border border-neutral-800 p-3">
            <div className="text-[11px] text-neutral-300 font-semibold mb-2">
              Format
            </div>
            <select
              ref={formatRef}
              defaultValue={s.format}
              onChange={(e) => onFormat(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-2 text-[12px] text-neutral-200"
            >   
              <option value="original">Original</option>
              <option value="jpeg">JPEG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
              <option value="avif">AVIF</option>
              <option value="png">PNG</option>
            </select>

            <div className="mt-3 text-[11px] text-neutral-300 mb-1">
              Presets
            </div>
            <div className="flex flex-col gap-1">
              {presets.map((p) => (
                <div key={p.id} className="flex gap-2">
                  <button
                    onClick={() => applyPreset(p)}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[12px] px-2 py-1 rounded"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => applyPresetToAll(p)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[12px] px-2 py-1 rounded"
                    title="Apply to all"
                  >
                    All
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quality & Effort */}
          <div className="col-span-2 rounded-xl border border-neutral-800 p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span>Quality</span>
                  <span ref={qualityLabelRef}>
                    {Number(s.quality).toFixed(1)}%
                  </span>
                </div>
                <input
                  ref={qualityRef}
                  type="range"
                  min="1"
                  max="100"
                  step="0.1"
                  defaultValue={s.quality}
                  onInput={(e) => onQuality(e.target.value)}
                  onPointerUp={onQualityCommit}
                  onMouseUp={onQualityCommit}
                  onTouchEnd={onQualityCommit}
                  className="w-full accent-neutral-300 mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span>Effort</span>
                  <span ref={effortLabelRef}>
                    {Number(s.effort).toFixed(1)}
                  </span>
                </div>
                <input
                  ref={effortRef}
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  defaultValue={s.effort}
                  onInput={(e) => onEffort(e.target.value)}
                  onPointerUp={onEffortCommit}
                  onMouseUp={onEffortCommit}
                  onTouchEnd={onEffortCommit}
                  className="w-full accent-neutral-400 mt-1"
                />
                <div className="text-[11px] text-neutral-400 mt-1">
                  Higher = smaller file, slower encode
                </div>
              </div>
            </div>
          </div>

          {/* Resize & Actions */}
          <div className="col-span-1 rounded-xl border border-neutral-800 p-3">
            <div className="text-[11px] text-neutral-300 mb-2">Resize</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={widthRef}
                type="number"
                min="1"
                placeholder="Width"
                defaultValue={s.width}
                onInput={(e) => onWidth(e.target.value)}
                onBlur={onWidthCommit}
                onFocus={(e) => e.target.select()}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-[12px] px-2 py-1 rounded"
              />
              <input
                ref={heightRef}
                type="number"
                min="1"
                placeholder="Height"
                defaultValue={s.height}
                onInput={(e) => onHeight(e.target.value)}
                onBlur={onHeightCommit}
                onFocus={(e) => e.target.select()}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-[12px] px-2 py-1 rounded"
              />
            </div>
            <label className="flex items-center gap-2 mt-2 text-[12px] text-neutral-200">
              <input
                type="checkbox"
                defaultChecked={!!s.maintainAspect}
                onChange={(e) => onAspect(e.target.checked)}
              />
              Keep proportions
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadImage(currentImage)}
                disabled={!currentImage.optimizedUrl}
                className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-60 text-neutral-100 text-[12px] px-2 py-1 rounded"
              >
                Download
              </button>
              <button
                onClick={reset}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[12px] px-2 py-1 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const ProcessingCenterModal = () => {
    if (!showProcessingCenter) return null;
    const stats = calculateBatchStats();
    const progress = batchProgress.total
      ? (batchProgress.current / batchProgress.total) * 100
      : 0;

    return (
      <div className="fixed inset-0 bg-neutral-950/70 z-50 flex items-center justify-center">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-[900px] max-w-[95vw] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-200">
              <span className="text-neutral-200 text-lg">⚙️</span>
              <span className="font-semibold">
                {batchComplete ? "Done!" : "Processing…"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!batchComplete && (
                <button
                  onClick={cancelBatch}
                  className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => setShowProcessingCenter(false)}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm"
              >
                {batchComplete ? "Close" : "Hide"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="p-5 border-r border-neutral-800">
              <div className="text-neutral-200 text-sm mb-2">Progress</div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-neutral-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-neutral-400 text-[12px] mt-2">
                {batchProgress.current} / {batchProgress.total}
              </div>

              <div className="mt-4 text-neutral-200 text-sm">Endpoints</div>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {apiEndpoints.map((ep, i) => (
                  <div
                    key={ep.url}
                    className={`px-2 py-2 rounded border text-center text-[11px] ${
                      !ep.available
                        ? "bg-neutral-900 border-neutral-700 text-neutral-500"
                        : ep.busy
                          ? "bg-neutral-800 border-neutral-700 text-neutral-200"
                          : "bg-neutral-900 border-neutral-700 text-neutral-300"
                    }`}
                  >
                    EP {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="text-neutral-200 text-sm font-semibold mb-3">
                Live Stats
              </div>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-neutral-400">Total Original</div>
                  <div className="text-neutral-200 font-semibold">
                    {formatFileSize(stats.totalOriginal)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Total Optimized</div>
                  <div className="text-neutral-200 font-semibold">
                    {formatFileSize(stats.totalOptimized)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Total Savings</div>
                  <div className="text-neutral-200 font-semibold">
                    {stats.totalSavings}%
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Average Savings</div>
                  <div className="text-neutral-200 font-semibold">
                    {calculateBatchStats().averageSavings || 0}%
                  </div>
                </div>
              </div>

              <div className="mt-4 text-neutral-400 text-[12px]">
                Processed: {stats.processedCount}/{stats.totalCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Selection change: refresh predicted ---------- */
  useEffect(() => {
    if (currentImage) refreshEstForCurrent();
  }, [selectedImage]);

  /* ---------- Import modal ---------- */
  const ImportModal = () =>
    !showImportModal ? null : (
      <div className="fixed inset-0 bg-neutral-950/70 z-50 flex items-center justify-center">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-96 p-6">
          <div className="text-neutral-200 text-lg font-semibold mb-3">
            Import Images
          </div>
          <div className="text-neutral-400 mb-5">
            Use individual settings for each file or copy the current settings
            to all?
          </div>
          <div className="space-y-3 mb-5">
            <button
              onClick={() => {
                handleFiles(pendingFiles, "solo");
                setShowImportModal(false);
                setPendingFiles([]);
              }}
              className="w-full text-left px-4 py-3 rounded border border-neutral-800 hover:border-neutral-500 bg-neutral-900 text-neutral-200"
            >
              Individual Settings.
            </button>
            <button
              onClick={() => {
                handleFiles(pendingFiles, "batch");
                setShowImportModal(false);
                setPendingFiles([]);
              }}
              className="w-full text-left px-4 py-3 rounded border border-neutral-800 hover:border-neutral-500 bg-neutral-900 text-neutral-200"
            >
              Batch Settings
            </button>
          </div>
          <button
            onClick={() => {
              setShowImportModal(false);
              setPendingFiles([]);
            }}
            className="w-full px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );

  /* ---------- Render (normal scale; settings pinned bottom) ---------- */
  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-200 flex flex-col">
      <ProcessingCenterModal />
      <ImportModal />

      <Ribbon />

      {/* Middle region respects bottom h-64 settings via flex layout */}
      <div className="flex-1 flex min-h-0">
        <Filmstrip />
        <Canvas />
      </div>

      {/* Bottom settings dock (h-64) */}
      <SettingsDock />

      {/* Hidden input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileInput(Array.from(e.target.files || []))}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}
