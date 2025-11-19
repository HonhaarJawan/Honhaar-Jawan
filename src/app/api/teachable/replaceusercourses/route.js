  // File: /pages/api/teachable/replaceusercourses.js
  import { firestore as db } from "@/Backend/Firebase"; // Adjust import based on your Firebase setup
  import axios from "axios";

  export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { newCourseId, oldCourseId, user_lms_id, newCourseDetails } =
        req.body;
      console.log("API Received:", {
        newCourseId,
        oldCourseId,
        user_lms_id,
        newCourseDetails,
      });

      // Validate required fields
      if (!newCourseId || !oldCourseId || !user_lms_id || !newCourseDetails) {
        return res.status(400).json({
          error: "Missing required fields",
          details:
            "newCourseId, oldCourseId, user_lms_id, and newCourseDetails are required",
        });
      }

      // First, unenroll from the old course
      console.log("Unenrolling from course:", oldCourseId);
      try {
        const unenrollResponse = await axios.post(
          "https://developers.teachable.com/v1/unenroll",
          {
            user_id: user_lms_id,
            course_id: oldCourseId,
          },
          {
            headers: {
              accept: "application/json",
              "content-type": "application/json",
              apiKey: process.env.NEXT_PUBLIC_TEACHABLE_API_KEY,
            },
            timeout: 10000,
          }
        );
        console.log("Unenroll response:", unenrollResponse.data);
      } catch (unenrollError) {
        console.error(
          "Unenroll error:",
          unenrollError.response?.data || unenrollError.message
        );
        // Continue with enrollment even if unenroll fails
      }

      // Then, enroll in the new course
      console.log("Enrolling in course:", newCourseId);
      try {
        const enrollResponse = await axios.post(
          "https://developers.teachable.com/v1/enroll",
          {
            user_id: user_lms_id,
            course_id: newCourseId,
          },
          {
            headers: {
              accept: "application/json",
              "content-type": "application/json",
              apiKey: process.env.NEXT_PUBLIC_TEACHABLE_API_KEY,
            },
            timeout: 10000,
          }
        );
        console.log("Enroll response:", enrollResponse.data);

        // Update Firestore with the new course information
        try {
          // Find the user document by email or other identifier
          const usersRef = db.collection("users");
          const snapshot = await usersRef.where("email", "==", userEmail).get();

          if (snapshot.empty) {
            console.error("No user found with email:", userEmail);
            return res.status(404).json({ error: "User not found" });
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

          // Update the document
          await userDoc.ref.update({
            "generatedPayProId.selectedCourses": updatedCourses,
          });

          console.log("Firestore updated successfully");
        } catch (firestoreError) {
          console.error("Firestore update error:", firestoreError);
          // We still return success because the Teachable operation was successful
          // but we note that the database update failed
          return res.status(200).json({
            success: true,
            message: "Course replaced successfully but database update failed",
            warning:
              "User courses updated in Teachable but not in local database",
            data: enrollResponse.data,
          });
        }

        // Return success response
        return res.status(200).json({
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
            enrollError.response.data?.message || "Teachable API error";
          statusCode = enrollError.response.status;
        } else if (enrollError.request) {
          errorMessage = "No response received from Teachable API";
        } else {
          errorMessage = enrollError.message;
        }

        return res.status(statusCode).json({
          error: errorMessage,
          details: enrollError.response?.data || enrollError.message,
        });
      }
    } catch (error) {
      console.error("Unexpected error in course replacement:", error);

      return res.status(500).json({
        error: "Unexpected error in course replacement",
        details: error.message,
      });
    }
  }
