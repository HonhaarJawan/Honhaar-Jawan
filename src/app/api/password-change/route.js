// src/app/api/password-change/route.js
import { NextResponse } from "next/server";
import { db, auth } from "@/Backend/FirebaseAdminSDK";

export async function POST(req) {
  try {
    const { code, newPassword } = await req.json();

    // Input validation
    if (!code || !newPassword) {
      return NextResponse.json(
        { message: "Reset code and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Fetch reset request using the code
    const resetDoc = await db
      .collection("password-reset-requests")
      .doc(code)
      .get();

    if (!resetDoc.exists) {
      return NextResponse.json(
        { message: "Invalid or expired reset request" },
        { status: 404 }
      );
    }

    const resetData = resetDoc.data();
    const { uid, email } = resetData;

    // Check if code has expired
    const now = new Date();
    const expiresAt = resetData.expiresAt.toDate();
    
    if (now > expiresAt) {
      return NextResponse.json(
        { message: "Reset code has expired" },
        { status: 400 }
      );
    }

    // Check if code has already been used
    if (resetData.used) {
      return NextResponse.json(
        { message: "Reset code has already been used" },
        { status: 400 }
      );
    }

    // Update password using Admin SDK with the stored UID
    await auth.updateUser(uid, { 
      password: newPassword 
    });

    // Mark the reset request as used
    await resetDoc.ref.update({
      used: true,
      usedAt: new Date()
    });

    console.log(`Password successfully updated for user: ${email} (UID: ${uid})`);

    return NextResponse.json({ 
      success: true,
      message: "Password updated successfully" 
    }, { status: 200 });

  } catch (err) {
    console.error("Password update error:", err);
    
    // Handle specific Firebase Auth errors
    if (err.code === 'auth/user-not-found') {
      return NextResponse.json(
        { message: "User account not found" },
        { status: 404 } 
      );
    }
    
    if (err.code === 'auth/invalid-password') {
      return NextResponse.json(
        { message: "Invalid password format" },
        { status: 400 }
      );
    }

    if (err.code === 'auth/quota-exceeded') {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}