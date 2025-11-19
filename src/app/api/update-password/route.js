// app/api/update-password/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK once
function initAdmin() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_ADMIN_SDK;
  if (!raw) {
    throw new Error("FIREBASE_ADMIN_SDK env var is not set");
  }

  let serviceAccount;
  try {
    // Preferred: JSON string stored exactly as downloaded (with \n in private_key)
    serviceAccount = JSON.parse(raw);
  } catch {
    // Fallback: some hosts wrap the whole JSON in single quotes
    const repaired = raw.replace(/^'|'$/g, "").replace(/'/g, '"');
    serviceAccount = JSON.parse(repaired);
  }

  // Fix ONLY the private_key newlines
  if (serviceAccount.private_key?.includes("\\n")) {
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );
  }

  // Guard rails
  if (
    !serviceAccount.client_email ||
    !serviceAccount.private_key ||
    !serviceAccount.project_id
  ) {
    throw new Error("Service account JSON is missing required fields");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request) {
  try {
    initAdmin();

    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await admin.auth().updateUser(userRecord.uid, { password: newPassword });

    return NextResponse.json(
      { message: "Password updated successfully", uid: userRecord.uid },
      { status: 200 }
    );
  } catch (error) {
    // Common Admin credential errors -> 500 with safe message
    if (
      typeof error?.message === "string" &&
      error.message.includes("Credential implementation") &&
      error.message.includes("access token")
    ) {
      return NextResponse.json(
        {
          error:
            "Server credential error. Check FIREBASE_ADMIN_SDK formatting (especially private_key newlines).",
          details:
            process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: 500 }
      );
    }

    // Firebase Auth specific codes
    if (error?.code === "auth/user-not-found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (error?.code === "auth/invalid-email") {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (error?.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "Password is too weak. Must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (error?.code === "auth/quota-exceeded") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update password. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
