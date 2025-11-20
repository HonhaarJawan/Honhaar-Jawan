import { NextResponse } from "next/server";
import { firestore as db } from "@/Backend/Firebase";
import axios from "axios";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export async function POST(req) {
  console.log("--- Manual Unenrollment API: Request Received ---");

  try {
    const { userId, userEmail, userLmsId, courses } = await req.json();

    console.log("Manual Unenrollment API Received:", {
      userId,
      userEmail,
      userLmsId,
      courses,
    });

    // Validate required fields
    if (
      !userId ||
      !userEmail ||
      !userLmsId ||
      !courses ||
      !Array.isArray(courses) ||
      courses.length === 0
    ) {
      console.error("Missing required fields");
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "userId, userEmail, userLmsId, and courses array are required",
        },
        { status: 400 }
      );
    }

    // Validate that userLmsId exists
    if (!userLmsId) {
      return NextResponse.json(
        {
          error: "User LMS ID is required for unenrollment",
          details: "Please ensure the user has a Thinkific account",
        },
        { status: 400 }
      );
    }

    const unenrollmentResults = [];
    const errors = [];

    // Process each course unenrollment
    for (const course of courses) {
      try {
        console.log(
          `Unenrolling user ${userLmsId} from course ${course.courseId}`
        );

        // First, get the enrollment ID for the course
        const getEnrollmentsResponse = await axios.get(
          `https://api.thinkific.com/api/public/v1/enrollments?query[user_id]=${userLmsId}&query[course_id]=${course.lmsCourseId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
              "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
            },
            timeout: 10000,
          }
        );

        if (
          getEnrollmentsResponse.data.items &&
          getEnrollmentsResponse.data.items.length > 0
        ) {
          const enrollmentId = getEnrollmentsResponse.data.items[0].id;

          // Set the enrollment to expire immediately
          const now = new Date();
          now.setSeconds(now.getSeconds() + 0.1);
          const formattedDate = now.toISOString();

          await axios.put(
            `https://api.thinkific.com/api/public/v1/enrollments/${enrollmentId}`,
            {
              expires_at: formattedDate,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
                "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
              },
              timeout: 10000,
            }
          );

          console.log(`Unenrollment successful for course ${course.courseId}`);
          unenrollmentResults.push({
            courseId: course.courseId,
            name: course.name,
            lmsCourseId: course.lmsCourseId,
            success: true,
          });
        } else {
          console.log(`No enrollment found for course ${course.courseId}`);
          errors.push({
            courseId: course.courseId,
            name: course.name,
            error: "No enrollment found for this course",
          });
        }
      } catch (error) {
        console.error(
          `Failed to unenroll from course ${course.courseId}:`,
          error.response?.data || error.message
        );
        errors.push({
          courseId: course.courseId,
          name: course.name,
          error: error.response?.data?.message || error.message,
        });
      }
    }

    // Update Firestore to remove the courses
    try {
      // Find the user document by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.error("No user found with email:", userEmail);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Update the user document
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Remove courses from initial courses if present
      let updatedInitialCourses = [];
      if (
        userData.generatedPayProId &&
        userData.generatedPayProId.selectedCourses
      ) {
        updatedInitialCourses =
          userData.generatedPayProId.selectedCourses.filter(
            (course) => !courses.some((c) => c.courseId === course.courseId)
          );
      }

      // Remove courses from additional courses if present
      let updatedAdditionalCourses = [];
      if (userData.additionalCourses_paid_invoice) {
        updatedAdditionalCourses = userData.additionalCourses_paid_invoice
          .map((invoice) => {
            const filteredCourses = invoice.selectedCourses.filter(
              (course) => !courses.some((c) => c.courseId === course.courseId)
            );
            return {
              ...invoice,
              selectedCourses: filteredCourses,
            };
          })
          .filter((invoice) => invoice.selectedCourses.length > 0); // Remove empty invoices
      }

      // Update the document
      await updateDoc(userDoc.ref, {
        "generatedPayProId.selectedCourses": updatedInitialCourses,
        additionalCourses_paid_invoice: updatedAdditionalCourses,
      });

      console.log("Firestore updated successfully with manual unenrollment");
    } catch (firestoreError) {
      console.error("Firestore update error:", firestoreError);
      // We still return the unenrollment results but note the database update failed
      return NextResponse.json({
        success: true,
        message: "Courses unenrolled successfully but database update failed",
        warning: "User courses updated in Thinkific but not in local database",
        unenrollmentResults,
        errors,
      });
    }

    // Return response with results and errors
    return NextResponse.json({
      success: true,
      message: `Successfully unenrolled from ${unenrollmentResults.length} course(s)`,
      unenrollmentResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Unexpected error in manual unenrollment:", error);

    return NextResponse.json(
      {
        error: "Unexpected error in manual unenrollment",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log("--- Manual Unenrollment API: Request Completed ---");
  }
}
