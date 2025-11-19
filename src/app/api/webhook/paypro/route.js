// /api/webhook/paypro/route.js
import { firestore } from "@/Backend/Firebase";
import axios from "axios";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  setDoc,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

// Thinkific API configuration
const NEXT_PUBLIC_THINKIFIC_API_KEY = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
const NEXT_PUBLIC_THINKIFIC_SUBDOMAIN =
  process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;
const THINKIFIC_API_BASE_URL = `https://api.thinkific.com/api/public/v1`;

// Function to create a user on Thinkific (for initial enrollment)
const createUserOnThinkific = async (user) => {
  try {
    const url = `${THINKIFIC_API_BASE_URL}/users`;
    const headers = {
      "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
      "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
      "Content-Type": "application/json",
    };

    // Split fullName into first_name and last_name
    const nameParts = user.fullName ? user.fullName.split(" ") : ["", ""];
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "Name";

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      password: user.password || "defaultuser",
    };

    console.log("Creating Thinkific user with payload:", payload);

    const response = await axios.post(url, payload, { headers });
    console.log("Thinkific user created successfully:", response.data);

    return response.data.id; // Return just the ID
  } catch (error) {
    console.error(
      "Thinkific user creation failed:",
      error.response?.data || error.message
    );

    // If email is already taken, try to find the user again to get their ID
    if (error.response?.data?.errors?.email?.includes("already been taken")) {
      console.log("Email already taken, trying to find existing user again...");

      // Wait a bit and try again to find the user
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const finalResponse = await axios.get(
          `${THINKIFIC_API_BASE_URL}/users?query=${encodeURIComponent(user.email)}`,
          { headers }
        );

        if (finalResponse.data.items && finalResponse.data.items.length > 0) {
          console.log(
            "Found existing user after creation error:",
            finalResponse.data.items[0]
          );
          return finalResponse.data.items[0].id;
        }
      } catch (finalError) {
        console.error(
          "Final attempt failed:",
          finalError.response?.data || finalError.message
        );
      }
    }

    throw error;
  }
};

// Function to enroll a user in courses on Thinkific
const enrollOnThinkific = async (userId, coursesArray) => {
  if (!userId) throw new Error("User ID required");
  if (!coursesArray?.length) throw new Error("Courses array required");

  const url = `${THINKIFIC_API_BASE_URL}/enrollments`;
  const headers = {
    "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
    "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
    "Content-Type": "application/json",
  };

  try {
    // Create promises for each course enrollment
    const promises = coursesArray.map((course) => {
      const courseId = course.lmsCourseId;
      if (!courseId) {
        return Promise.resolve({
          course,
          status: "skipped",
          reason: "Missing course ID",
          timestamp: new Date().toISOString(),
        });
      }

      const payload = {
        user_id: userId,
        course_id: courseId,
        activated_at: new Date().toISOString(),
      };

      return axios
        .post(url, payload, { headers })
        .then((response) => ({
          course,
          status: "success",
          enrollmentId: response.data.id,
          enrolledAt: new Date().toISOString(),
        }))
        .catch((error) => {
          console.error(`Enrollment error for course ${courseId}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });

          return {
            course,
            status: "failed",
            error: error.response?.data?.message || error.message,
            details: {
              statusCode: error.response?.status,
              courseId,
              timestamp: new Date().toISOString(),
              errorData: error.response?.data,
            },
          };
        });
    });

    const results = await Promise.all(promises);

    return {
      summary: {
        total: coursesArray.length,
        success: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "failed").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        completedAt: new Date().toISOString(),
      },
      details: results,
    };
  } catch (error) {
    console.error("Error enrolling user in Thinkific courses:", error);
    throw error;
  }
};

// Keep the rest of the functions as they are
const initializeStatsDocument = async () => {
  const statsRef = doc(firestore, "overallstats", "overallstats");
  const statsSnap = await getDoc(statsRef);

  if (!statsSnap.exists()) {
    await setDoc(statsRef, {
      totalEnrolledStudents: 0,
      totalRevenue: 0,
      createdAt: "July 29, 2025 at 11:41:29 AM",
    });
  }
  return statsRef;
};

const updateSiteStats = async () => {
  try {
    const statsRef = await initializeStatsDocument();
    await updateDoc(statsRef, { totalEnrolledStudents: increment(1) });
  } catch (error) {
    console.error("Error updating site stats:", error);
    throw error;
  }
};

const updateTotalRevenue = async (amount) => {
  try {
    const statsRef = await initializeStatsDocument();
    await updateDoc(statsRef, { totalRevenue: increment(amount) });
  } catch (error) {
    console.error("Error updating revenue:", error);
    throw error;
  }
};

// Keep the email functions as they are
const sendInitialEnrollmentEmail = async (userData) => {
  try {
    const templateRef = doc(
      firestore,
      "email_templates",
      "initialEnroll_email"
    );
    const templateSnap = await getDoc(templateRef);
    if (templateSnap.exists()) {
      const template = templateSnap.data().template;
      await fetch(`/api/sendMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userData.email,
          subject: "Your Admission is Approved! Access Your LMS Now",
          htmlTemplate: template,
          placeholders: {
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            companyName: "Honhaar Jawan",
          },
        }),
      });
      console.log(
        `Initial enrollment email sent successfully to ${userData.email}`
      );
    } else {
      console.error("Template initialEnroll_email not found.");
    }
  } catch (error) {
    console.error("Failed to send initial enrollment email:", error);
  }
};

