// File: /api/admin/replacecourses/route.js
import { NextResponse } from "next/server";
import { firestore as db } from "@/Backend/Firebase";
import axios from "axios";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export async function POST(req) {
  console.log("--- replaceCourses API: Request Received ---");

  try {
    const {
      newCourseId,
      oldCourseId,
      user_lms_id,
      newCourseDetails,
      userEmail,
    } = await req.json();

    console.log("API Received:", {
      newCourseId,
      oldCourseId,
      user_lms_id,
      newCourseDetails,
      userEmail,
    });

    // Validate required fields
    if (
      !newCourseId ||
      !oldCourseId ||
      !user_lms_id ||
      !newCourseDetails ||
      !userEmail
    ) {
      console.error("Missing required fields");
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "newCourseId, oldCourseId, user_lms_id, newCourseDetails, and userEmail are required",
        },
        { status: 400 }
      );
    }

    // First, expire the old course enrollment immediately
    console.log("Expiring course enrollment for:", oldCourseId);
    try {
      // Get the enrollment ID for the old course
      const getEnrollmentsResponse = await axios.get(
        `https://api.thinkific.com/api/public/v1/enrollments?query[user_id]=${user_lms_id}&query[course_id]=${oldCourseId}`,
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

        // Set the enrollment to expire in 0.1 seconds from now
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

        console.log("Course enrollment set to expire immediately");
      } else {
        console.log("No enrollment found for the old course");
      }
    } catch (expireError) {
      console.error(
        "Expire enrollment error:",
        expireError.response?.data || expireError.message
      );
      // Continue with enrollment even if expiring fails
    }

    // Then, enroll in the new course with active status
    console.log("Enrolling in course:", newCourseId);
    try {
      const enrollResponse = await axios.post(
        `https://api.thinkific.com/api/public/v1/enrollments`,
        {
          course_id: newCourseId,
          user_id: user_lms_id,
          activated_at: new Date().toISOString(), // Set activation time to now to ensure active status
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

      console.log("Enroll response:", enrollResponse.data);

      // Update Firestore with the new course information
      try {
        // Find the user document by email using Firebase v9+ syntax
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userEmail));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.error("No user found with email:", userEmail);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // Update the user document
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Update the selectedCourses array
        const updatedCourses = userData.generatedPayProId.selectedCourses.map(
          (course) =>
            course.lmsCourseId === parseInt(oldCourseId)
              ? newCourseDetails
              : course
        );

        // Update the document using Firebase v9+ syntax
        await updateDoc(userDoc.ref, {
          "generatedPayProId.selectedCourses": updatedCourses,
        });

        console.log("Firestore updated successfully");
      } catch (firestoreError) {
        console.error("Firestore update error:", firestoreError);
        // We still return success because the Thinkific operation was successful
        // but we note that the database update failed
        return NextResponse.json({
          success: true,
          message: "Course replaced successfully but database update failed",
          warning:
            "User courses updated in Thinkific but not in local database",
          data: enrollResponse.data,
        });
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Course replaced successfully",
        data: enrollResponse.data,
      });
    } catch (enrollError) {
      console.error(
        "Enroll error:",
        enrollError.response?.data || enrollError.message
      );

      // Handle specific error cases
      let errorMessage = "Enrollment failed";
      let statusCode = 500;

      if (enrollError.response) {
        errorMessage =
          enrollError.response.data?.message || "Thinkific API error";
        statusCode = enrollError.response.status;
      } else if (enrollError.request) {
        errorMessage = "No response received from Thinkific API";
      } else {
        errorMessage = enrollError.message;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: enrollError.response?.data || enrollError.message,
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Unexpected error in course replacement:", error);

    return NextResponse.json(
      {
        error: "Unexpected error in course replacement",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log("--- replaceCourses API: Request Completed ---");
  }
}
