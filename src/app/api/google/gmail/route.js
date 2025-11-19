// app/api/google/gmail/route.js
export const runtime = "nodejs";

import { google } from "googleapis";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ---------------- OAuth / Gmail clients ---------------- */
async function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/callback/google"; // <-- fixed (no stray space)
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    const err = new Error("Missing Google OAuth client credentials");
    err.status = 500;
    throw err;
  }
  if (!refreshToken) {
    const err = new Error("Missing refresh token");
    err.status = 401;
    err.payload = {
      error: "Missing refresh token",
      action: "Visit /api/auth/google to reauthorize",
    };
    throw err;
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });
  await auth.getAccessToken(); // ensure an access token is minted/refreshed
  return auth;
}

async function getGmail() {
  const auth = await getAuth();
  return google.gmail({ version: "v1", auth });
}

async function getAccountEmail(gmail) {
  const prof = await gmail.users.getProfile({ userId: "me" });
  return prof.data.emailAddress || "me";
}

/* ---------------- Firebase (optional) ------------------ */
function getDbOrNull() {
  try {
    if (!getApps().length) {
      const sa = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;
      if (!sa) return null;
      initializeApp({ credential: cert(sa) });
    }
    return getFirestore();
  } catch {
    return null;
  }
}

/* ---------------- Helpers ------------------------------ */
function b64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function b64urlToBuf(data) {
  const base64 = (data || "").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}
function b64urlDecodeToUtf8(data) {
  return b64urlToBuf(data).toString("utf-8");
}
function header(headers, name, fallback = "") {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ||
    fallback
  );
}
function extractTextFromParts(parts = []) {
  let textPlain = null,
    textHtml = null;
  for (const part of parts) {
    const mime = part.mimeType || "";
    if (part.body?.data) {
      const decoded = b64urlDecodeToUtf8(part.body.data);
      if (mime.startsWith("text/plain") && !textPlain) textPlain = decoded;
      if (mime.startsWith("text/html") && !textHtml) textHtml = decoded;
    }
    if (part.parts?.length) {
      const nested = extractTextFromParts(part.parts);
      if (!textPlain && nested.textPlain) textPlain = nested.textPlain;
      if (!textHtml && nested.textHtml) textHtml = nested.textHtml;
    }
  }
  return { textPlain, textHtml };
}
function getBody(payload) {
  if (!payload) return { textPlain: "", textHtml: "" };
  if (payload.body?.data) {
    const decoded = b64urlDecodeToUtf8(payload.body.data);
    const mime = payload.mimeType || "";
    if (mime.startsWith("text/html"))
      return { textPlain: "", textHtml: decoded };
    return { textPlain: decoded, textHtml: "" };
  }
  if (payload.parts?.length) {
    const { textPlain, textHtml } = extractTextFromParts(payload.parts);
    return { textPlain: textPlain || "", textHtml: textHtml || "" };
  }
  return { textPlain: "", textHtml: "" };
}
function buildMime({
  from,
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  inReplyTo,
  references,
  attachments,
}) {
  const boundaryMixed = "mixed_" + Math.random().toString(36).slice(2);
  const boundaryAlt = "alt_" + Math.random().toString(36).slice(2);
  const lines = [];

  lines.push(`From: ${from}`);
  lines.push(`To: ${to.join(", ")}`);
  if (cc?.length) lines.push(`Cc: ${cc.join(", ")}`);
  if (bcc?.length) lines.push(`Bcc: ${bcc.join(", ")}`);
  lines.push(`Subject: ${subject}`);
  lines.push(`MIME-Version: 1.0`);
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
  lines.push("");
  lines.push(`--${boundaryMixed}`);
  lines.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
  lines.push("");

  const safeText = text || (html ? "" : "(no content)");
  lines.push(`--${boundaryAlt}`);
  lines.push(`Content-Type: text/plain; charset="UTF-8"`);
  lines.push("");
  lines.push(safeText);
  lines.push("");

  if (html) {
    lines.push(`--${boundaryAlt}`);
    lines.push(`Content-Type: text/html; charset="UTF-8"`);
    lines.push("");
    lines.push(html);
    lines.push("");
  }
  lines.push(`--${boundaryAlt}--`);

  for (const att of attachments || []) {
    const mime = att.mimeType || "application/octet-stream";
    const rawB64 = att.dataBase64.replace(/^data:[^;]+;base64,/, "");
    lines.push("");
    lines.push(`--${boundaryMixed}`);
    lines.push(`Content-Type: ${mime}; name="${att.filename}"`);
    lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push("");
    lines.push(rawB64.replace(/\s/g, ""));
  }
  lines.push(`--${boundaryMixed}--`);
  lines.push("");

  const mimeStr = lines.join("\r\n");
  return b64urlEncode(mimeStr);
}