const sendAdditionalEnrollmentEmail = async (userData, addedCourses) => {
  try {
    const templateRef = doc(firestore, "email_templates", "additional_email");
    const templateSnap = await getDoc(templateRef);
    if (templateSnap.exists()) {
      const template = templateSnap.data().template;
      await fetch(`/api/sendMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userData.email,
          subject: "Your Course Has Been Successfully Added!",
          htmlTemplate: template,
          placeholders: {
            fullName: userData.fullName,
            added_courses: addedCourses,
            companyName: "Honhaar Jawan",
          },
        }),
      });
      console.log(
        `Additional enrollment email sent successfully to ${userData.email}`
      );
    } else {
      console.error("Template additional_email not found.");
    }
  } catch (error) {
    console.error("Failed to send additional enrollment email:", error);
  }
};

const sendCertificateEmail = async (certificateData, completionDate) => {
  try {
    const templateRef = doc(firestore, "email_templates", "certificate_email");
    const templateSnap = await getDoc(templateRef);
    if (templateSnap.exists()) {
      const template = templateSnap.data().template;
      await fetch(`/api/sendMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: certificateData.email,
          subject: "Honhaar Jawan - Certificate HardCopy Fee Paid",
          htmlTemplate: template,
          placeholders: {
            fullName: certificateData.fullName,
            course_name: certificateData.name,
            completion_date: completionDate,
            certificate_fee: "2500 PKR",
            companyName: "Honhaar Jawan",
          },
        }),
      });
      console.log(
        `Certificate email sent successfully to ${certificateData.email}`
      );
    } else {
      console.error("Template certificate_email not found.");
    }
  } catch (error) {
    console.error("Failed to send certificate email:", error);
  }
};

/**
 * Calculates the class start date based on the admission date.
 * Each day of the month has a specific number of days to add.
 *
 * @param {Date|string} admissionDate - The admission date (can be a Date object or a YYYY-MM-DD string).
 * @returns {Date} The calculated class start date.
 */
const calculateClassStartDate = (admissionDate) => {
  // Ensure the input is a JavaScript Date object
  const date = new Date(admissionDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date provided.");
  }

  const day = date.getDate(); // Gets the day of the month (1-31)
  let daysToAdd = 0;

  // --- SPECIFIC DAYS LOGIC ---
  if (day >= 1 && day < 10) {
    daysToAdd = 20 - day;
  } else if (day >= 10 && day < 20) {
    daysToAdd = 32 - day;
  } else if (
    (day >= 20 && day < 31) ||
    (day >= 20 && day < 30) ||
    (day >= 20 && day < 28)
  ) {
    daysToAdd = 41 - day;
  }

  // Create a new date object for the result and add the calculated days
  const classStartDate = new Date(date);
  classStartDate.setDate(daysToAdd);

  return classStartDate;
};

/**
 * Calculates the numeric delay value based on the admission date.
 * Each day of the month has a specific number of days to add.
 *
 * @param {Date|string} admissionDate - The admission date (can be a Date object or a YYYY-MM-DD string).
 * @returns {number} The numeric delay value.
 */
