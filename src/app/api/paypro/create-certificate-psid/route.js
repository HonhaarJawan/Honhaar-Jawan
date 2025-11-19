import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      verificationId,
      email,
      fullName,
      courseName,
      completedAt,
      cnic,
      invoice,
    } = await req.json();

    const totalFee = 2500; // Certificate fee

    const payload = {
      websiteId: process.env.NEXT_PUBLIC_WEBSITE_ID,
      requestedPaymentGateway: process.env.NEXT_PUBLIC_GATEWAY_ID,
      courseEnrollmentType: "certificate_hardcopy",
      course: {
        title: courseName || "Certificate Hardcopy Request",
        price: totalFee,
        courseId: "certificate",
        id: "certificate_hardcopy",
        thumbnailUrl:
          "https://via.placeholder.com/300x200.png?text=Certificate",
      },
      user: {
        userId: verificationId,
        fullName: fullName,
        email: email,
        address: "Pakistan",
        phone: "03000000000",
      },
      invoiceNumber: invoice,
    };

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

    let data;
    data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating certificate PSID:", error);
    return NextResponse.json(
      { error: "Failed to create certificate PSID" },
      { status: 500 }
    );
  }
}
