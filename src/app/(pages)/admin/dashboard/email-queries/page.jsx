"use client";

import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  FaTimes,
  FaSearch,
  FaComments,
  FaInbox,
  FaUser,
  FaEnvelopeOpen,
  FaPaperclip,
  FaDownload,
  FaCheckCircle,
  FaDatabase,
} from "react-icons/fa";
import { ImSpinner } from "react-icons/im";

/** ===================== FIRESTORE (client) ===================== */
import { firestore as db } from "@/Backend/Firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

/** ===================== CONFIG ===================== */
const REPLY_IDENTIFIER = "<title>Reply</title>";

/** ===================== TEXT HELPERS ===================== */
const removeHtmlTags = (text) => (text ? text.replace(/<[^>]*>/g, "") : "");

const cleanWhitespace = (text) =>
  (text || "")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    .replace(/[ \t]+/g, " ")
    .trim();

const removeFooter = (text) => {
  if (!text) return "";
  let cleanedText = text;
  const footerPatterns = [
    /Please review the details.*www\.Honhaar Jawan\.pk/gi,
    /Best regards,\s*Honhaar Jawan \(Honhaar Jawan\)/gi,
    /enquiries\.department@Honhaar Jawan\.pk/gi,
    /www\.Honhaar Jawan\.pk/gi,
    /Please review the details.*www\.nvtti\.pk/gi,
    /Best regards,\s*Nationwide Virtual Technical Training Initiative \(NVTTI\)/gi,
    /enquiries\.department@nvtti\.pk/gi,
    /www\.nvtti\.pk/gi,
    /Please review the details and respond to the user as necessary\.\s*For further assistance, you may contact the user directly using the email provided/gi,
  ];
  footerPatterns.forEach((pattern) => {
    cleanedText = cleanedText.replace(pattern, "");
  });
  return cleanedText;
};

/** Never show the support template inside chat UI */
const stripSupportTemplate = (htmlOrText) => {
  if (!htmlOrText) return null;
  if (!htmlOrText.includes(REPLY_IDENTIFIER)) return null;

  const startToken = "<!--REPLY_PAYLOAD_START-->";
  const endToken = "<!--REPLY_PAYLOAD_END-->";
  const start = htmlOrText.indexOf(startToken);
  const end = htmlOrText.indexOf(endToken);
  if (start !== -1 && end !== -1 && end > start) {
    const innerHtml = htmlOrText.slice(start + startToken.length, end);
    const ta = document.createElement("textarea");
    ta.innerHTML = innerHtml;
    const plain = removeHtmlTags(ta.value);
    return cleanWhitespace(plain);
  }

  let clean = htmlOrText
    .replace(/<h1[^>]*>.*?Support Response.*?<\/h1>/gis, "")
    .replace(/<p[^>]*>\s*Dear[\s\S]*?<\/p>/i, "")
    .replace(/<p[^>]*>\s*Best regards[\s\S]*?Support Team[\s\S]*?<\/p>/i, "");

  const ta = document.createElement("textarea");
  ta.innerHTML = clean;
  const plain = removeHtmlTags(ta.value);
  return cleanWhitespace(plain);
};

const extractReplyMessage = (text) => {
  if (!text) return "";
  const templated = stripSupportTemplate(text);
  if (templated !== null) return templated;

  let cleanText = removeHtmlTags(text);
  cleanText = removeFooter(cleanText);
  const textArea = document.createElement("textarea");
  textArea.innerHTML = cleanText;
  cleanText = textArea.value;

  const quotedPatterns = [
    /On\s+.+wrote:/gi,
    /From:\s*.+/gi,
    /Sent:\s*.+/gi,
    /To:\s*.+/gi,
    /Subject:\s*.+/gi,
    /Date:\s*.+/gi,
    /^>.*$/gm,
    /^From:.*$/gm,
    /^Sent:.*$/gm,
    /^To:.*$/gm,
    /^Subject:.*$/gm,
    /^\s*-----Original Message-----.*$/gm,
    /^\s*________________________________.*$/gm,
  ];
  quotedPatterns.forEach(
    (pattern) => (cleanText = cleanText.replace(pattern, ""))
  );

  const signaturePatterns = [
    /^--\s*$/gm,
    /^\s*Thanks,?\s*$/gim,
    /^\s*Best regards,?\s*$/gim,
    /^\s*Regards,?\s*$/gim,
    /^\s*Sincerely,?\s*$/gim,
    /^\s*Kind regards,?\s*$/gim,
    /^\s*Best,?\s*$/gim,
  ];
  signaturePatterns.forEach(
    (pattern) => (cleanText = cleanText.replace(pattern, ""))
  );

  const quoteSplitters = [
    /\n\s*On\s+.+wrote:/i,
    /\n\s*From:\s*.+/i,
    /\n\s*-----Original Message-----/i,
    /\n\s*________________________________/i,
  ];
  for (const splitter of quoteSplitters) {
    const parts = cleanText.split(splitter);
    if (parts.length > 1) {
      cleanText = parts[0];
      break;
    }
  }
  return cleanWhitespace(cleanText);
};

const extractFormData = (text) => {
  if (!text) return { isStructuredForm: false, rawText: "" };
  let cleanText = removeHtmlTags(text);
  cleanText = removeFooter(cleanText);
  const textArea = document.createElement("textarea");
  textArea.innerHTML = cleanText;
  cleanText = cleanWhitespace(textArea.value);

  const nameMatch = cleanText.match(
    /Name:\s*(.*?)(?=\s*(Email:|Phone:|Subject:|Message:|$))/i
  );
  const emailMatch = cleanText.match(
    /Email:\s*(.*?)(?=\s*(Phone:|Subject:|Message:|Name:|$))/i
  );
  const phoneMatch = cleanText.match(
    /Phone:\s*(.*?)(?=\s*(Subject:|Message:|Email:|Name:|$))/i
  );
  const subjectMatch = cleanText.match(
    /Subject:\s*(.*?)(?=\s*(Message:|Phone:|Email:|Name:|$))/i
  );
  const messageMatch = cleanText.match(
    /Message:\s*(.*?)(?=\s*(Subject:|Phone:|Email:|Name:|$))/is
  );

  const isStructuredForm = !!(
    nameMatch ||
    emailMatch ||
    phoneMatch ||
    subjectMatch ||
    messageMatch
  );

  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    email: emailMatch ? emailMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    subject: subjectMatch ? subjectMatch[1].trim() : null,
    message: messageMatch ? messageMatch[1].trim() : null,
    isStructuredForm,
    rawText: cleanText,
  };
};

const parseEmailFromHeader = (val) => {
  if (!val) return "";
  const match = val.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  return val.toLowerCase();
};

