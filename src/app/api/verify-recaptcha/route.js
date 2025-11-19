import { NextResponse } from "next/server";

export async function POST(req) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" });
  }

  const secretKey =
    process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY || "6Lfdio4rAAAAAF7icHXl9klRTSjSDX5WtxvqQVS0"; // Use your secret key

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
