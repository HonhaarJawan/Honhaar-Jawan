import { NextResponse } from "next/server";
import { firestore } from "@/Backend/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { courses } from "@/Data/Data";

// Handle different operations based on request
export async function POST(req) {
  try {
    // Read the body only once
    const body = await req.json();
    const { operation } = body;

    switch (operation) {
      case "create":
        return await createStudentCard(body);
      case "track":
        return await trackStudentCard(body);
      case "verify":
        return await verifyCompletion(body);
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Student Card API error:", error);
    return NextResponse.json(
      { error: "Operation failed: " + error.message },
      { status: 500 }
    );
  }
}

// Create a new student card application
async function createStudentCard(body) {
  const {
    email,
    cnic,
    courseId,
    minCompletionPercentage,
    fullName,
    mobile,
    rollNo,
    challanNo,
  } = body;

  if (!email || !cnic || !courseId) {
    return NextResponse.json(
      { error: "Email, CNIC, and course ID are required" },
      { status: 400 }
    );
  }

  // Query user by email
  const userQuery = query(
    collection(firestore, "users"),
    where("email", "==", email.toLowerCase())
  );
  const userQuerySnapshot = await getDocs(userQuery);

  if (userQuerySnapshot.empty) {
    return NextResponse.json(
      { error: "No user found with this email" },
      { status: 404 }
    );
  }

  const userDoc = userQuerySnapshot.docs[0].data();

  if (userDoc.cnic !== cnic) {
    return NextResponse.json(
      { error: "CNIC does not match our records" },
      { status: 400 }
    );
  }

  if (!userDoc.user_lms_id) {
    return NextResponse.json(
      {
        error:
          "Your account is missing LMS information. Please contact support.",
      },
      { status: 400 }
    );
  }

  const courseDetails = courses.find(
    (c) => c.id.toString() === courseId.toString()
  );
  if (!courseDetails) {
    return NextResponse.json(
      { error: "The selected course is not valid" },
      { status: 400 }
    );
  }

  // If minCompletionPercentage is 0 or not provided, skip Thinkific verification entirely
  let completionPercentage = 0;
  if (minCompletionPercentage > 0) {
    // Verify course completion
    const verificationResult = await verifyCourseCompletion(
      userDoc.user_lms_id,
      courseDetails.lmsCourseId,
      minCompletionPercentage
    );

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error },
        { status: 400 }
      );
    }

    completionPercentage = verificationResult.actualCompletion;
  }

  // Check if student card application already exists
  const cardQuery = query(
    collection(firestore, "honhaarCardApplications"),
    where("email", "==", email.toLowerCase()),
    where("courseId", "==", courseId.toString())
  );
  const cardSnapshot = await getDocs(cardQuery);

  if (!cardSnapshot.empty) {
    const existingCard = cardSnapshot.docs[0].data();
    return NextResponse.json({
      message: "Student card application already exists",
      application: {
        verificationCode: existingCard.verificationCode,
        fullName: existingCard.fullName,
        courseName: existingCard.courseName,
        appliedAt: existingCard.appliedAt,
        status: existingCard.status,
      },
    });
  }

  // Generate new verification code (12-digit number)
  const verificationCode = Math.floor(
    100000000000 + Math.random() * 900000000000
  ).toString();

  const studentCardData = {
    verificationCode,
    fullName:
      fullName || `${userDoc.firstName} ${userDoc.lastName || ""}`.trim(),
    email: email.toLowerCase(),
    cnic,
    mobile: mobile || "",
    lmsCourseId: courseDetails.lmsCourseId,
    courseName: courseDetails.name,
    courseId: courseId.toString(),
    userId: userDoc.uid,
    rollNo: rollNo || "",
    challanNo: challanNo || "",
    appliedAt: new Date().toISOString(),
    status: "pending",
    completionPercentage,
    requiredPercentage: minCompletionPercentage || 0,
  };

  await addDoc(
    collection(firestore, "honhaarCardApplications"),
    studentCardData
  );

  return NextResponse.json({
    message: "Student card application submitted successfully",
    application: {
      verificationCode,
      fullName: studentCardData.fullName,
      courseName: studentCardData.courseName,
      appliedAt: studentCardData.appliedAt,
      status: studentCardData.status,
    },
  });
}