/* ---------------- Scope helpers ----------------------- */
const SCOPE_SEND = "https://www.googleapis.com/auth/gmail.send";
const SCOPE_MODIFY = "https://www.googleapis.com/auth/gmail.modify";
const SCOPE_READ = "https://www.googleapis.com/auth/gmail.readonly";
const SCOPE_FULL = "https://mail.google.com/";

function hasScope(scopes, wanted) {
  return scopes.includes(wanted) || scopes.includes(SCOPE_FULL);
}

async function getTokenScopes(auth) {
  const { token } = await auth.getAccessToken(); // { token: string | null }
  const tok = token || (await auth.getAccessToken()).token;
  if (!tok) return [];
  try {
    const info = await auth.getTokenInfo(tok);
    if (Array.isArray(info.scopes)) return info.scopes;
    if (info.scope) return String(info.scope).split(/\s+/).filter(Boolean);
  } catch {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?access_token=" + tok
    );
    const info = await r.json();
    return String(info.scope || "")
      .split(/\s+/)
      .filter(Boolean);
  }
}

function makeAuthUrl(scopes) {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/callback/google"
  );
  return oAuth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

/* ---------------- Collect Attachments (improved) ------ */
function collectAttachments(payload, acc = [], path = []) {
  if (!payload) return acc;
  const { parts = [], filename, mimeType, body, headers = [] } = payload;

  // Consider both regular and inline parts with attachmentId
  const hasAttachmentData = !!body?.attachmentId;
  const cid = headers.find(
    (h) => h.name?.toLowerCase() === "content-id"
  )?.value;
  const disp =
    headers.find((h) => h.name?.toLowerCase() === "content-disposition")
      ?.value || "";

  if (hasAttachmentData) {
    // Generate a safe fallback filename when Gmail doesn't provide one
    const safeName =
      filename && filename.trim()
        ? filename
        : `inline-${(payload.partId || path.join(".") || "0").replace(
            /\./g,
            "-"
          )}${
            mimeType?.includes("pdf")
              ? ".pdf"
              : mimeType?.startsWith("image/")
              ? ".img"
              : ".bin"
          }`;

    acc.push({
      filename: safeName,
      mimeType: mimeType || "application/octet-stream",
      size: body.size,
      attachmentId: body.attachmentId,
      partId: payload.partId || path.join(".") || "0",
      contentId: cid?.replace(/[<>]/g, ""),
      isInline: /inline/i.test(disp),
    });
  }

  if (parts?.length) {
    parts.forEach((p, i) =>
      collectAttachments(
        { ...p, partId: p.partId || `${payload.partId || "0"}.${i}` },
        acc,
        [...path, `${i}`]
      )
    );
  }
  return acc;
}