const calculateClassDelay = (admissionDate) => {
  // Ensure the input is a JavaScript Date object
  const date = new Date(admissionDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date provided.");
  }

  const day = date.getDate(); // Gets the day of the month (1-31)
  let daysToAdd = 0;

  // --- SPECIFIC DAYS LOGIC ---
  if (day >= 1 && day < 10) {
    daysToAdd = 20 - day;
  } else if (day >= 10 && day < 20) {
    daysToAdd = 32 - day;
  } else if (
    (day >= 20 && day < 31) ||
    (day >= 20 && day < 30) ||
    (day >= 20 && day < 28)
  ) {
    daysToAdd = 41 - day;
  }

  return daysToAdd;
};

export async function POST(req) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength === "0" || contentLength === null) {
      console.error("Empty request body received");
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
      return NextResponse.json(
        { error: "Invalid JSON format", details: error.message },
        { status: 400 }
      );
    }

    const { message, invoiceId, invoice, timestamp } = payload;
    const invoiceKey = invoiceId || invoice;
    if (!message || !invoiceKey || !timestamp) {
      console.error("Missing required fields in payload:", payload);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Received payload:", {
      invoice: invoiceKey,
      message,
      timestamp,
    });

    const enrollmentType = invoiceKey.slice(-1);
    console.log("Determined enrollment type:", enrollmentType);

    let userDoc = null;
    let invoiceIndex = -1;
    let certificateDoc = null;

    if (enrollmentType === "1") {
      const usersQuery = query(
        collection(firestore, "users"),
        where("generatedPayProId.invoiceNumber", "==", invoiceKey)
      );
      const usersSnapshot = await getDocs(usersQuery);
      if (usersSnapshot.empty) {
        console.log(
          "No user found with generatedPayProId.invoiceNumber:",
          invoiceKey
        );
        return NextResponse.json(
          {
            error: "User not found for initial enrollment",
            invoice: invoiceKey,
          },
          { status: 404 }
        );
      }
      userDoc = usersSnapshot.docs[0];
    } else if (enrollmentType === "2") {
      const usersQuery = query(collection(firestore, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        invoiceIndex =
          userData.additionalCourses_pending_invoice?.findIndex(
            (inv) => inv?.invoiceNumber === invoiceKey
          ) ?? -1;
        if (invoiceIndex !== -1) {
          userDoc = doc;
          break;
        }
      }
    } else if (enrollmentType === "3") {
      const certificatesQuery = query(
        collection(firestore, "certificates"),
        where("generatedPayProId.invoiceNumber", "==", invoiceKey)
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      if (certificatesSnapshot.empty) {
        console.log(
          "No certificate found with generatedPayProId.invoiceNumber:",
          invoiceKey
        );
        return NextResponse.json(
          {
            error: "Certificate not found for hardcopy request",
            invoice: invoiceKey,
          },
          { status: 404 }
        );
      }
      certificateDoc = certificatesSnapshot.docs[0];
    }

    if (!userDoc && !certificateDoc) {
      console.log(
        "No match found for invoice:",
        invoiceKey,
        "enrollment type:",
        enrollmentType
      );
      return NextResponse.json(
        {
          error: "Invoice not found",
          invoice: invoiceKey,
          details: "No matching invoice found",
        },
        { status: 404 }
      );
    }

    const paidAtFormatted = new Date().toISOString();

    if (enrollmentType === "1") {
      // INITIAL ENROLLMENT - CHECK IF USER EXISTS IN FIRESTORE, CREATE IF NOT
      const invoiceData = userDoc.data();
      const pendingInvoiceRef = userDoc.ref;

      // Check if user already has a Thinkific ID in Firestore
      let thinkificUserId = invoiceData.user_lms_id;

      if (!thinkificUserId || thinkificUserId === "nouserid") {
        console.log(
          "User does not have a valid Thinkific ID in Firestore, creating new user"
        );

        try {
          // Always create a new user in Thinkific
          thinkificUserId = await createUserOnThinkific(invoiceData);

          // Update Firestore with the new Thinkific user ID
          await updateDoc(pendingInvoiceRef, {
            user_lms_id: thinkificUserId,
            "generatedPayProId.user_lms_id": thinkificUserId,
          });

          console.log("New Thinkific user created with ID:", thinkificUserId);
        } catch (error) {
          console.error("Failed to create new Thinkific user:", error);
          return NextResponse.json(
            {
              error: "Failed to create user in Thinkific",
              details: error.message,
            },
            { status: 500 }
          );
        }
      } else {
        console.log(
          "Using existing Thinkific user ID from Firestore:",
          thinkificUserId
        );
      }

      const courses = Array.isArray(
        invoiceData.generatedPayProId?.selectedCourses
      )
        ? invoiceData.generatedPayProId.selectedCourses
        : [invoiceData.generatedPayProId?.selectedCourses].filter(
            (x) => x?.lmsCourseId
          );

      // Log course details for debugging
      console.log(
        "Courses to enroll:",
        courses.map((c) => ({
          name: c.name,
          lmsCourseId: c.lmsCourseId,
        }))
      );

      await updateDoc(pendingInvoiceRef, {
        "generatedPayProId.paid": true,
        status: 5,
        "generatedPayProId.status": "paid",
        PaidAt: serverTimestamp(),
      });

      try {
        const enrollmentResults = await enrollOnThinkific(
          thinkificUserId,
          courses
        );
        console.log("Enrollment results:", enrollmentResults);
      } catch (error) {
        console.error("Failed to enroll user in courses:", error);
        // Continue with the process even if enrollment fails
      }

      await updateSiteStats();
      await updateTotalRevenue(5000);

      // Calculate admission date using the new function
      const currentDate = new Date();
      currentDate.setMonth(11);
      currentDate.setDate(9);
      const admissionDate = calculateClassStartDate(currentDate);

      // Calculate the numeric delay value
      const admissionDelay = calculateClassDelay(currentDate);

      // Format the admission date for display in emails
      const formattedAdmissionDate = admissionDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const email = invoiceData.email;
      const password = invoiceData.password;

      // Define email templates
      const Enrollment_Template = `
<table
  role='presentation'
  width='100%'
  cellpadding='0'
  cellspacing='0'
  border='0'
  style='
    background-color: #f4f4f4;
    font-family: Arial, sans-serif;
    padding: 20px 0;
    margin: 0;
  '
>
  <tr>
    <td align='center'>
      <table
        role='presentation'
        cellpadding='0'
        cellspacing='0'
        border='0'
        width='600'
        style='
          max-width: 600px;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
        '
      >
        <!-- Official Header -->
        <tr>
          <td
            style='
              background: #015516;
              color: white;
              padding: 15px 25px;
              text-align: center;
            '
          >
            <strong>Enrollment Confirmation - Honhaar Jawan Program</strong>
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td
            align='center'
            style='
              padding: 25px 0 15px 0;
              background-color: #ffffff;
              border-bottom: 2px solid #015516;
            '
          >
            <a
              href='https://honhaarjawan.pk'
              target='_blank'
              style='text-decoration: none'
            >
              <img
                src='https://i.ibb.co/nMsL0RNP/Honhaar-Jawan-Logo.png'
                alt='Honhaar Jawan'
                width='150'
                style='
                  display: block;
                  border: 0;
                  outline: none;
                  text-decoration: none;
                '
              />
            </a>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td
            style='
              padding: 25px;
              color: #333333;
              font-size: 16px;
              line-height: 1.7;
              text-align: left;
            '
          >
            <p style='margin: 0 0 16px 0'><strong>Dear Applicant,</strong></p>

            <p style='margin: 0 0 20px 0'>
              <strong style='color: #015516'>Congratulations.</strong> Your
              admission has been
              <strong style='color: #015516'>approved</strong>. Our team has
              verified your documents, payment information, and application
              details. You are now enrolled in the
              <strong>Honhaar Jawan Program</strong>.
            </p>

            <!-- LMS Credentials Section -->
            <table
              width='100%'
              style='
                background: #f8f9fa;
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
              '
            >
              <tr>
                <td>
                  <h3 style='color: #015516; margin: 0 0 15px 0'>
                    LMS Portal Credentials
                  </h3>
                  <p style='margin: 0 0 10px 0'>
                    You can now log in to the Learning Management System (LMS)
                    to access your course materials:
                  </p>

                  <table width='100%' style='margin: 10px 0'>
                    <tr>
                      <td width='30%'><strong>Portal Link:</strong></td>
                      <td width='70%'>
                        <a
                          href='https://honhaarjawan.pk/login'
                          style='color: #007bff; text-decoration: none'
                          >honhaarjawan.pk/login</a
                        >
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>${email}</td>
                    </tr>
                    <tr>
                      <td><strong>Password:</strong></td>
                      <td>${password}</td>
                    </tr>
                  </table>

                  <p style='margin: 15px 0 0 0; text-align: center'>
                    <a
                      href='https://honhaarjawan.pk/login'
                      style='
                        display: inline-block;
                        background-color: #015516;
                        color: #ffffff;
                        padding: 12px 25px;
                        border-radius: 4px;
                        text-decoration: none;
                        font-weight: bold;
                      '
                      >Access LMS</a
                    >
                  </p>
                </td>
              </tr>
            </table>

            <!-- Getting Started Section -->
            <h3
              style='
                color: #015516;
                margin: 25px 0 15px 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
              '
            >
              Course Information
            </h3>

            <ul style='margin: 0 0 25px 20px; padding: 0'>
              <li style='margin-bottom: 8px'>
                <strong>Lesson Progress:</strong> Watch each video lesson and
                click "Complete & Continue" to move to the next one.
              </li>
              <li style='margin-bottom: 8px'>
                <strong>Weekly Uploads:</strong> New lessons are added every
                week.
              </li>
              <li style='margin-bottom: 8px'>
                <strong>Assessments:</strong> Each section contains MCQs. A
                final test of 50 MCQs will be conducted at the end of the
                course.
              </li>
              <li style='margin-bottom: 8px'>
                <strong>Certificate:</strong> After completing the course and
                passing the final exam, you may request a digital or hard copy
                certificate recognized by the
                <strong>Government of Punjab</strong>.
              </li>
            </ul>

            <p style='margin: 0 0 16px 0'>
              For any questions or technical issues, please contact
              <a
                href='mailto:info.department@honhaarjawan.pk'
                style='color: #007bff; text-decoration: none'
                >info.department@honhaarjawan.pk</a
              >.
            </p>

            <p style='margin: 0 0 16px 0'>
              Best regards,<br />
              <strong>Team Honhaar Jawan</strong><br />
              <a
                href='mailto:info.department@honhaarjawan.pk'
                style='color: #007bff; text-decoration: none'
                >info.department@honhaarjawan.pk</a
              ><br />
              Website:
              <a
                href='https://honhaarjawan.pk'
                target='_blank'
                style='color: #007bff; text-decoration: none'
                >honhaarjawan.pk</a
              >
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td
            align='center'
            style='
              background-color: #015516;
              color: #ffffff;
              font-size: 13px;
              padding: 20px;
            '
          >
            &copy; 2025 Honhaar Jawan |
            <a
              href='https://honhaarjawan.pk'
              style='color: #ffffff; text-decoration: underline'
              >Visit our website</a
            >
            |
            <a
              href='mailto:info.department@honhaarjawan.pk'
              style='color: #ffffff; text-decoration: underline'
              >Contact Us</a
            >
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
      `;

      const Classes_Starting_Template = `
<table
  role='presentation'
  width='100%'
  cellpadding='0'
  cellspacing='0'
  border='0'
  style='
    background-color: #f4f4f4;
    font-family: Arial, sans-serif;
    padding: 20px 0;
    margin: 0;
  '
>
  <tr>
    <td align='center'>
      <table
        role='presentation'
        cellpadding='0'
        cellspacing='0'
        border='0'
        width='600'
        style='
          max-width: 600px;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
        '
      >
        <!-- Official Header -->
        <tr>
          <td
            style='
              background: #015516;
              color: white;
              padding: 15px 25px;
              text-align: center;
            '
          >
            <strong>Admission Confirmed - Honhaar Jawan Program</strong>
          </td>
        </tr>
        <!-- Header -->
        <tr>
          <td
            align='center'
            style='
              padding: 25px 0 15px 0;
              background-color: #ffffff;
              border-bottom: 2px solid #015516;
            '
          >
            <a
              href='https://honhaarjawan.pk'
              target='_blank'
              style='text-decoration: none'
            >
              <img
                src='https://i.ibb.co/nMsL0RNP/Honhaar-Jawan-Logo.png'
                alt='Honhaar Jawan'
                width='150'
                style='
                  display: block;
                  border: 0;
                  outline: none;
                  text-decoration: none;
                '
              />
            </a>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td
            style='
              padding: 25px;
              color: #333333;
              font-size: 16px;
              line-height: 1.7;
              text-align: left;
            '
          >
            <p style='margin: 0 0 20px 0'><strong>Dear Applicant,</strong></p>
            <p style='margin: 0 0 25px 0'>
              We are delighted to inform you that your seat has been
              successfully confirmed and your enrollment is now secured in the
              current batch of the <strong>Honhaar Jawan Program</strong>.
            </p>
            <!-- Class Start Box -->
            <table
              width='100%'
              style='
                background: #f8f9fa;
                border-radius: 8px;
                padding: 25px;
                margin: 25px 0;
                border: 2px solid #015516;
              '
            >
              <tr>
                <td align='center'>
                  <h3
                    style='color: #014710; margin: 0 0 15px 0; font-size: 20px'
                  >
                    Classes Start On
                  </h3>
                  <div
                    style='
                      color: #015516;
                      font-size: 24px;
                      font-weight: bold;
                      margin: 0;
                    '
                  >
                    ${formattedAdmissionDate}
                  </div>
                </td>
              </tr>
            </table>
            <!-- Portal Information -->
            <h3
              style='
                color: #014710;
                margin: 30px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #014710;
              '
            >
              Portal Login Information
            </h3>
            <p style='margin: 0 0 15px 0'>
              You will receive your login credentials and class details on the
              same day (<strong
                >${formattedAdmissionDate}</strong
              >).
            </p>
            <p style='margin: 0 0 20px 0'>
              These will be sent to your registered email address, so please
              check both your inbox and spam/junk folder.
            </p>
            <!-- Important Note -->
            <table
              width='100%'
              style='
                background: #e9f7ef;
                border-left: 4px solid #015516;
                padding: 15px;
                margin: 20px 0;
              '
            >
              <tr>
                <td>
                  <p style='margin: 0; color: #333333; font-size: 15px'>
                    <strong>Note:</strong> If you do not receive the email, you
                    may revisit our official website. Your account will be
                    updated with the login credentials and class information
                    there as well.
                  </p>
                </td>
              </tr>
            </table>
            <p style='margin: 25px 0 20px 0'>
              We are excited to have you onboard and are committed to supporting
              you at every step of your learning journey with
              <strong>Honhaar Jawan</strong>.
            </p>
            <p style='margin: 0 0 16px 0'>
              Should you have any questions or need further assistance, feel
              free to reach out.
            </p>
            <p style='margin: 0 0 25px 0'>
              <strong>Contact Email:</strong><br />
              <a
                href='mailto:info.department@honhaarjawan.pk'
                style='color: #007bff; text-decoration: none'
                >info.department@honhaarjawan.pk</a
              >
            </p>
            <p style='margin: 0 0 16px 0'>
              Best regards,<br />
              <strong>Team Honhaar Jawan</strong><br />
              <a
                href='https://honhaarjawan.pk'
                target='_blank'
                style='color: #007bff; text-decoration: none'
                >www.honhaarjawan.pk</a
              >
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td
            align='center'
            style='
              background-color: #015516;
              color: #ffffff;
              font-size: 13px;
              padding: 20px;
            '
          >
            &copy; 2025 Honhaar Jawan |
            <a
              href='https://honhaarjawan.pk'
              style='color: #ffffff; text-decoration: underline'
              >Visit our website</a
            >
            |
            <a
              href='mailto:info.department@honhaarjawan.pk'
              style='color: #ffffff; text-decoration: underline'
              >Contact Us</a
            >
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
      `;

      // Call Pabbly with templates and additional data
      console.log("Calling Pabbly API with templates and data:", {
        userEmail: invoiceData.email,
        userPassword: invoiceData.password,
        userFullName: invoiceData.fullName,
        admissionDate: formattedAdmissionDate,
        admissionDelay: admissionDelay,
        addListId: process.env.NEXT_PUBLIC_PABBLY_ENROLLED_USERS_LIST_ID
          ? "Set"
          : "MISSING",
        removeListId: process.env.NEXT_PUBLIC_PABBLY_FEE_REMINDER_LIST_ID
          ? "Set"
          : "MISSING",
        classesStartingListId: process.env
          .NEXT_PUBLIC_PABBLY_CLASSES_STARTING_LIST_ID
          ? "Set"
          : "MISSING",
        hasEnrollmentTemplate: true,
        hasClassesStartingTemplate: true,
      });

      try {
        const pabblyResponse = await fetch(
          `http://localhost:3000/api/pabbly-connect/initial-enrollment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: invoiceData,
              addListId: process.env.NEXT_PUBLIC_PABBLY_ENROLLED_USERS_LIST_ID,
              removeListId: process.env.NEXT_PUBLIC_PABBLY_FEE_REMINDER_LIST_ID,
              classesStartingListId:
                process.env.NEXT_PUBLIC_PABBLY_CLASSES_STARTING_LIST_ID,
              admissionDate: formattedAdmissionDate,
              admissionDelay: admissionDelay,
            }),
          }
        );

        if (!pabblyResponse.ok) {
          const errorText = await pabblyResponse.text();
          console.error(
            `Pabbly API returned ${pabblyResponse.status}:`,
            errorText
          );

          // Don't throw error - just log it and continue
          console.log(
            "Pabbly API failed but continuing with enrollment process"
          );
        } else {
          const result = await pabblyResponse.json();
          console.log("Pabbly API success:", result);
        }
      } catch (error) {
        console.error("Failed to call Pabbly API:", error);
        // Don't throw error - just log it and continue
        console.log("Pabbly API failed but continuing with enrollment process");
      }
    } else if (enrollmentType === "2") {
      // ADDITIONAL COURSES - FETCH EXISTING USER FROM FIRESTORE
      const invoiceData = userDoc.data();
      const pendingInvoiceRef = userDoc.ref;
      const unpaidInvoice =
        invoiceData.additionalCourses_pending_invoice[invoiceIndex];

      const updatedPendingInvoices =
        invoiceData.additionalCourses_pending_invoice.filter(
          (_, i) => i !== invoiceIndex
        );
      const paidInvoice = {
        ...unpaidInvoice,
        status: "paid",
        paidAt: Timestamp.now(),
      };

      await updateDoc(pendingInvoiceRef, {
        additionalCourses_pending_invoice: updatedPendingInvoices,
        additionalCourses_paid_invoice: arrayUnion(paidInvoice),
      });

      const courses = unpaidInvoice.selectedCourses || [];
      const addedCourses = unpaidInvoice.selectedCourses?.length
        ? unpaidInvoice.selectedCourses.map((course) => course.name).join(", ")
        : "Unknown Courses";

      // Get the user's Thinkific ID from Firestore
      const thinkificUserId = invoiceData.user_lms_id;

      if (!thinkificUserId || thinkificUserId === "nouserid") {
        console.error("User does not have a valid Thinkific ID in Firestore");
        return NextResponse.json(
          { error: "User does not have a valid Thinkific ID" },
          { status: 400 }
        );
      }

      console.log(
        "Using existing Thinkific user ID from Firestore:",
        thinkificUserId
      );

      try {
        const enrollmentResults = await enrollOnThinkific(
          thinkificUserId,
          courses
        );
        console.log("Additional course enrollment results:", enrollmentResults);
      } catch (error) {
        console.error("Failed to enroll user in additional courses:", error);
        // Continue with the process even if enrollment fails
      }

      await updateTotalRevenue(unpaidInvoice.totalAmount);

      // Send email using specific function
      await sendAdditionalEnrollmentEmail(invoiceData, addedCourses);
    } else if (enrollmentType === "3") {
      const certificateData = certificateDoc.data();
      const certificateRef = certificateDoc.ref;

      await updateDoc(certificateRef, {
        status: "printing",
        "generatedPayProId.status": "paid",
        "generatedPayProId.paidAt": Timestamp.now(),
        paidAt: paidAtFormatted,
      });

      console.log("Response after certificate Firestore update:", {
        success: true,
        invoice: invoiceKey,
        step: "Certificate status updated to processing",
        paidAt: paidAtFormatted,
      });

      await updateTotalRevenue(2500);
      console.log("Response after certificate revenue update:", {
        success: true,
        invoice: invoiceKey,
        totalAmount: 2500,
        step: "Revenue updated",
      });

      const completionDate = new Date(
        certificateData.completedAt
      ).toLocaleDateString("en-US", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Send email using specific function
      await sendCertificateEmail(certificateData, completionDate);

      console.log("Response after certificate email sent:", {
        success: true,
        invoice: invoiceKey,
        emailType: 3,
        step: "Certificate email sent",
        verificationId: certificateData.verificationId,
      });
    }

    const response = { success: true, invoice: invoiceKey };
    console.log("Final response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Webhook processing failed:", error);
    const response = {
      error: error.message || "Processing failed",
      details: error.response?.data || error.stack,
    };
    console.log("Response after error:", response);
    return NextResponse.json(response, { status: 500 });
  }
}
