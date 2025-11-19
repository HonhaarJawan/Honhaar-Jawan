import axios from "axios";
import { NextResponse } from "next/server";

const API_ENDPOINT = "https://api.thinkific.com/api/public/v1";
const NEXT_PUBLIC_THINKIFIC_API_KEY = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
const NEXT_PUBLIC_THINKIFIC_SUBDOMAIN = process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;

const THINKIFIC_HEADERS = {
  "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
  "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
  "Content-Type": "application/json",
};

export async function POST(req) {
  console.log("--- Thinkific Enrollments API: Request Received ---");
  try {
    const {
      newCourseIds = [],
      oldCourseIds = [],
      user_lms_id,
    } = await req.json();

    console.log("Thinkific Enrollments API: Request Payload:", {
      user_lms_id,
      newCourseIds,
      oldCourseIds,
    });

    if (
      !user_lms_id ||
      (!Array.isArray(newCourseIds) && !Array.isArray(oldCourseIds))
    ) {
      console.error(
        "Thinkific Enrollments API: Invalid input - missing user_lms_id or invalid course ID arrays."
      );
      return NextResponse.json(
        {
          error:
            "Invalid input: user_lms_id is required, and newCourseIds or oldCourseIds must be arrays.",
        },
        { status: 400 }
      );
    }

    const results = {
      unenrolled: [],
      enrolled: [],
      errors: [],
    };

    console.log(
      "Thinkific Enrollments API: Starting operations for user_lms_id:",
      user_lms_id
    );

    // --- Step 1: Get all enrolled courses for the user from LMS ---
    let userEnrollments = [];
    if (oldCourseIds.length > 0) {
      console.log(
        `Thinkific Enrollments API: Fetching current enrollments for user ${user_lms_id} to process unenrollments.`
      );
      const getEnrolledUserDataOptions = {
        method: "GET",
        url: `${API_ENDPOINT}/enrollments?query[user_id]=${user_lms_id}`,
        headers: THINKIFIC_HEADERS,
      };

      if (!API_ENDPOINT || !NEXT_PUBLIC_THINKIFIC_API_KEY || !NEXT_PUBLIC_THINKIFIC_SUBDOMAIN) {
        console.error(
          "Thinkific Enrollments API: Missing Thinkific API environment variables."
        );
        throw new Error("Missing Thinkific API environment variables.");
      }

      try {
        const getEnrolledUserDataRes = await axios.request(
          getEnrolledUserDataOptions
        );
        userEnrollments = getEnrolledUserDataRes.data.items;
        console.log(
          "Thinkific Enrollments API: Successfully fetched user enrollments:",
          userEnrollments.length
        );
      } catch (fetchError) {
        console.error(
          "Thinkific Enrollments API: Error fetching user enrollments from Thinkific:",
          fetchError.response?.data || fetchError.message
        );
        results.errors.push({
          action: "fetch_enrollments",
          message: `Failed to fetch existing enrollments: ${
            fetchError.response?.data?.message || fetchError.message
          }`,
        });
      }
    } else {
      console.log(
        "Thinkific Enrollments API: No oldCourseIds provided, skipping enrollment fetch."
      );
    }

    // --- Step 2: Process Unenrollments (oldCourseIds) ---
    console.log(
      "Thinkific Enrollments API: Processing unenrollments for:",
      oldCourseIds
    );
    const unenrollPromises = oldCourseIds.map(async (oldCourseId) => {
      try {
        const enrollmentToUnenroll = userEnrollments.find(
          (enrollment) => enrollment.course_id === Number(oldCourseId)
        );

        if (!enrollmentToUnenroll) {
          const errorMessage = `Enrollment for course ID ${oldCourseId} not found for user ${user_lms_id} in Thinkific. Skipping unenrollment.`;
          results.errors.push({
            courseId: oldCourseId,
            action: "unenroll",
            message: errorMessage,
          });
          console.warn(errorMessage);
          return null;
        }

        console.log(
          `Thinkific Enrollments API: Attempting to unenroll user ${user_lms_id} from course ${oldCourseId} (Enrollment ID: ${enrollmentToUnenroll.id})`
        );
        const unenrollUserOptions = {
          method: "PUT",
          url: `${API_ENDPOINT}/enrollments/${enrollmentToUnenroll.id}`,
          headers: THINKIFIC_HEADERS,
          data: {
            user_id: user_lms_id,
            course_id: Number(oldCourseId),
            expiry_date: new Date().toISOString(),
          },
        };

        const unenrollRes = await axios.request(unenrollUserOptions);
        results.unenrolled.push({
          courseId: oldCourseId,
          enrollmentId: unenrollRes.data.id,
          userId: user_lms_id,
        });
        console.log(
          `Thinkific Enrollments API: Successfully unenrolled from course ${oldCourseId}.`
        );
        return unenrollRes.data;
      } catch (err) {
        const errorMessage = `Failed to unenroll from course ${oldCourseId} in Thinkific: ${
          err.response?.data?.message || err.message
        }`;
        results.errors.push({
          courseId: oldCourseId,
          action: "unenroll",
          message: errorMessage,
        });
        console.error(errorMessage, err.response?.data);
        return null;
      }
    });

    await Promise.all(unenrollPromises);
    console.log(
      "Thinkific Enrollments API: Finished processing all unenrollment promises."
    );

    // --- Step 3: Process Enrollments (newCourseIds) ---
    console.log(
      "Thinkific Enrollments API: Processing enrollments for:",
      newCourseIds
    );
    const enrollPromises = newCourseIds.map(async (newCourseId) => {
      try {
        console.log(
          `Thinkific Enrollments API: Attempting to enroll user ${user_lms_id} in course ${newCourseId}.`
        );
        const enrollUserOptions = {
          method: "POST",
          url: `${API_ENDPOINT}/enrollments`,
          headers: THINKIFIC_HEADERS,
          data: {
            user_id: user_lms_id,
            course_id: Number(newCourseId),
            activated_at: new Date().toISOString(),
          },
        };

        const enrollRes = await axios.request(enrollUserOptions);
        results.enrolled.push({
          courseId: newCourseId,
          enrollmentId: enrollRes.data.id,
          userId: user_lms_id,
        });
        console.log(
          `Thinkific Enrollments API: Successfully enrolled in course ${newCourseId}.`
        );
        return enrollRes.data;
      } catch (err) {
        const errorMessage = `Failed to enroll in course ${newCourseId} in Thinkific: ${
          err.response?.data?.message || err.message
        }`;
        results.errors.push({
          courseId: newCourseId,
          action: "enroll",
          message: errorMessage,
        });
        console.error(errorMessage, err.response?.data);
        return null;
      }
    });

    await Promise.all(enrollPromises);
    console.log(
      "Thinkific Enrollments API: Finished processing all enrollment promises."
    );

    // --- Step 4: Return Comprehensive Response ---
    const statusCode = results.errors.length > 0 ? 207 : 200;
    console.log(
      `Thinkific Enrollments API: Sending response with status ${statusCode}. Results:`,
      results
    );
    return NextResponse.json(
      {
        success: results.errors.length === 0,
        message:
          results.errors.length > 0
            ? "Some Thinkific operations failed."
            : "All Thinkific operations completed successfully.",
        data: {
          unenrolled: results.unenrolled,
          enrolled: results.enrolled,
          errors: results.errors,
        },
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error(
      "Thinkific Enrollments API: Overall unexpected error in API:",
      error.message
    );
    if (
      error.message.includes("Missing Thinkific API environment variables.")
    ) {
      return NextResponse.json(
        {
          error:
            "Server configuration error: Missing Thinkific API keys or endpoint.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to process Thinkific enrollments request",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  } finally {
    console.log("--- Thinkific Enrollments API: Request Completed ---");
  }
}