/* ---------------- GET ------------------------------- */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const op = searchParams.get("op");

    // Debug: which env is loaded
    if (op === "debugEnv") {
      const rt = process.env.GOOGLE_REFRESH_TOKEN || "";
      return json({
        clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
        hasRefreshToken: !!rt,
        refreshTokenPreview: rt ? rt.slice(0, 8) + "…" : null,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || "(default)",
      });
    }

    // Debug: live token scopes
    if (op === "debugScopes") {
      const auth = await getAuth();
      const gmail = google.gmail({ version: "v1", auth });
      const scopes = await getTokenScopes(auth);
      const who = await getAccountEmail(gmail);
      return json({ who, scopes });
    }

    // Give a reauth link
    if (op === "reauthUrl") {
      const url = makeAuthUrl([SCOPE_SEND, SCOPE_MODIFY, SCOPE_READ]);
      return json({ url });
    }

    const gmail = await getGmail();

    if (op === "account") {
      const email = await getAccountEmail(gmail);
      return json({ email });
    }

    if (op === "threads") {
      const q = searchParams.get("q") || "";
      const maxResults = Math.min(Number(searchParams.get("max") || 25), 100);
      const pageToken = searchParams.get("pageToken") || undefined;
      const labelIds = (searchParams.get("labelIds") || "INBOX,SENT")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const list = await gmail.users.threads.list({
        userId: "me",
        q,
        labelIds,
        pageToken,
        maxResults,
      });

      const threads = list.data.threads ?? [];
      if (threads.length === 0)
        return json({
          threads: [],
          nextPageToken: list.data.nextPageToken || null,
        });

      // Build a compact thread summary; fetch last message (full) to detect attachments reliably
      const full = await Promise.all(
        threads.map(async (thr) => {
          try {
            const tMeta = await gmail.users.threads.get({
              userId: "me",
              id: thr.id,
              format: "metadata",
              metadataHeaders: ["From", "To", "Subject", "Date", "Message-ID"],
            });

            const msgs = tMeta.data.messages || [];
            const last = msgs[msgs.length - 1];
            const lastId = last?.id;

            let from = "Unknown";
            let subject = "No subject";
            let date = "";
            let internalDate;

            if (last?.payload?.headers) {
              const headers = last.payload.headers;
              subject = header(headers, "Subject", "No subject");
              from = header(headers, "From", "Unknown");
              date = header(headers, "Date", "");
              internalDate = last?.internalDate
                ? Number(last.internalDate)
                : undefined;
            }

            let hasAttachments = false;
            if (lastId) {
              try {
                const fullLast = await gmail.users.messages.get({
                  userId: "me",
                  id: lastId,
                  format: "full",
                });
                hasAttachments =
                  collectAttachments(fullLast.data.payload).length > 0;
              } catch {
                hasAttachments = false;
              }
            }

            return {
              id: thr.id,
              historyId: tMeta.data.historyId,
              messageCount: msgs.length,
              lastMessage: {
                id: lastId,
                from,
                subject,
                date,
                internalDate,
                labelIds: last?.labelIds || [],
                hasAttachments,
                snippet: last?.snippet || "",
              },
            };
          } catch {
            return { id: thr.id, error: "Failed to load thread" };
          }
        })
      );

      return json({
        threads: full.filter((x) => !x.error),
        nextPageToken: list.data.nextPageToken || null,
      });
    }

    if (op === "thread") {
      const threadId = searchParams.get("threadId");
      if (!threadId) return bad("Missing threadId");

      const t = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: "full",
      });

      const messages = (t.data.messages || [])
        .map((m) => {
          const headers = m.payload?.headers ?? [];
          const { textPlain, textHtml } = getBody(m.payload);
          const attachments = collectAttachments(m.payload);
          return {
            id: m.id,
            threadId: m.threadId,
            labelIds: m.labelIds || [],
            snippet: m.snippet || "",
            internalDate: m.internalDate ? Number(m.internalDate) : undefined,
            headers: {
              from: header(headers, "From", "Unknown"),
              to: header(headers, "To", ""),
              cc: header(headers, "Cc", ""),
              bcc: header(headers, "Bcc", ""),
              subject: header(headers, "Subject", "No subject"),
              date: header(headers, "Date", ""),
              messageId: header(headers, "Message-ID", ""),
              inReplyTo: header(headers, "In-Reply-To", ""),
              references: header(headers, "References", ""),
            },
            body: { textPlain, textHtml },
            attachments,
          };
        })
        .sort((a, b) => (a.internalDate || 0) - (b.internalDate || 0));

      return json({ threadId, count: messages.length, messages });
    }

    if (op === "messages") {
      const q = searchParams.get("q") || "";
      const maxResults = Math.min(Number(searchParams.get("max") || 25), 100);
      const pageToken = searchParams.get("pageToken") || undefined;
      const labelIds = (searchParams.get("labelIds") || "INBOX")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const list = await gmail.users.messages.list({
        userId: "me",
        q,
        labelIds,
        pageToken,
        maxResults,
      });

      const items = list.data.messages || [];
      const messages = await Promise.all(
        items.map(async (it) => {
          const m = await gmail.users.messages.get({
            userId: "me",
            id: it.id,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date", "Message-ID"],
          });
          const h = m.data.payload?.headers ?? [];
          return {
            id: m.data.id,
            threadId: m.data.threadId,
            snippet: m.data.snippet || "",
            internalDate: m.data.internalDate
              ? Number(m.data.internalDate)
              : undefined,
            labelIds: m.data.labelIds || [],
            headers: {
              from: header(h, "From", "Unknown"),
              to: header(h, "To", ""),
              subject: header(h, "Subject", "No subject"),
              date: header(h, "Date", ""),
              messageId: header(h, "Message-ID", ""),
            },
          };
        })
      );

      return json({ messages, nextPageToken: list.data.nextPageToken || null });
    }

    if (op === "message") {
      const messageId = searchParams.get("messageId");
      if (!messageId) return bad("Missing messageId");

      const m = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });
      const headers = m.data.payload?.headers ?? [];
      const { textPlain, textHtml } = getBody(m.data.payload);
      const attachments = collectAttachments(m.data.payload);
      return json({
        id: m.data.id,
        threadId: m.data.threadId,
        labelIds: m.data.labelIds || [],
        snippet: m.data.snippet || "",
        internalDate: m.data.internalDate ? Number(m.data.internalDate) : null,
        headers: {
          from: header(headers, "From", "Unknown"),
          to: header(headers, "To", ""),
          subject: header(headers, "Subject", "No subject"),
          date: header(headers, "Date", ""),
          messageId: header(headers, "Message-ID", ""),
          inReplyTo: header(headers, "In-Reply-To", ""),
          references: header(headers, "References", ""),
        },
        body: { textPlain, textHtml },
        attachments,
      });
    }

    if (op === "attachment") {
      const messageId = searchParams.get("messageId");
      const attachmentId = searchParams.get("attachmentId");
      const filename = searchParams.get("filename") || "attachment";
      const mimeType =
        searchParams.get("mimeType") || "application/octet-stream";
      if (!messageId || !attachmentId)
        return bad("Missing messageId/attachmentId");

      const att = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
      });
      const buf = b64urlToBuf(att.data.data || "");
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      });
    }

    if (op === "status") {
      const db = getDbOrNull();
      const ids = (searchParams.get("threadIds") || "")
        .split(",")
        .filter(Boolean);
      const account = searchParams.get("account") || "me";
      if (!db || ids.length === 0) return json({ statuses: {} });

      const statuses = {};
      const snaps = await Promise.all(
        ids.map((id) => db.doc(`gmailThreads/${account}:${id}`).get())
      );
      snaps.forEach((doc) => {
        if (doc.exists) statuses[doc.id.split(":")[1]] = doc.data();
      });
      return json({ statuses });
    }

    return bad("Unknown or missing op");
  } catch (error) {
    console.error("GET /api/google/gmail error:", error);
    return json(
      {
        error: error.message || "Internal Server Error",
        ...(error.payload || {}),
      },
      error.status || 500
    );
  }
}

