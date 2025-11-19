import { NextResponse } from "next/server";
import { firestore } from "@/Backend/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { courses } from "@/Data/Data";

// Handle different operations based on request
export async function POST(req) {
  try {
    // Read the body only once
    const body = await req.json();
    const { operation } = body;

    switch (operation) {
      case "create":
        return await createCertificate(body);
      case "track":
        return await trackCertificate(body);
      case "verify":
        return await verifyCompletion(body);
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Certificate API error:", error);
    return NextResponse.json(
      { error: "Operation failed: " + error.message },
      { status: 500 }
    );
  }
}

// Create a new certificate
async function createCertificate(body) {
  const { email, cnic, courseId, minCompletionPercentage } = body;

  if (!email || !cnic || !courseId) {
    return NextResponse.json(
      { error: "Email, CNIC, and course ID are required" },
      { status: 400 }
    );
  }

  // Query user by email
  const userQuery = query(
    collection(firestore, "users"),
    where("email", "==", email)
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

  // If minCompletionPercentage is 0, skip Thinkific verification entirely
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
  }

  // Check if certificate already exists
  const certQuery = query(
    collection(firestore, "certificates"),
    where("email", "==", email),
    where("courseName", "==", courseDetails.name)
  );
  const certSnapshot = await getDocs(certQuery);

  if (!certSnapshot.empty) {
    const existingCert = certSnapshot.docs[0].data();
    return NextResponse.json({
      message: "Certificate already exists",
      certificate: {
        verificationId: existingCert.verificationId,
        fullName: existingCert.fullName,
        courseName: existingCert.courseName,
        issuedAt: existingCert.issuedAt,
      },
    });
  }

  // Generate new certificate
  const verificationId = `HONHAAR-${uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase()}`;
  const certificateData = {
    verificationId,
    fullName: `${userDoc.firstName} ${userDoc.lastName || ""}`.trim(),
    email,
    lmsCourseId: courseDetails.lmsCourseId,
    courseName: courseDetails.name,
    completedAt: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    cnic,
    status: "issued",
    userId: userDoc.uid,
    address: userDoc.currentAddress,
  };

  await setDoc(doc(firestore, "certificates", verificationId), certificateData);

  return NextResponse.json({
    message: "Certificate generated successfully",
    certificate: {
      verificationId,
      fullName: certificateData.fullName,
      courseName: certificateData.courseName,
      issuedAt: certificateData.issuedAt,
    },
  });
}

// Track existing certificates
async function trackCertificate(body) {
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Query certificates collection for the provided email
  const certificatesRef = collection(firestore, "certificates");
  const q = query(certificatesRef, where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return NextResponse.json({
      certificates: [],
      message: "No certificates found for this email address",
    });
  }

  // Extract certificate data
  const certificates = [];
  querySnapshot.forEach((doc) => {
    certificates.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return NextResponse.json({
    certificates,
    count: certificates.length,
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
  minCompletionPercentage = 100
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

    // Get the actual completion percentage
    const actualCompletion = courseEnrollment.progress || 0;

    // Check if course completion meets the minimum requirement
    if (actualCompletion < minCompletionPercentage) {
      return {
        success: false,
        error: `Your course is ${actualCompletion}% complete. Please complete at least ${minCompletionPercentage}% to be eligible for a certificate.`,
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