// Track existing student card applications
async function trackStudentCard(body) {
  const { email, courseId } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Query student card applications collection for the provided email
  const applicationsRef = collection(firestore, "honhaarCardApplications");
  let q = query(applicationsRef, where("email", "==", email.toLowerCase()));

  // If courseId is provided, add it to the query
  if (courseId) {
    q = query(
      applicationsRef,
      where("email", "==", email.toLowerCase()),
      where("courseId", "==", courseId.toString())
    );
  }

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return NextResponse.json({
      applications: [],
      message: "No student card applications found for this email address",
    });
  }

  // Extract application data
  const applications = [];
  querySnapshot.forEach((doc) => {
    applications.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return NextResponse.json({
    applications,
    count: applications.length,
  });
}

// Verify course completion in Thinkific
async function verifyCompletion(body) {
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Make the request to Thinkific API v1
    const thinkificResponse = await fetch(
      `https://api.thinkific.com/api/public/v1/enrollments?query[user_id]=${userId}`,
      {
        headers: {
          "X-Auth-API-Key": process.env.THINKIFIC_API_KEY,
          "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!thinkificResponse.ok) {
      const errorData = await thinkificResponse.json();
      console.error(
        "Thinkific API Error Response:",
        thinkificResponse.status,
        errorData
      );
      return NextResponse.json(
        {
          error: `Thinkific API Error: ${
            thinkificResponse.status
          } - ${JSON.stringify(errorData)}`,
        },
        { status: thinkificResponse.status }
      );
    }

    const data = await thinkificResponse.json();
    return NextResponse.json({
      success: true,
      data: data.items || [],
    });
  } catch (error) {
    console.error("Error fetching Thinkific enrollments:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch enrollments from Thinkific",
        details: error.message,
        status: 500,
      },
      { status: 500 }
    );
  }
}

// Helper function to verify course completion
async function verifyCourseCompletion(
  userId,
  courseId,
  minCompletionPercentage = 0
) {
  try {
    // Make the request to Thinkific API v1
    const thinkificResponse = await fetch(
      `https://api.thinkific.com/api/public/v1/enrollments?query[user_id]=${userId}&query[course_id]=${courseId}`,
      {
        headers: {
          "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
          "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!thinkificResponse.ok) {
      const errorData = await thinkificResponse.json();
      console.error(
        "Thinkific API Error Response:",
        thinkificResponse.status,
        errorData
      );
      return {
        success: false,
        error: `Thinkific API Error: ${
          thinkificResponse.status
        } - ${JSON.stringify(errorData)}`,
      };
    }

    const data = await thinkificResponse.json();

    // Check if we have any enrollments
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: "You are not enrolled in this course on the learning platform",
      };
    }

    // Find the specific course enrollment
    const courseEnrollment = data.items.find(
      (enrollment) => enrollment.course_id.toString() === courseId.toString()
    );

    if (!courseEnrollment) {
      return {
        success: false,
        error: "You are not enrolled in this course on the learning platform",
      };
    }

    // Get the actual completion percentage (Thinkific uses 'percentage_completed' field)
    const actualCompletion = courseEnrollment.percentage_completed || 0;

    // Check if course completion meets the minimum requirement
    if (actualCompletion < minCompletionPercentage) {
      return {
        success: false,
        error: `Your course is ${actualCompletion}% complete. Please complete at least ${minCompletionPercentage}% to be eligible for a student card.`,
        actualCompletion,
        requiredCompletion: minCompletionPercentage,
      };
    }

    return {
      success: true,
      actualCompletion,
    };
  } catch (error) {
    console.error("Error checking Thinkific enrollment:", error);
    return {
      success: false,
      error:
        "Failed to verify course completion status. Please try again later.",
    };
  }
}
