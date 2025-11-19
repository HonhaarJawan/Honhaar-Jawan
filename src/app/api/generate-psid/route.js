import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { title, userId, email, firstName, lastName, totalFee, invoice } =
      await req.json();

    const payload = {
      websiteId: "777",
      requestedPaymentGateway: "283",
      courseEnrollmentType: "course",
      course: {
        title: title,
        price: totalFee,
        courseId: "2980056",
        id: "machine_learning",
        thumbnailUrl:
          "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
      },
      user: {
        userId: userId,
        fullName: `${firstName} ${lastName}`,
        email: email,
        address: "Wow Street Lahore",
        phone: "2020445324",
      },
      invoiceNumber: invoice,
    };

    const response = await fetch(
      "https://api.eduportal.com.pk/api/payment-management/payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    let data;
    data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profileeee" },
      { status: 500 }
    );
  }
}