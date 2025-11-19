// File: app/api/cron/approval-cron/route.js
import { NextResponse } from "next/server";
import admin from "firebase-admin"; // Import admin for serverTimestamp
import { db } from "../../../../Backend/FirebaseAdminSDK"; // Ensure this path is correct for your Firebase Admin SDK setup

// Enhanced logger with timestamp and log levels
const logger = {
  log: (level, message, data) => {
    const now = Date.now();
    const entry = `[${new Date(
      now
    ).toISOString()}] ${level.toUpperCase()}: ${message}`;
    console[level](entry, data || "");
  },
  info: (message, data) => logger.log("info", message, data),
  error: (message, data) => logger.log("error", message, data),
  warn: (message, data) => logger.log("warn", message, data),
};

export async function GET(request) {
  const startTime = Date.now();
  logger.info("Starting document-approval cron (GET request)");

  try {
    const nowISO = new Date().toISOString();
    const submissionsRef = db.collection("documentSubmissions");
    const submissionsQuery = submissionsRef
      .where("timeToApprove", "<=", nowISO)
      .where("processed", "==", false);
    const snapshot = await submissionsQuery.get();
    logger.info(`Found ${snapshot.size} submission(s) ready for approval`);

    if (snapshot.empty) {
      // If no submissions to process, redirect with success and 0 processed count
      const redirectUrl = new URL(
        `/dashboard?cronSuccess=true&processedCount=0`,
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    const results = []; // To store results of each processed submission
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const submissionId = docSnap.id;
      const userEmail = data.email;
      const userUid = data.uid; // Prioritize UID from submission data
      let userDocRef = null;

      // 1. Find user document using UID first for direct access
      if (userUid) {
        const possibleDoc = await db.collection("users").doc(userUid).get();
        if (possibleDoc.exists) {
          userDocRef = possibleDoc.ref;
        }
      }

      // 2. Fallback to querying by email if UID user document not found
      if (!userDocRef && userEmail) {
        const userQuerySnapshot = await db
          .collection("users")
          .where("email", "==", userEmail)
          .limit(1) // Limit to 1, assuming email is unique
          .get();
        if (!userQuerySnapshot.empty) {
          userDocRef = userQuerySnapshot.docs[0].ref;
        }
      }

      // If no user document found for this submission, log and mark as processed
      if (!userDocRef) {
        logger.warn(
          `Skipping submission ${submissionId}: No user found with UID (${
            userUid || "N/A"
          }) or Email (${userEmail || "N/A"})`
        );
        await db.collection("documentSubmissions").doc(submissionId).update({
          processed: true,
          error: "User not found for approval",
        });
        results.push({ submissionId, status: "skipped (no user found)" });
        continue; // Move to the next submission
      }

      // Update user status and approval timestamps
      await userDocRef.update({
        status: 3, // Set status to 3 as specified
        applicationApprovedAt: admin.firestore.FieldValue.serverTimestamp(), // Set server-side timestamp for approval completion
        approvalTime: admin.firestore.FieldValue.serverTimestamp(), // Also set approvalTime to server-side timestamp
        applicationApproved: true, // NEW: Set this boolean field to true
      });
      logger.info(
        `Set status=3, applicationApprovedAt, approvalTime, and applicationApproved=true on user ${userDocRef.id}`
      );

      // MARK: Send approval email
      try {
        // Get the "application-approved" email template
        const templateRef = db
          .collection("saeed_email_templates")
          .doc("application-approved");
        const templateDoc = await templateRef.get();

        if (templateDoc.exists) {
          const templateData = templateDoc.data();
          // Re-fetch user data to get the newly set applicationApprovedAt and approvalTime
          const updatedUserData = (await userDocRef.get()).data();

          // Prepare placeholders for the email template
          const placeholders = {
            fullName:
              `${updatedUserData.firstName || ""} ${
                updatedUserData.lastName || ""
              }`.trim() || "Valued Applicant",
            email: updatedUserData.email || userEmail,
            SUBSCRIBER_FIRST_NAME: updatedUserData.firstName || "",
            SUBSCRIBER_LAST_NAME: updatedUserData.lastName || "",
            // You can add more placeholders here if your template needs them, e.g.:
            // APPROVAL_DATE: updatedUserData.applicationApprovedAt ? new Date(updatedUserData.applicationApprovedAt.toMillis()).toLocaleDateString() : 'N/A',
            // APPROVAL_TIME: updatedUserData.approvalTime ? new Date(updatedUserData.approvalTime.toMillis()).toLocaleTimeString() : 'N/A',
          };

          // Get base URL for making internal API call to sendMail endpoint
          const baseUrl = new URL(request.url).origin;

          // Send email via the internal https://honhaarjawan.pk/api/sendMail endpoint
          const emailResponse = await fetch(`${baseUrl}https://honhaarjawan.pk/api/sendMail`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: userEmail,
              subject:
                templateData.subject || "Your Application Has Been Approved!",
              htmlTemplate: templateData.template,
              placeholders,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text(); // Get raw text for better error logging
            logger.warn(`Email sending failed for ${userEmail}: ${errorText}`);
          } else {
            logger.info(`Approval email successfully sent to ${userEmail}`);
          }
        } else {
          logger.warn(
            "Application-approved email template not found in 'saeed_email_templates' collection. Email not sent."
          );
        }
      } catch (emailError) {
        logger.error(
          `Error during email sending process for ${userEmail}: ${emailError.message}`,
          emailError
        );
      }

      // Mark the document submission as processed
      await db.collection("documentSubmissions").doc(submissionId).update({
        processed: true,
        // Optionally, add an 'approvedAt' timestamp here for the submission record itself
        // processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      results.push({
        submissionId,
        userUid: userDocRef.id,
        status: "approved",
      });
    }

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    logger.info("Document-approval cron completed", { executionTime, results });

    // Redirect to dashboard with summary of processed results
    const redirectUrl = new URL(
      `/dashboard?cronSuccess=true&processedCount=${results.length}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error(`Approval cron job failed entirely: ${error.message}`, error); // Log the full error object
    const redirectUrl = new URL(
      `/dashboard?cronSuccess=false&error=${encodeURIComponent(error.message)}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }
}

// You might also want a POST handler for manual cron triggering, if needed
export async function POST(request) {
  const startTime = Date.now();
  logger.info("Starting document-approval cron (POST request)");

  try {
    const { userId } = await request.json(); // Assuming a userId is sent for manual trigger

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Logic to directly approve a specific user based on userId
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.warn(`User with ID ${userId} not found for manual approval.`);
      return NextResponse.json(
        { success: false, message: `User with ID ${userId} not found.` },
        { status: 404 }
      );
    }

    // Update user status and approval timestamps
    await userDocRef.update({
      status: 3, // Set status to 3 as specified
      applicationApprovedAt: admin.firestore.FieldValue.serverTimestamp(), // Set server-side timestamp for approval
      approvalTime: admin.firestore.FieldValue.serverTimestamp(), // Also set approvalTime to server-side timestamp
      applicationApproved: true, // NEW: Set this boolean field to true
    });
    logger.info(
      `Manually approved user ${userId}: status=3, applicationApprovedAt, approvalTime, and applicationApproved=true set.`
    );

    // Optionally, you might want to find and mark related documentSubmissions as processed here too
    // For simplicity, this example only updates the user document.

    // MARK: Send approval email (similar logic as in GET)
    try {
      const templateRef = db
        .collection("saeed_email_templates")
        .doc("application-approved");
      const templateDoc = await templateRef.get();

      if (templateDoc.exists) {
        const templateData = templateDoc.data();
        const updatedUserData = (await userDocRef.get()).data();

        const placeholders = {
          fullName:
            `${updatedUserData.firstName || ""} ${
              updatedUserData.lastName || ""
            }`.trim() || "Valued Applicant",
          email: updatedUserData.email || updatedUserData.email, // Use email from updated user data
          SUBSCRIBER_FIRST_NAME: updatedUserData.firstName || "",
          SUBSCRIBER_LAST_NAME: updatedUserData.lastName || "",
        };

        const baseUrl = new URL(request.url).origin;
        const emailResponse = await fetch(`${baseUrl}https://honhaarjawan.pk/api/sendMail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: updatedUserData.email,
            subject:
              templateData.subject || "Your Application Has Been Approved!",
            htmlTemplate: templateData.template,
            placeholders,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          logger.warn(
            `Email sending failed for ${updatedUserData.email}: ${errorText}`
          );
        } else {
          logger.info(
            `Approval email successfully sent to ${updatedUserData.email} via POST.`
          );
        }
      } else {
        logger.warn(
          "Application-approved email template not found. Email not sent via POST."
        );
      }
    } catch (emailError) {
      logger.error(
        `Error during email sending process for user ${userId} (POST): ${emailError.message}`,
        emailError
      );
    }

    const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    logger.info("Manual approval completed", { userId, executionTime });
    return NextResponse.json({
      success: true,
      message: `User ${userId} approved successfully.`,
    });
  } catch (error) {
    logger.error(
      `Manual approval failed for cron API: ${error.message}`,
      error
    );
    return NextResponse.json(
      { success: false, message: `Failed to approve user: ${error.message}` },
      { status: 500 }
    );
  }
}
