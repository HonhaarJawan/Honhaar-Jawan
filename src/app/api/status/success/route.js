import { db } from "@/Backend/FirebaseAdminSDK";
import axios from "axios";
import { bundles } from "@/Data/Data";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const email = searchParams.get("email");
    const invoiceId = searchParams.get("invoiceId");

    if (!email) {
      console.error("Missing 'email' parameter.");
      return redirectWithError(req, "missing_email");
    }

    console.log("Looking up user by email:", email);

    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      console.log("No user found with email:", email);
      return redirectWithError(req, "user_not_found");
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const currentTimeISO = new Date().toISOString();

    let bundleId = userData?.currentBuyingBundleId;
    if (!bundleId) {
      console.error("No bundle ID found for user");
      return redirectWithError(req, "no_bundle");
    }

    const bundleDetails = bundles.find(
      (b) => Number(b.id) === Number(bundleId)
    );
    if (!bundleDetails) {
      console.error(`Bundle ${bundleId} not found`);
      return redirectWithError(req, "invalid_bundle");
    }

    if (
      !bundleDetails.bundleCourses ||
      !Array.isArray(bundleDetails.bundleCourses)
    ) {
      console.error("Invalid bundle courses data");
      return redirectWithError(req, "invalid_courses");
    }

    const courseIds = bundleDetails.bundleCourses
      .map((c) => Number(c))
      .filter((id) => !isNaN(id) && id > 0);

    if (courseIds.length === 0) {
      console.error("No valid course IDs in bundle");
      return redirectWithError(req, "no_valid_courses");
    }

    let enrollmentType;
    let paymentAmount = 0;

    if (invoiceId) {
      try {
        const invoiceParts = invoiceId.split("-");
        if (invoiceParts.length === 6) {
          enrollmentType = parseInt(invoiceParts[5]);
          paymentAmount = parseFloat(invoiceParts[3]) || 0;
        }
      } catch (err) {
        console.error("Error processing invoiceId:", err.message);
      }
    }

    const enrollApiUrl = process.env.NEXT_PUBLIC_ENROLL_USER;
    if (enrollApiUrl) {
      try {
        const response = await axios.post(
          enrollApiUrl,
          {
            userId: userData.userId || 0,
            courses: courseIds,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Enrollment successful:", response.data);
      } catch (enrollError) {
        console.error("Enrollment failed:", enrollError);
        return redirectWithError(req, "enrollment_failed");
      }
    }

    const updateData = {
      status: 4,
      lastUpdated: currentTimeISO,
      enrolledBundles: FieldValue.arrayUnion(bundleId),
      enrolledCourses: FieldValue.arrayUnion(...courseIds),
      ...(invoiceId && { lastInvoiceId: invoiceId }),
    };

    await userDoc.ref.update(updateData);

    const enrolledMemberData = {
      email: userData.email,
      firstName: userData.firstName || "User",
      lastName: userData.lastName || "User",
      userId: userData.userId,
      bundleId: bundleId,
      bundleName: bundleDetails.name,
      enrolledCourses: courseIds,
      enrollmentDate: currentTimeISO,
      lastInvoiceId: invoiceId || null,
      status: "paid",
      paymentAmount: paymentAmount,
    };

    await db
      .collection("enrolledMembers")
      .doc(userData.userId.toString())
      .set(enrolledMemberData, { merge: true });

    const paymentLog = {
      userId: userData.userId,
      email: userData.email,
      invoiceId: invoiceId || null,
      amount: paymentAmount,
      bundleId: bundleId,
      bundleName: bundleDetails.name,
      paymentDate: currentTimeISO,
      status: "paid",
      coursesEnrolled: courseIds,
    };

    await db.collection("paidInvoices").add(paymentLog);

    // Update overall stats (enrollment count and revenue)
    const enrollmentPrice = 4500; // Price per enrollment
    try {
      const statsRef = db.collection("overallstats").doc("overallstats");
      await statsRef.set(
        {
          totalEnrolledStudents: FieldValue.increment(1),
          totalRevenue: FieldValue.increment(enrollmentPrice),
        },
        { merge: true }
      );
      console.log("Updated overall enrollment stats");
    } catch (statsError) {
      console.error("Error updating overall stats:", statsError);
      // Don't fail the whole process for this
    }

    // =====================================
    // UPDATED EMAIL SENDING (using template)
    // =====================================
    try {
      // Get the base URL for internal API call
      const baseUrl = new URL(req.url).origin;

      // Fetch email template from Firestore
      const templateRef = db
        .collection("saeed_email_templates")
        .doc("enrollment-confirmed");
      const templateDoc = await templateRef.get();

      if (!templateDoc.exists) {
        console.error("Enrollment confirmation template not found");
        throw new Error("Email template missing");
      }

      const templateData = templateDoc.data();

      // Prepare placeholders
      const placeholders = {
        fullName: `${userData.firstName || "User"} ${
          userData.lastName || ""
        }`.trim(),
        bundleName: bundleDetails.name,
        email: userData.email,
        // Add any other placeholders your template requires
      };

      console.log(`Sending enrollment email to ${userData.email}`);

      // Send email via our internal API
      const emailResponse = await fetch(`${baseUrl}https://honhaarjawan.pk/api/sendMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userData.email,
          subject:
            templateData.subject ||
            `Enrollment Confirmed - ${bundleDetails.name}`,
          htmlTemplate: templateData.template,
          placeholders,
        }),
      });

      if (!emailResponse.ok) {
        const error = await emailResponse.json();
        console.error(`Email failed for ${userData.email}: ${error.message}`);

        // Log failed email in Firestore
        await db.collection("email_logs").add({
          to: userData.email,
          subject: `Enrollment Confirmed - ${bundleDetails.name}`,
          template: "enrollment-confirmed",
          sentAt: new Date().toISOString(),
          status: "failed",
          userId: userData.userId,
          bundleId: bundleId,
          error: error.message,
        });
      } else {
        console.log(`✅ Enrollment email sent to ${userData.email}`);

        // Log successful email in Firestore
        await db.collection("email_logs").add({
          to: userData.email,
          subject: `Enrollment Confirmed - ${bundleDetails.name}`,
          template: "enrollment-confirmed",
          sentAt: new Date().toISOString(),
          status: "sent",
          userId: userData.userId,
          bundleId: bundleId,
        });
      }
    } catch (emailError) {
      console.error(
        "⚠️ Email sending error (non-critical):",
        emailError.message
      );

      // Log email error in Firestore
      await db.collection("email_logs").add({
        to: userData.email,
        subject: `Enrollment Confirmed - ${bundleDetails.name}`,
        template: "enrollment-confirmed",
        sentAt: new Date().toISOString(),
        status: "failed",
        userId: userData.userId,
        bundleId: bundleId,
        error: emailError.message,
      });
    }

    return redirectToDashboard(req, "success");
  } catch (error) {
    console.error("Critical error in GET handler:", error);
    return redirectWithError(req, "server_error");
  }
}

// Helper functions - FIXED: Added req parameter
function redirectToDashboard(req, status) {
  return NextResponse.redirect(
    new URL(`/dashboard?payment=${status}`, req.url)
  );
}

function redirectWithError(req, reason) {
  return NextResponse.redirect(
    new URL(`/dashboard?payment=failed&reason=${reason}`, req.url)
  );
}
