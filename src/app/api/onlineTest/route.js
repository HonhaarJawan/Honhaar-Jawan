import { db } from "@/Backend/FirebaseAdminSDK";
import { registerUserInNewListAndRemoveFromOld } from "@/services/mailerUtils";
import axios from "axios";

// Email sending function
async function sendEmail({ email, subject, template, placeholders }) {
  const payload = {
    to: email,
    subject,
    htmlTemplate: template,
    placeholders,
  };
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_SEND_MAIL_VERCEL_URL,
      payload
    );
    console.log("Email sent successfully", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Fetch email template from Firestore
async function getEmailTemplate(templateName) {
  try {
    const templateDoc = await db.collection('email_templates').doc(templateName).get();
    if (!templateDoc.exists) {
      throw new Error(`Template ${templateName} not found`);
    }
    return templateDoc.data().template;
  } catch (error) {
    console.error(`Error fetching ${templateName} template:`, error);
    throw error;
  }
}

export async function POST(req) {
  console.log("POST request received for test results...");
  try {
    const { user, onlineTestPercentage, templates } = await req.json();
    const { failed, passed } = templates || {};
    const testPassedTemplate = passed;
    const testFailedTemplate = failed;

    // Validate essential data
    if (
      !user ||
      typeof user !== "object" ||
      !testPassedTemplate ||
      !testFailedTemplate ||
      typeof onlineTestPercentage !== "number"
    ) {
      console.error("Invalid user, percentage, or template data:", user);
      return new Response(
        JSON.stringify({
          message: "Invalid user or email template data provided.",
        }),
        { status: 400 }
      );
    }

    const userEmail = user.email;
    const isTestPassed = onlineTestPercentage >= 45;
    const newStatus = isTestPassed ? 5 : 99;

    // Find user in database
    const userRef = db.collection("users").where("email", "==", userEmail);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      console.error("No matching user found for email:", userEmail);
      return new Response(
        JSON.stringify({
          message: "User not found.",
        }),
        { status: 404 }
      );
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    // Update user with test results
    await userDoc.ref.update({
      isTestPased: isTestPassed,
      status: newStatus,
      onlineTestPercentage: onlineTestPercentage,
      lastUpdated: new Date().toISOString()
    });

    console.log(`User document updated with test results: ${isTestPassed ? "PASSED" : "FAILED"}`);

    // Get user details for list operations
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    const oldSubscriberUid = userData.subscriberId || "";
    const apiToken = process.env.NEXT_PUBLIC_EMAILING_APITOKEN;

    if (isTestPassed) {
      // Send test passed email
      await sendEmail({
        email: userEmail,
        subject: "Congratulations! You've Passed the Admission Test",
        template: testPassedTemplate,
        placeholders: {
          score: onlineTestPercentage,
          fullName: user.firstName + " " + user.lastName,
        },
      });
      console.log("Test passed email sent successfully");

      // Fetch and send application approved email
      const applicationApprovedTemplate = await getEmailTemplate('application-approved');
      await sendEmail({
        email: userEmail,
        subject: "Your Application Has Been Approved!",
        template: applicationApprovedTemplate,
        placeholders: {
          fullName: user.firstName + " " + user.lastName,
          email: userEmail
        },
      });
      console.log("Application approved email sent successfully");

      // Move to Fee Reminders list if passed
      console.log("User passed the test, moving to Fee Reminders list");
      const newListUid = process.env.NEXT_PUBLIC_EMAILING_FEE_REMINDER_LISTUID;
      
      const mailerResult = await registerUserInNewListAndRemoveFromOld({
        email: userEmail,
        firstName,
        lastName,
        newListUid,
        oldSubscriberUid,
        apiToken
      });

      // Update user document with new subscriber ID
      if (mailerResult.status === "success" && mailerResult.newSubscriberUid) {
        await userDoc.ref.update({
          subscriberId: mailerResult.newSubscriberUid,
          approvedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log("Updated user with new subscriber ID after passing test");
      }

      return new Response(
        JSON.stringify({
          message: "Test passed and user moved to Fee Reminders list",
          emailResult: "Both test passed and application approved emails sent",
          mailerResult
        }),
        { status: 200 }
      );
    } else {
      // Send test failed email
      const emailResult = await sendEmail({
        email: userEmail,
        subject: "Admission Test Result – Please Try Again",
        template: testFailedTemplate,
        placeholders: {
          score: onlineTestPercentage,
          fullName: user.firstName + " ",
        },
      });
      console.log("Test failed email sent successfully");

      // Move to All Users list if failed
      console.log("User failed the test, moving to All Users list");
      const newListUid = process.env.NEXT_PUBLIC_EMAILING_ALL_USERS_LISTUID;
      
      const mailerResult = await registerUserInNewListAndRemoveFromOld({
        email: userEmail,
        firstName,
        lastName,
        newListUid,
        oldSubscriberUid,
        apiToken
      });

      // Update user document with new subscriber ID
      if (mailerResult.status === "success" && mailerResult.newSubscriberUid) {
        await userDoc.ref.update({
          subscriberId: mailerResult.newSubscriberUid,
          lastUpdated: new Date().toISOString()
        });
        console.log("Updated user with new subscriber ID after failing test");
      }

      return new Response(
        JSON.stringify({
          message: "Test failed and user moved to All Users list",
          emailResult,
          mailerResult
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error processing online test:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}