import admin, { db } from "@/Backend/FirebaseAdminSDK";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { user } = await req.json();
    console.log("Received user:", user);

    const userRef = db.collection("users").doc(user.email);
    console.log("Firestore doc ref created for:", user.email);

    const fullName = user.name || user.fullName || "";
    console.log("Full name to use:", fullName);

    const options = {
      method: "POST",
      url: "https://developers.teachable.com/v1/users",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        apiKey: process.env.NEXT_PUBLIC_TEACHABLE_API_KEY,
      },
      data: {
        name: fullName,
        email: user.email,
        password: user.password,
      },
    };

    console.log("Sending request to Teachable API with options:", options);

    const res = await axios.request(options);
    console.log("Teachable API response:", res.data);

    const now = new Date();
    const twentyDaysAgo = new Date(now.setDate(now.getDate() - 20));
    console.log("Twenty days ago date:", twentyDaysAgo);

    const updateData = {
      user_lms_id: res.data.id,
      lms_password: user.password,
    };

    if (user.status === 4) {
      updateData.PaidAt = admin.firestore.Timestamp.fromDate(twentyDaysAgo);
      console.log("User status is 4, setting PaidAt:", updateData.PaidAt);
    }

    console.log("Updating Firestore with data:", updateData);

    await userRef.update(updateData);

    console.log("Firestore update successful");

    return new Response(
      JSON.stringify({
        success: true,
        teachableUserId: res.data.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    let errorMessage = "Failed to create user";
    if (error.response) {
      // Teachable-specific error handling
      if (error.response.status === 422) {
        errorMessage = "User with this email already exists";
      } else {
        errorMessage = error.response.data?.message || errorMessage;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}