/* ---------------- POST (send) ------------------------ */
export async function POST(req) {
  try {
    const auth = await getAuth();
    const gmail = google.gmail({ version: "v1", auth });
    const contentType = req.headers.get("content-type") || "";
    const accountEmail = await getAccountEmail(gmail);
    const db = getDbOrNull();
    const { searchParams } = new URL(req.url);
    const op = searchParams.get("op");

    if (op !== "send") return bad("Unsupported op for POST");

    const scopes = await getTokenScopes(auth);
    if (!hasScope(scopes, SCOPE_SEND)) {
      return json(
        {
          error: "insufficient_scopes",
          needed: [SCOPE_SEND],
          have: scopes,
          reauthUrl: makeAuthUrl([SCOPE_SEND, SCOPE_MODIFY, SCOPE_READ]),
          hint: "Re-authorize, update GOOGLE_REFRESH_TOKEN in .env, and restart the server.",
        },
        403
      );
    }

    let payload = {};
    let files = [];
    if (contentType.includes("application/json")) {
      payload = await req.json();
      files = (payload.attachments || []).map((f) => ({
        filename: f.filename,
        mimeType: f.mimeType,
        dataBase64: f.dataBase64,
      }));
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      payload = JSON.parse(String(form.get("metadata") || "{}"));
      for (const [key, val] of form.entries()) {
        if (key === "file" && val instanceof File) {
          const buf = Buffer.from(await val.arrayBuffer());
          files.push({
            filename: val.name,
            mimeType: val.type || "application/octet-stream",
            dataBase64: buf.toString("base64"),
          });
        }
      }
    } else {
      return json({ error: "Unsupported content type" }, 415);
    }

    const {
      to,
      cc = [],
      bcc = [],
      subject,
      text,
      html,
      threadId,
      inReplyTo,
      references,
    } = payload;
    const toArr = Array.isArray(to) ? to : [to].filter(Boolean);
    if (!toArr.length || !subject) return bad("Missing to/subject");

    const raw = buildMime({
      from: accountEmail,
      to: toArr,
      cc: Array.isArray(cc) ? cc : undefined,
      bcc: Array.isArray(bcc) ? bcc : undefined,
      subject,
      text,
      html,
      inReplyTo,
      references,
      attachments: files,
    });

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw, ...(threadId ? { threadId } : {}) },
    });

    if (db) {
      const id = `${accountEmail}:${res.data.id}`;
      await db.doc(`gmailReplies/${id}`).set(
        {
          id: res.data.id,
          threadId: res.data.threadId,
          to: toArr,
          subject,
          createdAt: new Date().toISOString(),
          account: accountEmail,
        },
        { merge: true }
      );
    }

    return json(
      {
        id: res.data.id,
        threadId: res.data.threadId,
        labelIds: res.data.labelIds,
      },
      200
    );
  } catch (error) {
    console.error("POST /api/google/gmail error:", error);
    const status = error?.code || error?.status || 500;
    const detail =
      error?.response?.data || error?.message || "Internal Server Error";
    return json({ error: "gmail_send_failed", detail }, status);
  }
}

