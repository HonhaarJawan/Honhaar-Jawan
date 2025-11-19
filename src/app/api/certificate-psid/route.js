import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      verificationId,
      email,
      fullName,
      totalFee,
      invoice,
      courseName,
      completedAt,
      cnic,
    } = await req.json();

    const payload = {
      websiteId: "777",
      requestedPaymentGateway: "283",
      courseEnrollmentType: "course",
      method: "biller",
      course: {
        title: `Certificate - ${courseName || "Course Completion"}`,
        price: totalFee || 2500,
        courseId: "CERT-HARDCOPY",
        id: "certificate_hardcopy",
        thumbnailUrl:
          "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
      },
      user: {
        userId: verificationId,
        fullName: `${fullName}`,
        email: email,
        address: "Wow Street Lahore",
        phone: "2020445324",
      },
      invoiceNumber: invoice,
      // Additional fields for certificate identification
      certificateDetails: {
        verificationId: verificationId,
        courseName: courseName,
        completedAt: completedAt,
        cnic: cnic,
      },
    };

    console.log(
      "Sending certificate payload:",
      JSON.stringify(payload, null, 2)
    );

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

    console.log("Certificate PSID Response status:", response.status);

    let data;
    data = await response.json();

    console.log(
      "Certificate PSID Response data:",
      JSON.stringify(data, null, 2)
    );

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

    return NextResponse.json({
      consumerNumber: paymentData.consumerNumber,
      invoiceNumber: paymentData.invoiceNumber || invoice,
    });
  } catch (error) {
    console.error("Error generating certificate PSID:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate PSID", details: error.message },
      { status: 500 }
    );
  }
}
