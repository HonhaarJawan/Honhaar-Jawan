import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      uid,
      email,
      fullName,
      totalFee,
      invoice,
      selectedCourses,
    } = await req.json();

    // Use the first selected course or default to the Microsoft course
    const course =
      selectedCourses && selectedCourses.length > 0
        ? {
            title: selectedCourses[0].name,
            price: totalFee,
            courseId: selectedCourses[0].lmsCourseId,
            id: selectedCourses[0].id,
            thumbnailUrl:
              "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
          }
        : {
            title: "Microsoft 365 Fundamentals (MS-900)",
            price: totalFee,
            courseId: "2980056",
            id: "machine_learning",
            thumbnailUrl:
              "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
          };

    const payload = {
      websiteId: "777",
      requestedPaymentGateway: "283",
      courseEnrollmentType: "course",
      method: "biller",
      course: course,
      user: {
        userId: uid,
        fullName: `${fullName}`,
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

    return NextResponse.json({
      consumerNumber: paymentData.consumerNumber,
      invoiceNumber: paymentData.invoiceNumber || invoice,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profileeee", details: error.message },
      { status: 500 }
    );
  }
}
