import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // This data came form payload
        const {
            title,
            userId,
            email,
            firstName,
            lastName,
            totalFee,
            invoice,
        } = await request.json();

        const requiredFields = [
            "title",
            "userId",
            "email",
            "firstName",
            "lastName",
            "totalFee",
            "invoice",
        ];

        const missingFields = requiredFields.filter(
            (field) => !{
                title,
                userId,
                email,
                firstName,
                lastName,
                totalFee,
                invoice,
            }[field]
        );

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: `Missing required fields in the request body: ${missingFields.join(
                        ", "
                    )}`,
                },
                { status: 400 }
            );
        }

        const paymentPayload = {
            websiteId: process.env.NEXT_PUBLIC_WEBSITE_ID,
            requestedPaymentGateway:
                process.env.NEXT_PUBLIC_GATEWAY_ID,
            courseEnrollmentType: "bundle",
            course: {
                title,
                price: totalFee,
                courseId: "2980056",
                id: "learningPath",
                thumbnailUrl:
                    "https://firebasestorage.googleapis.com/v0/b/eskills-program-ansolutions.appspot.com/o/courseThumbnail%2FThumbnail%20-%20Microsoft%20Certifications%20-%2010.jpg?alt=media&token=8a91fa62-6aee-4b51-9208-05174e647d84",
            },
            user: {
                userId,
                fullName: `${firstName} ${lastName}`,
                email,
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
                body: JSON.stringify(paymentPayload),
            }
        );

        const data = await response.json();

        console.log("Payment response:", data);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error generating online payment:", error);
        return NextResponse.json(
            { error: "Failed to generate online payment" },
            { status: 500 }
        );
    }
}