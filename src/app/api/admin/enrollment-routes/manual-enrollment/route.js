import { NextResponse } from "next/server";
import { firestore as db } from "@/Backend/Firebase";
import axios from "axios";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export async function POST(req) {
  console.log("--- Manual Enrollment API: Request Received ---");
  
  try {
    const { userId, userEmail, userLmsId, courses } = await req.json();
    
    console.log("Manual Enrollment API Received:", {
      userId,
      userEmail,
      userLmsId,
      courses
    });

    // Validate required fields
    if (!userId || !userEmail || !userLmsId || !courses || !Array.isArray(courses) || courses.length === 0) {
      console.error("Missing required fields");
      return NextResponse.json({
        error: "Missing required fields",
        details: "userId, userEmail, userLmsId, and courses array are required"
      }, { status: 400 });
    }

    // Validate that userLmsId exists
    if (!userLmsId) {
      return NextResponse.json({
        error: "User LMS ID is required for enrollment",
        details: "Please ensure the user has a Thinkific account first"
      }, { status: 400 });
    }

    const enrollmentResults = [];
    const errors = [];

    // Process each course enrollment
    for (const course of courses) {
      try {
        console.log(`Enrolling user ${userLmsId} in course ${course.courseId}`);
        
        const enrollResponse = await axios.post(
          `https://api.thinkific.com/api/public/v1/enrollments`,
          {
            course_id: course.lmsCourseId,
            user_id: userLmsId,
            activated_at: new Date().toISOString() // Set activation time to now to ensure active status
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
              "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN
            },
            timeout: 10000,
          }
        );
        
        console.log(`Enrollment successful for course ${course.courseId}:`, enrollResponse.data);
        enrollmentResults.push({
          courseId: course.courseId,
          name: course.name,
          lmsCourseId: course.lmsCourseId,
          success: true,
          data: enrollResponse.data
        });
      } catch (error) {
        console.error(`Failed to enroll in course ${course.courseId}:`, error.response?.data || error.message);
        errors.push({
          courseId: course.courseId,
          name: course.name,
          error: error.response?.data?.message || error.message
        });
      }
    }

    // Update Firestore with the new course information
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

      // Check if user has additionalCourses_paid_invoice array
      let additionalCourses = userData.additionalCourses_paid_invoice || [];
      
      // Create a new invoice entry for the manually enrolled courses
      const newInvoice = {
        invoiceNumber: `MANUAL-${Date.now()}`,
        selectedCourses: courses.map(course => ({
          courseId: course.courseId,
          name: course.name,
          lmsCourseId: course.lmsCourseId
        })),
        paidAt: new Date().toISOString(),
        paymentMethod: "Manual Enrollment",
        amount: 0, // Free enrollment
        status: "paid"
      };

      additionalCourses.push(newInvoice);

      // Update the document
      await updateDoc(userDoc.ref, {
        additionalCourses_paid_invoice: additionalCourses,
      });

      console.log("Firestore updated successfully with manual enrollment");
    } catch (firestoreError) {
      console.error("Firestore update error:", firestoreError);
      // We still return the enrollment results but note the database update failed
      return NextResponse.json({
        success: true,
        message: "Courses enrolled successfully but database update failed",
        warning: "User courses updated in Thinkific but not in local database",
        enrollmentResults,
        errors
      });
    }

    // Return response with results and errors
    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${enrollmentResults.length} course(s)`,
      enrollmentResults,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Unexpected error in manual enrollment:", error);

    return NextResponse.json({
      error: "Unexpected error in manual enrollment",
      details: error.message,
    }, { status: 500 });
  } finally {
    console.log("--- Manual Enrollment API: Request Completed ---");
  }
}