/* ---------------- DELETE (trash/delete) --------------- */
export async function DELETE(req) {
  try {
    const auth = await getAuth();
    const gmail = google.gmail({ version: "v1", auth });
    const db = getDbOrNull();
    const { searchParams } = new URL(req.url);
    const op = searchParams.get("op");
    if (op !== "delete") return bad("Unsupported op for DELETE");

    const scopes = await getTokenScopes(auth);
    if (!hasScope(scopes, SCOPE_MODIFY)) {
      return json(
        {
          error: "insufficient_scopes",
          needed: [SCOPE_MODIFY],
          have: scopes,
          reauthUrl: makeAuthUrl([SCOPE_SEND, SCOPE_MODIFY, SCOPE_READ]),
          hint: "Re-authorize, update GOOGLE_REFRESH_TOKEN, and restart.",
        },
        403
      );
    }

    const type = searchParams.get("type"); // thread|message
    const id = searchParams.get("id");
    const hard = searchParams.get("hard") === "true";
    const andStatus = searchParams.get("andStatus") !== "false"; // default true

    if (!type || !id) return bad("Missing type or id");

    if (type === "thread") {
      if (hard) await gmail.users.threads.delete({ userId: "me", id });
      else await gmail.users.threads.trash({ userId: "me", id });
      if (db && andStatus) {
        const accountEmail = await getAccountEmail(gmail);
        await db
          .doc(`gmailThreads/${accountEmail}:${id}`)
          .delete()
          .catch(() => {});
      }
    } else if (type === "message") {
      if (hard) await gmail.users.messages.delete({ userId: "me", id });
      else await gmail.users.messages.trash({ userId: "me", id });
      if (db) {
        const accountEmail = await getAccountEmail(gmail);
        await db
          .doc(`gmailReplies/${accountEmail}:${id}`)
          .delete()
          .catch(() => {});
      }
    } else {
      return bad("Invalid type");
    }

    return json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/google/gmail error:", error);
    return json(
      { error: error.message || "Internal Server Error" },
      error.status || 500
    );
  }
}

/* ---------------- PATCH (status) ---------------------- */
export async function PATCH(req) {
  try {
    const gmail = await getGmail();
    const db = getDbOrNull();
    if (!db) return bad("Firestore not configured");

    const { searchParams } = new URL(req.url);
    const op = searchParams.get("op");
    if (op !== "status") return bad("Unsupported op for PATCH");

    const body = await req.json();
    const { threadId, status, notes, assignedTo } = body || {};
    if (!threadId || !status) return bad("Missing threadId/status");

    const account = await getAccountEmail(gmail);
    await db.doc(`gmailThreads/${account}:${threadId}`).set(
      {
        threadId,
        status,
        notes: notes || null,
        assignedTo: assignedTo || null,
        updatedAt: new Date().toISOString(),
        account,
      },
      { merge: true }
    );

    return json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/google/gmail error:", error);
    return json(
      { error: error.message || "Internal Server Error" },
      error.status || 500
    );
  }
}

/* ---------------- tiny response helpers --------------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function bad(message, status = 400) {
  return json({ error: message }, status);
}
