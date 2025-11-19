import { NextResponse } from "next/server";
import { firestore } from "@/Backend/Firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export async function POST(req) {
  try {
    console.log("Starting POST request for /api/swich/additional-psid");

    // Parse the request body
    const requestBody = await req.json();
    console.log("Received request body:", requestBody);

    // Extract the fields in the same format as the working generate-psid endpoint
    const { uid, email, firstName, lastName, courses, formNo, mobile } =
      requestBody;

    // Generate fullName from firstName and lastName
    const fullName = `${firstName} ${lastName}`;

    // Calculate total amount (3000 per course)
    const totalFee = courses.length * 3000;
    console.log("Calculated total amount:", totalFee);

    // Generate unique invoice number
    const websiteId = "777";
    const gatewayId = "283";
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const identifier = formNo || mobile;
    const invoice = `${websiteId}-${gatewayId}-${identifier}-${totalFee}-${randomNumber}-2`;
    console.log("Generated invoice number:", invoice);

    // Use the first selected course for the payment API (just like the initial route)
    const course = {
      title: courses[0].name,
      price: totalFee,
      courseId: courses[0].lmsCourseId,
      id: courses[0].id,
      thumbnailUrl:
        "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
    };

    // Create the exact same payload structure as the initial route
    const payload = {
      websiteId: "777",
      requestedPaymentGateway: "283",
      courseEnrollmentType: "course",
      method: "biller",
      course: course,
      user: {
        userId: uid,
        fullName: fullName,
        email: email,
        address: "Wow Street Lahore",
        phone: "2020445324",
      },
      invoiceNumber: invoice,
    };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://api.eduprogram.pk/api/payment-management/payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    console.log("Response status:", response.status);

    let data;
    data = await response.json();

    console.log("Response data:", JSON.stringify(data, null, 2));

    // Handle different response structures
    let paymentData;
    if (data.data) {
      paymentData = data.data;
    } else {
      paymentData = data;
    }

    // Check if the response has the expected structure
    if (!paymentData.consumerNumber) {
      console.error("Invalid response structure:", data);
      return NextResponse.json(
        { error: "Invalid response from payment API", details: data },
        { status: 500 }
      );
    }

    // Prepare additionalCourseRecord for Firestore
    const invoiceCreatedAt = new Date();
    const formattedDate = invoiceCreatedAt.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
      timeZone: "Asia/Karachi",
    });

    // Ensure selectedCourses does not have undefined values
    const validSelectedCourses = courses.map((course) => ({
      courseId: course.id,
      name: course.name,
      lmsCourseId: course.lmsCourseId,
      coursePrice: 3000,
    }));

    const additionalCourseRecord = {
      fullName: fullName,
      email: email,
      payProId: paymentData.payProId || paymentData.consumerNumber,
      invoiceNumber: paymentData.invoiceNumber || invoice,
      totalAmount: totalFee,
      status: "pending",
      invoiceCreatedAt: formattedDate,
      selectedCourses: validSelectedCourses,
    };

    // Update Firestore with the course record
    try {
      const userRef = doc(firestore, "users", email);
      await updateDoc(userRef, {
        additionalCourses_pending_invoice: arrayUnion(additionalCourseRecord),
      });
      console.log("Firestore update completed for user:", email);
    } catch (firestoreError) {
      console.error("Error updating Firestore:", firestoreError);
      // Continue with the response even if Firestore update fails
    }

    // Return the same response structure as the initial route
    return NextResponse.json({
      consumerNumber: paymentData.consumerNumber,
      invoiceNumber: paymentData.invoiceNumber || invoice,
    });
  } catch (error) {
    console.error("Error in additional-psid API:", error);
    return NextResponse.json(
      { error: "Failed to create PSID: " + error.message },
      { status: 500 }
    );
  }
}
