import { Enrollment } from "@/lib/paablyfunctions/functions";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("Pabbly API called with method: POST");

  try {
    // Parse the request body first
    const body = await req.json();

    // Then destructure from the parsed body
    const {
      user,
      addListId,
      removeListId,
      classesStartingListId,
      admissionDate,
      admissionDelay,
    } = body;

    console.log("Calling Pabbly API with data:", {
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      addListId,
      removeListId,
      classesStartingListId,
      admissionDate,
      admissionDelay,
    });

    if (!user?.email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }
    if (!user?.password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const res = await Enrollment({
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      addListId,
      removeListId,
      classesStartingListId,
      admissionDate,
      admissionDelay,
    });

    console.log("Pabbly API response:", res);

    if (res.status !== "success") {
      return NextResponse.json(
        { message: "Error From Pabbly Webhook Request", details: res },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Initial Enrollment Steps Successfully Performed",
      status: 200,
      data: res,
    });
  } catch (error) {
    console.error("Route handler error:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
