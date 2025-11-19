import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  console.log("--- unenrollUser API: Request Received ---");
  try {
    const { userId, courses } = await req.json();

    console.log("unenrollUser API: Request Payload:", { userId, courses });

    if (
      !userId ||
      !courses ||
      !Array.isArray(courses) ||
      courses.length === 0
    ) {
      console.error(
        "unenrollUser API: Missing userId or courses array in request."
      );
      return NextResponse.json(
        { message: "Missing userId or courses array." },
        { status: 400 }
      );
    }

    const externalUnenrollApiUrl =
      process.env.NEXT_PUBLIC_EXTERNAL_UNENROLL_API; // Your external API endpoint for unenrollment

    if (!externalUnenrollApiUrl) {
      console.warn(
        "unenrollUser API: NEXT_PUBLIC_EXTERNAL_UNENROLL_API environment variable is not set. This API might not function correctly."
      );
      return NextResponse.json(
        { message: "Unenrollment API endpoint not configured." },
        { status: 500 }
      );
    }

    console.log(
      `unenrollUser API: Attempting to unenroll user ${userId} from courses:`,
      courses,
      `via URL: ${externalUnenrollApiUrl}`
    );

    const response = await axios.post(
      externalUnenrollApiUrl,
      {
        userId: userId,
        courses: courses,
      },
      {
        headers: {
          "Content-Type": "application/json",
          // Add any necessary authorization headers for your external API
          // "Authorization": `Bearer ${process.env.EXTERNAL_API_KEY}`,
        },
      }
    );

    if (response.status >= 200 && response.status < 300) {
      // Check for 2xx status codes
      console.log(
        `unenrollUser API: Successfully unenrolled user ${userId} from courses:`,
        courses,
        "Response data:",
        response.data
      );
      return NextResponse.json({ message: "Courses unenrolled successfully." });
    } else {
      console.error(
        `unenrollUser API: External unenrollment API responded with non-2xx status ${response.status}:`,
        response.data
      );
      return NextResponse.json(
        {
          message: `Failed to unenroll courses in external system. Status: ${response.status}`,
          details: response.data,
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error(
      "unenrollUser API: Internal Server Error during unenrollment:",
      error.message
    );
    if (error.response) {
      console.error(
        "unenrollUser API: Error response data:",
        error.response.data
      );
      console.error(
        "unenrollUser API: Error response status:",
        error.response.status
      );
      console.error(
        "unenrollUser API: Error response headers:",
        error.response.headers
      );
    } else if (error.request) {
      console.error("unenrollUser API: No response received:", error.request);
    }
    return NextResponse.json(
      { message: "Internal Server Error during unenrollment." },
      { status: 500 }
    );
  } finally {
    console.log("--- unenrollUser API: Request Completed ---");
  }
}