const parseNameFromHeader = (val) => {
  if (!val) return "User";
  const match = val.match(/^([^<]+)</);
  return (match ? match[1] : val).trim();
};

/** ===================== SMALL UTIL ===================== */
const isImage = (mime = "") => mime.startsWith("image/");
const isPdf = (mime = "") => mime === "application/pdf" || mime.includes("pdf");
const isText = (mime = "") =>
  mime.startsWith("text/") ||
  mime.includes("json") ||
  mime.includes("csv") ||
  mime.includes("xml");

/** ===================== NOTIFICATION SOUND (rate-limited) ===================== */
function useNotificationSound(src = "/sounds/1.mp3") {
  const audioRef = useRef(null);
  const [armed, setArmed] = useState(false);

  const lastPlayedRef = useRef(0);
  const COOLDOWN_MS = 2500;

  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;

    const arm = () => setArmed(true);
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });

    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      audioRef.current = null;
    };
  }, [src]);

  const play = useCallback(() => {
    if (!audioRef.current || !armed) return;
    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    if (now - lastPlayedRef.current < COOLDOWN_MS) return;
    lastPlayedRef.current = now;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}
  }, [armed]);

  return { play, armed };
}

/** ===================== DESKTOP NOTIFICATIONS ===================== */
/**
 * - Explicit permission banner (more reliable).
 * - requireInteraction + renotify for Windows toast reliability.
 * - Click navigates to a deep-link (?threadId=...) and triggers popstate so UI opens it.
 */
function useDesktopNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
  }, []);

  // Ask on first user gesture as well
  useEffect(() => {
    if (!supported) return;
    const maybeAsk = async () => {
      if (Notification.permission === "default") {
        try {
          const p = await Notification.requestPermission();
          setPermission(p);
        } catch {}
      } else {
        setPermission(Notification.permission);
      }
    };
    window.addEventListener("pointerdown", maybeAsk, { once: true });
    window.addEventListener("keydown", maybeAsk, { once: true });
    return () => {
      window.removeEventListener("pointerdown", maybeAsk);
      window.removeEventListener("keydown", maybeAsk);
    };
  }, [supported]);

  const request = useCallback(async () => {
    if (!supported) return "denied";
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      return p;
    } catch {
      return Notification.permission;
    }
  }, [supported]);

  const notify = useCallback(
    (title, opts = {}, onClick) => {
      if (!supported || Notification.permission !== "granted") return null;

      const tag =
        opts.tag || `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = opts.url || undefined;

      const n = new Notification(title, {
        body: opts.body,
        tag,
        renotify: true,
        requireInteraction: true,
        silent: false,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { ...(opts.data || {}), url },
      });

      n.onclick = () => {
        try {
          window.focus();
          const dest = n.data && n.data.url;
          if (dest) {
            if (dest.startsWith("http")) {
              window.location.assign(dest);
            } else {
              window.history.pushState({}, "", dest);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          }
          if (typeof onClick === "function") onClick(n);
        } catch {}
        try {
          n.close();
        } catch {}
      };

      setTimeout(() => {
        try {
          n.close();
        } catch {}
      }, 15000);

      return n;
    },
    [supported]
  );

  return { supported, permission, request, notify };
}

/** ===================== SIMPLE TOASTS ===================== */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);
  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  return { toasts, push, remove };
}

function ToastHost({ toasts, remove }) {
  return (
    <div className="fixed right-4 bottom-4 z-[95] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`relative pointer-events-auto w-80 shadow-lg rounded-lg border px-4 py-3 bg-white ${
            t.type === "warn" ? "border-amber-300" : "border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                t.type === "warn" ? "bg-amber-100" : "bg-gray-100"
              }`}
            >
              <FaInbox
                className={
                  t.type === "warn" ? "text-amber-700" : "text-gray-700"
                }
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {t.type === "warn" ? "Heads up" : "Notice"}
              </div>
              <div className="text-sm text-gray-700 mt-0.5">{t.text}</div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** ===================== SPLIT PANE ===================== */
function SplitPane({
  left,
  right,
  initial = 380,
  min = 320,
  max = 720,
  className = "",
}) {
  const [width, setWidth] = useState(initial);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.classList.add("select-none", "cursor-col-resize");
  };

  const onMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      const next = Math.max(
        min,
        Math.min(max, startW.current + (e.clientX - startX.current))
      );
      setWidth(next);
    },
    [min, max]
  );

  const onUp = useCallback(() => {
    dragging.current = false;
    document.body.classList.remove("select-none", "cursor-col-resize");
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onMove, onUp]);

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `${width}px 8px 1fr` }}
      >
        <div className="overflow-hidden border-r border-gray-200">{left}</div>
        <div
          className="bg-gray-200 hover:bg-gray-300 cursor-col-resize"
          onMouseDown={onDown}
        />
        <div className="overflow-hidden">{right}</div>
      </div>
    </div>
  );
}

/** ===================== TERMINAL LOG DOCK ===================== */
function TerminalLogDock({ logs, open, onClose }) {
  const scroller = useRef(null);
  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [logs]);

  if (!open) return null;

  return (
    <div className="fixed left-6 right-6 bottom-6 z-[70] rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-gray-200 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FaDatabase className="text-emerald-400" />
          <span className="font-mono text-sm font-semibold">System Logs</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
        >
          Close
        </button>
      </div>
      <div
        ref={scroller}
        className="max-h-[40vh] overflow-y-auto bg-gray-900 font-mono text-[13px] leading-relaxed p-2"
      >
        {logs.map((l, i) => (
          <div key={i} className="px-3 py-1.5 hover:bg-gray-800/50 transition">
            <span className="text-gray-500 mr-2">[{l.ts}]</span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                l.level === "error"
                  ? "bg-red-900/50 text-red-300"
                  : l.level === "warn"
                  ? "bg-yellow-900/50 text-yellow-300"
                  : l.level === "email"
                  ? "bg-emerald-900/50 text-emerald-300"
                  : l.level === "api"
                  ? "bg-amber-900/50 text-amber-300"
                  : l.level === "db"
                  ? "bg-teal-900/50 text-teal-300"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {l.level.toUpperCase()}
            </span>
            <span className="text-gray-400 mr-2">@{l.source}</span>
            <span className="text-gray-200">{l.msg}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No logs available
          </div>
        )}
      </div>
    </div>
  );
}

/** ===================== ATTACHMENT VIEWER ===================== */
const AttachmentViewer = ({ open, file, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    let urlToRevoke = null;
    const load = async () => {
      if (!open || !file?.url) return;
      try {
        const res = await fetch(file.url);
        const blob = await res.blob();

        if (isText(file.mimeType)) {
          const txt = await blob.text();
          setTextContent(txt.slice(0, 200000));
          setBlobUrl(null);
        } else {
          const u = URL.createObjectURL(blob);
          urlToRevoke = u;
          setBlobUrl(u);
          setTextContent("");
        }
      } catch (_) {
        setTextContent("Failed to load attachment.");
        setBlobUrl(null);
      }
    };
    load();
    return () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [open, file]);

  if (!open || !file) return null;

  const clickOutside = (e) => {
    if (e.target === containerRef.current) onClose();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4"
      onMouseDown={clickOutside}
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden relative">
        <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-gray-900">{file.filename}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              ATTACHED FILE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <FaDownload />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
              aria-label="Close attachment viewer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto bg-gray-50">
          {isImage(file.mimeType) && blobUrl && (
            <img
              src={blobUrl}
              alt={file.filename}
              className="max-h-[75vh] mx-auto rounded-lg shadow"
            />
          )}
          {isPdf(file.mimeType) && blobUrl && (
            <iframe
              title={file.filename}
              src={blobUrl}
              className="w-full h-[75vh] rounded-lg border"
            />
          )}
          {isText(file.mimeType) && (
            <pre className="bg-white p-4 rounded-lg border overflow-auto text-sm leading-relaxed whitespace-pre-wrap">
              {textContent || "Loading..."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

/** ===================== THREAD PANEL (right side) ===================== */
function ThreadPanel({
  thread,
  draft,
  onDraftChange,
  onSend,
  onUpdateStatus,
  onDeleteThread,
  incrementSolved,
  onPreview,
}) {
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      atBottomRef.current = nearBottom;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages?.length]);

  if (!thread) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a thread to view conversation
      </div>
    );
  }

  const lastMsg = thread.messages?.[thread.messages.length - 1];
  const lastMsgSender =
    lastMsg?.type === "incoming" ? lastMsg?.fromName : "you";

  const handleQuickSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await onSend(thread, draft, []);
      onDraftChange("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between bg-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FaComments className="text-amber-600" />
            <h2 className="font-semibold text-gray-900 truncate">
              {thread.subject}
            </h2>
            <span
              className={
                "text-[10px] px-2 py-0.5 rounded-full border " +
                (thread.source === "form"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-100 text-amber-800 border-amber-200")
              }
            >
              {thread.source === "form" ? "FORM" : "MANUAL"}
            </span>
            <span
              className={
                "text-[10px] px-2 py-0.5 rounded-full " +
                (thread.status === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : thread.status === "active"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-100 text-emerald-800")
              }
            >
              {thread.status.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="inline-flex items-center">
              <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 mr-2 flex items-center justify-center">
                <FaUser className="text-amber-700 text-xs" />
              </div>
              <span className="font-medium text-gray-900">
                {thread.participant}
              </span>
              <span className="mx-2 text-gray-400">·</span>
              <FaEnvelopeOpen className="text-gray-400 mr-1" />
              {thread.messageCount} messages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateStatus(thread.id, "resolved")
                .then(() => onDeleteThread(thread.id))
                .then(() => incrementSolved())
            }
            className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
            title="Mark thread as solved and trash it"
          >
            <FaCheckCircle />
            Mark as Solved
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-6"
      >
        {thread.messages?.map((m, idx) => {
          const id = m.id || `m-${idx}`;
          const isIncoming = m.type === "incoming";
          const content = m.body || "";

          return (
            <div
              key={id}
              className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
            >
              <div
                className={
                  `w-full max-w-full rounded-2xl p-4 border ` +
                  (isIncoming
                    ? "bg-white text-gray-800 border-gray-200"
                    : "bg-white text-white")
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {isIncoming ? m.fromName || "Unknown" : "Honhaar Jawan Support"}
                    </span>
                    {m.formData?.isStructuredForm ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        FORM
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        MANUAL
                      </span>
                    )}
                    {m.attachments?.length ? (
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border-amber-200 border">
                        {m.attachments.length} attachment
                        {m.attachments.length > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        isIncoming ? "text-gray-600" : "text-amber-50/90"
                      }`}
                    >
                      {new Date(m.date).toLocaleString()}
                    </span>
                  </div>
                </div>

                <iframe
                  srcDoc={content}
                  className="w-full h-96 border rounded-lg mb-3"
                  title={`Email content ${id}`}
                />

                {!!m.attachments?.length && (
                  <div className="pt-2">
                    <h4 className="text-[11px] font-semibold mb-2 flex items-center gap-2">
                      <FaPaperclip /> Attachments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.attachments.map((att, i) => {
                        const url = `/api/google/gmail?op=attachment&messageId=${encodeURIComponent(
                          m.id
                        )}&attachmentId=${encodeURIComponent(
                          att.attachmentId
                        )}&filename=${encodeURIComponent(
                          att.filename || `file-${i}`
                        )}&mimeType=${encodeURIComponent(att.mimeType)}`;
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-gray-200 bg-white p-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-medium text-gray-900">
                                {att.filename || "Attachment"}
                              </div>
                              <a
                                href={url}
                                download
                                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                <FaDownload /> Download
                              </a>
                            </div>
                            <div className="mt-2">
                              <button
                                onClick={() =>
                                  onPreview({
                                    url,
                                    filename: att.filename,
                                    mimeType: att.mimeType,
                                  })
                                }
                                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Reply */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {lastMsg && (
          <div className="text-xs text-gray-600 mb-2">
            Replying to last message from{" "}
            <span className="font-medium">{lastMsgSender}</span>
          </div>
        )}
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white shadow-inner"
            placeholder="Type your reply..."
          />
          <button
            onClick={handleQuickSend}
            disabled={!draft.trim() || sending}
            className="px-5 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 flex items-center shadow-md"
          >
            {sending ? <ImSpinner className="animate-spin" /> : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ===================== MAIN ===================== */
const EmailContent = () => {
  const [accountEmail, setAccountEmail] = useState("");
  const [threads, setThreads] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [nextToken, setNextToken] = useState(null);

  const [emails, setEmails] = useState([]);
  const [emailsNext, setEmailsNext] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [bgRefreshing, setBgRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [selectedThread, setSelectedThread] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewMode, setViewMode] = useState("threads");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Track unread replies per thread
  const [unreadReplies, setUnreadReplies] = useState({});

  // Reply drafts keyed by threadId (persist to localStorage)
  const [replyDrafts, setReplyDrafts] = useState({});
  const currentDraft = selectedThread
    ? replyDrafts[selectedThread.id] || ""
    : "";
  const setCurrentDraft = (v) => {
    if (!selectedThread) return;
    setReplyDrafts((prev) => ({ ...prev, [selectedThread.id]: v }));
    try {
      localStorage.setItem(`draft:${selectedThread.id}`, v);
    } catch {}
  };

  // New arrivals tray
  const [newItems, setNewItems] = useState([]);
  const latestNewThreadIdRef = useRef("");

  const addNewItem = useCallback((item) => {
    setNewItems((prev) => {
      if (prev.some((x) => x.uniq === item.uniq)) return prev;
      const next = [item, ...prev].slice(0, 300);
      return next;
    });
  }, []);
  const clearNewItems = useCallback(() => setNewItems([]), []);
  const newItemsSorted = useMemo(
    () => [...newItems].sort((a, b) => b.ts - a.ts),
    [newItems]
  );

  // Toasts
  const { toasts, push: pushToast, remove: removeToast } = useToast();

  // Attachment viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const openViewer = (file) => {
    setViewerFile(file);
    setViewerOpen(true);
  };

  // Ding
  const { play: playDing } = useNotificationSound("/sounds/1.mp3");

  // Desktop notifications
  const {
    supported: notifSupported,
    permission: notifPermission,
    request: requestNotif,
    notify,
  } = useDesktopNotifications();

  // Logs
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const log = (msg, level = "info", source = "ui") => {
    const d = new Date();
    const ts = `${d.toLocaleTimeString([], { hour12: false })}.${String(
      d.getMilliseconds()
    ).padStart(3, "0")}`;
    setLogs((prev) => [...prev, { ts, level, source, msg }]);
  };

  // Track last viewed message count per thread
  const [lastViewedCount, setLastViewedCount] = useState({});

  // Calculate unread replies when threads or last viewed counts change
  useEffect(() => {
    const newUnreadReplies = {};

    threads.forEach((thread) => {
      const lastViewed = lastViewedCount[thread.id] || 0;
      const currentCount = thread.messageCount || 0;
      const unreadCount = Math.max(0, currentCount - lastViewed);

      if (unreadCount > 0) {
        newUnreadReplies[thread.id] = unreadCount;
      }
    });

    setUnreadReplies(newUnreadReplies);
  }, [threads, lastViewedCount]);

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThread) {
      setLastViewedCount((prev) => ({
        ...prev,
        [selectedThread.id]: selectedThread.messageCount,
      }));

      // Clear unread count for this thread
      setUnreadReplies((prev) => {
        const newUnreads = { ...prev };
        delete newUnreads[selectedThread.id];
        return newUnreads;
      });
    }
  }, [selectedThread]);

  const composeGmailQuery = () => searchTerm || "";

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch(`/api/google/gmail?op=account`, {
        cache: "no-store",
      });
      const data = await res.json();
      setAccountEmail(data.email || "");
      log("Account loaded", "api", "gmail");
    } catch (e) {
      log(`Account fetch failed: ${e?.message || e}`, "error", "gmail");
    }
  }, []);

  const agentName = useMemo(() => {
    const prefix = (accountEmail || "").split("@")[0] || "Support";
    return prefix;
  }, [accountEmail]);

  const isIncomingFromOther = useCallback(
    (from) => {
      if (!from) return true;
      if (!accountEmail) return true;
      return !from.toLowerCase().includes(accountEmail.toLowerCase());
    },
    [accountEmail]
  );

  /** ===================== URL helpers & deep-link ===================== */
  const getUrlWithThread = useCallback((threadId) => {
    const url = new URL(window.location.href);
    url.searchParams.set("threadId", threadId);
    return url.toString();
  }, []);

  const pushThreadUrl = useCallback((tid, mode = "push") => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("threadId", tid);
      if (mode === "replace") {
        window.history.replaceState({}, "", url.toString());
      } else {
        window.history.pushState({}, "", url.toString());
      }
    } catch {}
  }, []);

  const openThreadById = useCallback(
    async (threadId, { urlMode = "push" } = {}) => {
      try {
        log(`Open thread ${threadId}`, "api", "gmail");
        const res = await fetch(
          `/api/google/gmail?op=thread&threadId=${encodeURIComponent(
            threadId
          )}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        const normalized = normalizeThreadDetailToUI(
          data,
          accountEmail,
          (statuses[threadId] && statuses[threadId].status) || "active"
        );

        setSelectedThread(normalized);

        // hydrate draft from localStorage if missing
        setReplyDrafts((prev) => {
          if (prev[normalized.id] !== undefined) return prev;
          let ls = "";
          try {
            ls = localStorage.getItem(`draft:${normalized.id}`) || "";
          } catch {}
          return { ...prev, [normalized.id]: ls };
        });

        pushThreadUrl(threadId, urlMode);

        // Remove any "new" tray entries for this thread
        setNewItems((prev) => prev.filter((x) => x.threadId !== threadId));
      } catch (e) {
        log(`Open thread failed: ${e?.message || e}`, "error", "gmail");
      }
    },
    [accountEmail, statuses, pushThreadUrl]
  );

  // Open by URL on mount and on back/forward
  useEffect(() => {
    const openFromUrl = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const tid = sp.get("threadId");
        if (tid) {
          openThreadById(tid, { urlMode: "replace" });
        }
      } catch {}
    };
    openFromUrl();

    const onPop = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const tid = sp.get("threadId");
        if (tid) {
          openThreadById(tid, { urlMode: "replace" });
        } else {
          setSelectedThread(null);
        }
      } catch {}
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openThreadById]);

  // Convenience: open newest from tray
  const openNewestOrSpecific = useCallback(
    (fallbackTid) => {
      const newest = newItemsSorted[0];
      const tid = (newest && newest.threadId) || fallbackTid;
      if (tid) openThreadById(tid);
    },
    [newItemsSorted, openThreadById]
  );

  useEffect(() => {
    if (newItemsSorted.length)
      latestNewThreadIdRef.current = newItemsSorted[0].threadId;
  }, [newItemsSorted]);

  /** ===================== Merge helpers (notifications + New tray) ===================== */
  const mergeThreadsIncremental = useCallback(
    (incoming) => {
      setThreads((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t]));
        let anyChange = false;

        for (const t of incoming) {
          const old = byId.get(t.id);
          const last = t.lastMessage || {};
          const lastFrom = last.from || "";
          const lastName = parseNameFromHeader(lastFrom);
          const lastSubj = last.subject || last.snippet || "New message";
          const lastId = last.id || `${t.id}:${t.messageCount || 0}`;
          const lastTs =
            (last.internalDate && +new Date(last.internalDate)) || Date.now();

          if (!old) {
            byId.set(t.id, t);
            anyChange = true;

            addNewItem({
              uniq: `thread-new:${lastId}`,
              threadId: t.id,
              ts: lastTs,
              fromName: lastName,
              subject: lastSubj,
              preview: last.snippet || "",
              kind: "thread",
            });

            const url = getUrlWithThread(t.id);
            notify(`New query from ${lastName}`, {
              body: lastSubj,
              tag: `thread-${t.id}-${Date.now()}`,
              url,
              data: { threadId: t.id },
            });
            if (isIncomingFromOther(lastFrom)) playDing();
            continue;
          }

          const oldLast = old.lastMessage?.id || "";
          const newLast = t.lastMessage?.id || "";
          if (old.messageCount !== t.messageCount || oldLast !== newLast) {
            byId.set(t.id, t);
            anyChange = true;

            addNewItem({
              uniq: `thread-msg:${lastId}`,
              threadId: t.id,
              ts: lastTs,
              fromName: lastName,
              subject: lastSubj,
              preview: last.snippet || "",
              kind: "message",
            });

            const title = isIncomingFromOther(lastFrom)
              ? `New message from ${lastName}`
              : `${agentName} responded`;
            const url = getUrlWithThread(t.id);
            notify(title, {
              body: lastSubj,
              tag: `thread-${t.id}-${Date.now()}`,
              url,
              data: { threadId: t.id },
            });
            if (isIncomingFromOther(lastFrom)) playDing();
          }
        }

        return anyChange ? Array.from(byId.values()) : prev;
      });
    },
    [
      isIncomingFromOther,
      playDing,
      notify,
      agentName,
      addNewItem,
      getUrlWithThread,
    ]
  );

  const mergeOpenThreadDetail = useCallback(
    (fresh) => {
      setSelectedThread((curr) => {
        if (!curr || curr.id !== fresh.id) return curr;
        const existing = new Set((curr.messages || []).map((m) => m.id));
        const add = (fresh.messages || []).filter((m) => !existing.has(m.id));
        if (!add.length) return curr;

        const last = add[add.length - 1];
        if (last) {
          const bodyPreview = (last.body || "").slice(0, 140);
          const lastTs =
            (last.headers?.date && +new Date(last.headers?.date)) || Date.now();

          addNewItem({
            uniq: `open-merge:${last.id}`,
            threadId: fresh.id,
            ts: lastTs,
            fromName: last.fromName || "user",
            subject: fresh.subject || "(No subject)",
            preview: bodyPreview,
            kind: last.type === "incoming" ? "message" : "agent",
          });

          const title =
            last.type === "incoming"
              ? `New message from ${last.fromName || "user"}`
              : `${agentName} responded`;
          const url = getUrlWithThread(fresh.id);
          notify(title, {
            body: bodyPreview,
            tag: `thread-${fresh.id}-${Date.now()}`,
            url,
            data: { threadId: fresh.id },
          });
          if (last.type === "incoming") playDing();
        }

        return {
          ...curr,
          messages: [...curr.messages, ...add],
          messageCount: fresh.messageCount,
          subject: fresh.subject || curr.subject,
          participant: fresh.participant || curr.participant,
          participantEmail: fresh.participantEmail || curr.participantEmail,
          source: fresh.source || curr.source,
        };
      });
    },
    [playDing, notify, agentName, addNewItem, getUrlWithThread]
  );

  /** ===================== Normalizer (detail) ===================== */
  function normalizeThreadDetailToUI(raw, myEmail, status) {
    const msgs = (raw.messages || []).map((m) => {
      const from = m.headers?.from || "";
      const isOutgoing =
        from.toLowerCase().includes((myEmail || "").toLowerCase()) ||
        (m.labelIds || []).includes("SENT");
      const body = m.body?.textHtml || m.body?.textPlain || "";
      const formData = extractFormData(body);
      const date =
        m.headers?.date ||
        (m.internalDate
          ? new Date(m.internalDate).toUTCString()
          : new Date().toUTCString());
      return {
        id: m.id,
        headers: m.headers,
        labelIds: m.labelIds || [],
        body,
        attachments: m.attachments || [],
        formData,
        type: isOutgoing ? "outgoing" : "incoming",
        fromName: parseNameFromHeader(from),
        date,
      };
    });

    const firstOther = msgs.find(
      (x) =>
        !parseEmailFromHeader(x.headers?.from || "").includes(
          (myEmail || "").toLowerCase()
        )
    );

    const formSubject = msgs
      .map((x) => x.formData?.subject)
      .find((s) => !!(s && s.trim()));
    const formEmail = msgs
      .map((x) => x.formData?.email)
      .find((s) => !!(s && s.trim()));
    const formName = msgs
      .map((x) => x.formData?.name)
      .find((s) => !!(s && s.trim()));

    const lastNonEmptySub =
      msgs
        .map((x) => x.headers?.subject)
        .filter(Boolean)
        .slice(-1)[0] || "(No subject)";
    const isFormThread = msgs.some((m) => m.formData?.isStructuredForm);

    const subject = isFormThread
      ? formSubject || lastNonEmptySub
      : lastNonEmptySub;

    const participant = isFormThread
      ? formName ||
        parseNameFromHeader(
          firstOther?.headers?.from || msgs[0]?.headers?.from || ""
        )
      : parseNameFromHeader(
          firstOther?.headers?.from || msgs[0]?.headers?.from || ""
        );

    const participantEmail = isFormThread
      ? formEmail ||
        parseEmailFromHeader(
          firstOther?.headers?.from || msgs[0]?.headers?.from || ""
        )
      : parseEmailFromHeader(
          firstOther?.headers?.from || msgs[0]?.headers?.from || ""
        );

    return {
      id: raw.threadId,
      subject,
      participant,
      participantEmail,
      messages: msgs,
      messageCount: msgs.length,
      status: status || "active",
      source: isFormThread ? "form" : "manual",
    };
  }

  /** ===================== Fetchers ===================== */
  const fetchThreads = useCallback(
    async (reset = true) => {
      try {
        reset
          ? log("Fetch threads (reset)...", "api", "gmail")
          : log("Fetch threads (next page)...", "api", "gmail");
        const params = new URLSearchParams({
          op: "threads",
          q: composeGmailQuery(),
          labelIds: "INBOX,SENT",
          max: "25",
        });
        if (!reset && nextToken) params.set("pageToken", nextToken);

        const res = await fetch(`/api/google/gmail?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch threads");
        const data = await res.json();

        const newThreads = data.threads || [];
        setThreads((prev) => (reset ? newThreads : [...prev, ...newThreads]));
        setNextToken(data.nextPageToken || null);
        setLastUpdated(new Date().toLocaleTimeString());

        // statuses for newly seen ids
        const existing = new Set(Object.keys(statuses));
        const ids = newThreads
          .map((t) => t.id)
          .filter((id) => id && !existing.has(id));
        if (ids.length) {
          const sp = new URLSearchParams({
            op: "status",
            threadIds: ids.join(","),
            account: "me",
          });
          const sres = await fetch(`/api/google/gmail?${sp.toString()}`, {
            cache: "no-store",
          });
          const sdata = await sres.json();
          setStatuses((prev) => ({ ...prev, ...(sdata.statuses || {}) }));
          log(
            `Applied ${Object.keys(sdata.statuses || {}).length} statuses`,
            "db",
            "firestore"
          );
        }

        log(`Threads fetched: ${newThreads.length}`, "api", "gmail");
      } catch (e) {
        log(`Thread fetch error: ${e?.message || e}`, "error", "gmail");
      }
    },
    [nextToken, searchTerm, statuses]
  );

  const fetchMessages = useCallback(
    async (reset = true) => {
      try {
        reset
          ? log("Fetch messages (INBOX reset)...", "api", "gmail")
          : log("Fetch messages (INBOX next)...", "api", "gmail");
        const params = new URLSearchParams({
          op: "messages",
          q: composeGmailQuery(),
          labelIds: "INBOX",
          max: "25",
        });
        if (!reset && emailsNext) params.set("pageToken", emailsNext);

        const res = await fetch(`/api/google/gmail?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();

        setEmails((prev) =>
          reset ? data.messages || [] : [...prev, ...(data.messages || [])]
        );
        setEmailsNext(data.nextPageToken || null);
        log(`Messages fetched: ${data.messages?.length || 0}`, "api", "gmail");
      } catch (e) {
        log(`Messages fetch error: ${e?.message || e}`, "error", "gmail");
      }
    },
    [emailsNext, searchTerm]
  );

  // Initial load
  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      await fetchAccount();
      await Promise.all([fetchThreads(true), fetchMessages(true)]);
      setInitialLoading(false);
    })();
  }, []); // eslint-disable-line

  // Auto background refresh every 15s
  const refreshIncremental = useCallback(async () => {
    try {
      setBgRefreshing(true);

      // page 1 threads for merge
      const tp = new URLSearchParams({
        op: "threads",
        q: composeGmailQuery(),
        labelIds: "INBOX,SENT",
        max: "25",
      });
      const tRes = await fetch(`/api/google/gmail?${tp.toString()}`, {
        cache: "no-store",
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        mergeThreadsIncremental(tData.threads || []);
      }

      // open thread refresh
      if (selectedThread?.id) {
        const r = await fetch(
          `/api/google/gmail?op=thread&threadId=${encodeURIComponent(
            selectedThread.id
          )}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const data = await r.json();
          const normalized = normalizeThreadDetailToUI(
            data,
            accountEmail,
            selectedThread.status
          );
          mergeOpenThreadDetail(normalized);
        }
      }

      // messages pane (unthreaded/new)
      const mp = new URLSearchParams({
        op: "messages",
        q: composeGmailQuery(),
        labelIds: "INBOX",
        max: "25",
      });
      const mRes = await fetch(`/api/google/gmail?${mp.toString()}`, {
        cache: "no-store",
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setEmails((prev) => {
          const have = new Set(prev.map((m) => m.id));
          const add = (mData.messages || []).filter((m) => !have.has(m.id));
          if (add.length) {
            // push each into "New" tray + one OS notification (newest)
            add.forEach((msg) => {
              const name = parseNameFromHeader(msg.headers?.from || "");
              const subj = msg.headers?.subject || msg.snippet || "New email";
              const tid = msg.threadId || msg.id;
              const ts = msg.internalDate
                ? +new Date(msg.internalDate)
                : Date.now();
              addNewItem({
                uniq: `msg:${msg.id}`,
                threadId: tid,
                ts,
                fromName: name,
                subject: subj,
                preview: msg.snippet || "",
                kind: "email",
              });
            });

            const first = add[0];
            const firstName = parseNameFromHeader(first.headers?.from || "");
            const firstSubj =
              first.headers?.subject || first.snippet || "New email";
            const url = getUrlWithThread(first.threadId || first.id);
            notify(`New email from ${firstName}`, {
              body: firstSubj,
              tag: `msg-${first.threadId || first.id}-${Date.now()}`,
              url,
              data: { threadId: first.threadId || first.id },
            });
            playDing();
          }
          return add.length ? [...add, ...prev] : prev;
        });
      }

      setLastUpdated(new Date().toLocaleTimeString());
      log("Incremental refresh complete", "api", "gmail");
    } catch (e) {
      log(`Incremental refresh error: ${e?.message || e}`, "error", "gmail");
    } finally {
      setBgRefreshing(false);
    }
  }, [
    composeGmailQuery,
    mergeThreadsIncremental,
    selectedThread?.id,
    accountEmail,
    mergeOpenThreadDetail,
    playDing,
    notify,
    addNewItem,
    getUrlWithThread,
  ]);

  useEffect(() => {
    const id = setInterval(() => void refreshIncremental(), 15000);
    return () => clearInterval(id);
  }, [refreshIncremental]);

  const handleThreadClick = async (t) => {
    await openThreadById(t.id);
  };

  const handleEmailClick = async (msg) => {
    await openThreadById(msg.threadId);
  };

  const handleManualRefresh = async () => {
    log("Manual refresh", "info", "ui");
    setBgRefreshing(true);
    await Promise.all([fetchThreads(true), fetchMessages(true)]);
    setBgRefreshing(false);
  };

  const updateStatus = async (threadId, status) => {
    try {
      const res = await fetch(`/api/google/gmail?op=status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      setStatuses((prev) => ({
        ...prev,
        [threadId]: { ...(prev[threadId] || {}), status },
      }));
      setSelectedThread((prev) =>
        prev?.id === threadId ? { ...prev, status } : prev
      );
      log(`Status set to ${status} for ${threadId}`, "db", "firestore");
    } catch (e) {
      log(`Status update error: ${e?.message || e}`, "error", "gmail");
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const res = await fetch(
        `/api/google/gmail?op=delete&type=thread&id=${encodeURIComponent(
          threadId
        )}&hard=false&andStatus=true`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Thread delete failed");
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      setSelectedThread(null);
      log(`Trashed thread ${threadId}`, "api", "gmail");
    } catch (e) {
      log(`Delete thread error: ${e?.message || e}`, "error", "gmail");
      throw e;
    }
  };

  const sendReply = async (emailOrThread, replyText, _files) => {
    try {
      log("Sending reply...", "email", "gmail");
      let threadId = emailOrThread.threadId || emailOrThread.id;

      // Prefer recipient from the FORM payload if this is a form thread
      let formEmailFromThread = "";
      if (selectedThread?.source === "form") {
        for (let i = (selectedThread.messages || []).length - 1; i >= 0; i--) {
          const e = selectedThread.messages[i]?.formData?.email;
          if (e && e.trim()) {
            formEmailFromThread = e.trim();
            break;
          }
        }
      }

      let toEmail =
        formEmailFromThread ||
        emailOrThread.formData?.email ||
        selectedThread?.participantEmail ||
        parseEmailFromHeader(
          emailOrThread.headers?.from || emailOrThread.from || ""
        );

      let inReplyTo = "";
      let references = "";
      if (selectedThread?.messages?.length) {
        const last =
          selectedThread.messages[selectedThread.messages.length - 1];
        inReplyTo = last.headers?.messageId || "";
        references = last.headers?.references || "";
        if (inReplyTo && references && !references.includes(inReplyTo))
          references = `${references} ${inReplyTo}`;
        threadId = selectedThread.id;
      }

      // Subject: if FORM, take from payload content
      let formSubjectFromThread = "";
      if (selectedThread?.source === "form") {
        for (let i = 0; i < (selectedThread.messages || []).length; i++) {
          const s = selectedThread.messages[i]?.formData?.subject;
          if (s && s.trim()) {
            formSubjectFromThread = s.trim();
            break;
          }
        }
      }

      const subject =
        (selectedThread?.source === "form" && formSubjectFromThread) ||
        emailOrThread.formData?.subject ||
        selectedThread?.subject ||
        emailOrThread.subject ||
        "Your inquiry";

      const htmlTemplate = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <title>Reply</title>
            <div style="padding: 18px; text-align: center; background:#f59e0b; color:#fff; border-radius: 12px 12px 0 0;">
              <h1 style="margin:0; font-size: 18px;">Support Response</h1>
            </div>
            <div style="padding: 20px; background: white; border-radius: 0 0 12px 12px; border:1px solid #e5e7eb; border-top:0;">
              <p style="font-size: 14px; color: #111827; margin-bottom: 12px;">Dear ${
                selectedThread?.participant || "User"
              },</p>
              <div style="background:#f8fafc; border-left: 4px solid #f59e0b; padding: 14px; margin: 12px 0; border-radius: 6px;">
                <!--REPLY_PAYLOAD_START-->
                <div style="color:#1f2937; line-height: 1.6; font-size: 14px;">${replyText
                  .replace(/\n/g, "<br/>")
                  .trim()}</div>
                <!--REPLY_PAYLOAD_END-->
              </div>
              <p style="font-size: 14px; color:#374151; margin-top: 20px;">
                Best regards,<br/>
                <strong>Support Team</strong>
              </p>
            </div>
          </div>
        `;

      const meta = {
        to: [toEmail],
        subject: `${subject}`,
        text: replyText,
        html: htmlTemplate,
        threadId,
        inReplyTo,
        references,
      };

      const form = new FormData();
      form.set("metadata", JSON.stringify(meta));

      const res = await fetch(`/api/google/gmail?op=send`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Send failed");
      log("Reply sent", "email", "gmail");

      // Refresh this thread and merge
      if (selectedThread?.id) {
        const r = await fetch(
          `/api/google/gmail?op=thread&threadId=${encodeURIComponent(
            selectedThread.id
          )}`,
          { cache: "no-store" }
        );
        const data = await r.json();
        const normalized = normalizeThreadDetailToUI(
          data,
          accountEmail,
          selectedThread.status
        );
        setSelectedThread((prev) => {
          if (!prev || prev.id !== normalized.id) return prev;
          const have = new Set(prev.messages.map((m) => m.id));
          const add = (normalized.messages || []).filter(
            (m) => !have.has(m.id)
          );
          return add.length
            ? {
                ...prev,
                messages: [...prev.messages, ...add],
                messageCount: normalized.messageCount,
              }
            : prev;
        });
      } else {
        await fetchThreads(true);
      }
    } catch (e) {
      log(`Send error: ${e?.message || e}`, "error", "gmail");
      throw e;
    }
  };

  /** ===================== Derived lists ===================== */
  const normalizedThreads = useMemo(() => {
    const items = (threads || []).map((t) => {
      const last = t.lastMessage || {};
      const from = last.from || "";
      const snippetForm = extractFormData(last.snippet || "");
      const isForm = snippetForm.isStructuredForm;

      const headerSubject = last.subject || "(No subject)";
      const subject = isForm
        ? snippetForm.subject || headerSubject
        : headerSubject;

      const fallbackName = parseNameFromHeader(from);
      const fallbackEmail = parseEmailFromHeader(from);
      const name = isForm ? snippetForm.name || fallbackName : fallbackName;
      const email = isForm ? snippetForm.email || fallbackEmail : fallbackEmail;

      const status = (statuses[t.id] && statuses[t.id].status) || "active";
      const lastAt = last.internalDate
        ? new Date(last.internalDate)
        : new Date();
      const source = isForm ? "form" : "manual";
      const unreadCount = unreadReplies[t.id] || 0;

      return {
        id: t.id,
        subject,
        participant: name,
        participantEmail: email,
        messageCount: t.messageCount,
        lastActivity: lastAt.toISOString(),
        status,
        hasAttachments: !!last.hasAttachments,
        source,
        unreadCount,
        raw: t,
      };
    });

    const s = searchTerm.toLowerCase();
    return items.filter(
      (it) =>
        it.subject.toLowerCase().includes(s) ||
        it.participant.toLowerCase().includes(s) ||
        it.participantEmail.toLowerCase().includes(s) ||
        it.raw.lastMessage?.snippet?.toLowerCase().includes(s)
    );
  }, [threads, statuses, searchTerm, unreadReplies]);

  const multiMsgThreadIds = useMemo(() => {
    const s = new Set();
    for (const t of threads) {
      if ((t.messageCount || 0) > 1) s.add(t.id);
    }
    return s;
  }, [threads]);

  const isThreadedEmail = useCallback(
    (msg) => {
      if (!msg) return false;
      if (multiMsgThreadIds.has(msg.threadId)) return true;

      const h = msg.headers || {};
      const hasHeader = (k) =>
        Object.prototype.hasOwnProperty.call(h, k) ||
        Object.prototype.hasOwnProperty.call(h, k.toLowerCase()) ||
        Object.prototype.hasOwnProperty.call(h, k.toUpperCase());

      if (
        hasHeader("In-Reply-To") ||
        hasHeader("inReplyTo") ||
        hasHeader("References")
      )
        return true;
      const subj = (h.subject || "").toLowerCase();
      if (/^(re|fwd):/.test(subj)) return true;
      return false;
    },
    [multiMsgThreadIds]
  );

  const allEmailsOnly = useMemo(
    () => emails.filter((m) => !isThreadedEmail(m)),
    [emails, isThreadedEmail]
  );

  /** ===================== Left & Right panes ===================== */
  const LeftList = (
    <div className="h-full flex flex-col">
      {/* Notification permission banner */}
      {notifSupported && notifPermission !== "granted" && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-xs text-yellow-900 flex items-center justify-between">
          <div>
            Desktop alerts are <b>{notifPermission}</b>. Enable them to see
            Windows toasts for new emails.
          </div>
          <button
            onClick={async () => {
              await requestNotif();
            }}
            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Enable alerts
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "threads" ? (
          <div className="divide-y divide-gray-100">
            {normalizedThreads.length === 0 && !initialLoading && (
              <div className="p-6 text-center text-gray-500">
                No threads found
              </div>
            )}
            {normalizedThreads.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThreadClick(t)}
                className={`w-full text-left p-4 hover:bg-gray-50 flex items-start gap-3 transition-colors ${
                  selectedThread?.id === t.id
                    ? "bg-amber-50 border-l-4 border-l-amber-500"
                    : t.unreadCount > 0
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.unreadCount > 0
                      ? "bg-blue-100 border border-blue-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <FaComments
                    className={
                      t.unreadCount > 0 ? "text-blue-700" : "text-amber-700"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 truncate">
                      {t.participant}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(t.lastActivity).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 truncate">
                    {t.subject}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        t.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : t.status === "active"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        t.source === "form"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {t.source === "form" ? "FORM" : "MANUAL"}
                    </span>
                    {!!t.hasAttachments && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        Attachments
                      </span>
                    )}
                    {t.unreadCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium">
                        {t.unreadCount} new
                      </span>
                    )}
                    <span
                      className={`text-gray-500 ${
                        t.unreadCount > 0 ? "ml-2" : "ml-auto"
                      }`}
                    >
                      {t.messageCount} msgs
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {nextToken && (
              <div className="p-3 border-t bg-white">
                <button
                  onClick={() => fetchThreads(false)}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allEmailsOnly.map((m) => {
              const fromName = parseNameFromHeader(m.headers?.from || "");
              const subject = m.headers?.subject || "(No subject)";
              return (
                <button
                  key={m.id}
                  onClick={() => handleEmailClick(m)}
                  className="w-full text-left p-4 hover:bg-gray-50 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <FaUser className="text-amber-700 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900 truncate">
                        {fromName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {m.internalDate
                          ? new Date(m.internalDate).toLocaleTimeString()
                          : ""}
                      </div>
                    </div>
                    <div className="text-sm text-gray-800 truncate">
                      {subject}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {m.snippet}
                    </div>
                  </div>
                </button>
              );
            })}
            {emailsNext && (
              <div className="p-3 border-t bg-white">
                <button
                  onClick={() => fetchMessages(false)}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const issuesHref = `/admin/dashboard/issues/${encodeURIComponent(
    selectedThread?.participantEmail || ""
  )}`;

  const onOpenInIssues = (e) => {
    if (!selectedThread) {
      e.preventDefault();
      pushToast('Select a thread before using "Open in Issues"', "warn");
      return;
    }
    try {
      if (typeof window !== "undefined" && selectedThread?.participantEmail) {
        window.sessionStorage.setItem(
          "issues_prefill_email",
          selectedThread.participantEmail
        );
      }
    } catch {}
  };

  const RightThread = (
    <div className="h-full bg-white">
      <ThreadPanel
        thread={selectedThread}
        draft={currentDraft}
        onDraftChange={setCurrentDraft}
        onSend={sendReply}
        onUpdateStatus={updateStatus}
        onDeleteThread={deleteThread}
        incrementSolved={async () => {
          try {
            const ref = doc(db, "overallstats", "overallstats");
            await updateDoc(ref, { TotalSolvedQueries: increment(1) });
            log("Stats +1 solved", "db", "firestore");
          } catch (e) {
            log(
              `Stats increment failed: ${e?.message || e}`,
              "error",
              "firestore"
            );
          }
        }}
        onPreview={openViewer}
      />
    </div>
  );

  return (
    <AdminProtectedRoutes>
      <SidebarWrapper>
        <div className="min-h-screen bg-gray-50">
          <div className="flex flex-col mx-auto  py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  Email Communication Hub
                </h1>
                <div className="text-sm text-gray-600">
                  {initialLoading
                    ? "Preparing…"
                    : bgRefreshing
                    ? "Syncing…"
                    : "Idle"}
                </div>
              </div>

              {/* Tools bar */}
              <div className="px-4 py-3 border-b flex items-center gap-3 bg-white sticky top-0 z-10">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Search ${
                      viewMode === "threads" ? "threads" : "emails"
                    }`}
                    className="w-full pl-3 pr-12 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {bgRefreshing ? "Sync…" : ""}
                  </div>
                </div>

                <a
                  href={issuesHref}
                  onClick={onOpenInIssues}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md text-sm bg-yellow-600 text-white hover:bg-yellow-700"
                  title="Open this user in Issues and auto-search their email"
                >
                  Open in Issues
                </a>

                <button
                  onClick={() => setViewMode("threads")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "threads"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Threads
                </button>

                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewMode === "all"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  All Emails
                </button>

                <button
                  onClick={handleManualRefresh}
                  className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                  title="Refresh"
                >
                  {bgRefreshing ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  onClick={() => setShowLogs((s) => !s)}
                  className="px-3 py-1.5 rounded-md bg-gray-900 text-white"
                >
                  Console
                </button>
              </div>

              {/* Split Pane */}
              <SplitPane
                className="h-[100vh] max-w-full w-full"
                left={LeftList}
                right={RightThread}
              />
            </div>
          </div>

          {/* Attachment Viewer */}
          <AttachmentViewer
            open={viewerOpen}
            file={viewerFile}
            onClose={() => setViewerOpen(false)}
          />

          {/* Terminal Console */}
          <TerminalLogDock
            logs={logs}
            open={showLogs}
            onClose={() => setShowLogs(false)}
          />

          {/* Toasts */}
          <ToastHost toasts={toasts} remove={removeToast} />
        </div>
      </SidebarWrapper>
    </AdminProtectedRoutes>
  );
};

const EmailQueries = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-4 text-gray-800 bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          <ImSpinner className="animate-spin text-3xl text-amber-600" />
          <span className="text-lg font-semibold">Loading Email Hub...</span>
        </div>
      </div>
    }
  >
    <EmailContent />
  </Suspense>
);

export default EmailQueries;
