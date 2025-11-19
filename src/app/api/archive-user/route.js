import { firestore } from "@/Backend/Firebase"; // client SDK
import { auth } from "@/Backend/FirebaseAdminSDK"; // admin SDK
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// ✅ Ensure Node.js runtime for FS and Admin SDK
export const runtime = "nodejs";

export async function POST(req) {
  console.log("📩 Pabbly webhook received for user archiving");

  let email;

  try {
    // --- 1️⃣ Robust body parsing (handles array, uppercase, etc.)
    const body = await req.json().catch(() => null);
    console.log("🧾 Raw Pabbly body:", body);

    if (body) {
      if (Array.isArray(body)) {
        email = body[0]?.email || body[0]?.Email;
      } else {
        email = body.email || body.Email;
      }
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      console.warn("⚠️ Missing or invalid email in request:", body);
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    email = email.trim().toLowerCase();

    // --- 2️⃣ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // --- 3️⃣ Fetch user from Firestore
    const userDocRef = doc(firestore, "users", email);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.warn(`❌ User not found in Firestore: ${email}`);
      return NextResponse.json(
        { message: "User not found in Firestore 'users' collection" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // --- 4️⃣ Skip users with any paid indicators
    
    // FIXED: Check if generatedPayProId is an object with paid: true
    const hasPaidStatusInObject =
      userData.generatedPayProId &&
      typeof userData.generatedPayProId === "object" &&
      !Array.isArray(userData.generatedPayProId) &&
      userData.generatedPayProId.paid === true;

    // Check if any selected course has status: "paid"
    const hasPaidCourse =
      Array.isArray(userData.selectedCourses) &&
      userData.selectedCourses.some((course) => course.status === "paid");

    // Check if user has a top-level paidAt field
    const hasTopLevelPaidAt =
      userData.paidAt &&
      (typeof userData.paidAt === "string" || userData.paidAt.toDate);

    // Check if generatedPayProId is an object with a paidAt field (legacy check)
    const hasNestedPaidAt =
      userData.generatedPayProId &&
      typeof userData.generatedPayProId === "object" &&
      !Array.isArray(userData.generatedPayProId) &&
      Object.prototype.hasOwnProperty.call(
        userData.generatedPayProId,
        "paidAt"
      );

    // FIXED: Updated condition to check for paid: true in generatedPayProId object
    if (hasPaidStatusInObject || hasPaidCourse || hasTopLevelPaidAt || hasNestedPaidAt) {
      console.log(
        `⏩ Skipping deletion: ${email} has payment field(s): ${
          hasPaidStatusInObject
            ? "generatedPayProId.paid: true"
            : ""
        } ${hasPaidCourse ? "selected course with status: 'paid'" : ""} ${
          hasTopLevelPaidAt ? "paidAt" : ""
        } ${hasNestedPaidAt ? "generatedPayProId.paidAt" : ""}`
      );

      return NextResponse.json(
        {
          message: "User has payment indicators — skipping archive & deletion.",
          email,
          skipReason: hasPaidStatusInObject
            ? "generatedPayProId.paid: true"
            : hasPaidCourse
              ? "selected course with status: 'paid'"
              : hasTopLevelPaidAt
                ? "paidAt field exists"
                : "generatedPayProId.paidAt exists",
        },
        { status: 200 }
      );
    }

    // --- 5️⃣ Archive user data
    const archiveRef = doc(firestore, "archive", email);
    const archiveData = {
      ...userData,
      archivedAt: new Date(),
      originalCollection: "users",
      archivedBy: "pabbly-webhook",
    };
    await setDoc(archiveRef, archiveData);

    // --- 6️⃣ Delete from Firestore users collection
    await deleteDoc(userDocRef);
    console.log(`✅ Archived & deleted Firestore user: ${email}`);

    // --- 7️⃣ Delete from Firebase Auth (Admin SDK)
    try {
      const userRecord = await auth.getUserByEmail(email);
      if (userRecord) {
        await auth.deleteUser(userRecord.uid);
        console.log(`🧾 Auth user deleted: ${email}`);
      }
    } catch (authErr) {
      console.warn(`⚠️ Auth deletion failed for ${email}:`, authErr.message);
    }

    // --- 8️⃣ Return success response
    return NextResponse.json({
      message: "User archived and deleted from Firestore & Auth successfully.",
      status: 200,
      data: {
        email,
        archivedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}