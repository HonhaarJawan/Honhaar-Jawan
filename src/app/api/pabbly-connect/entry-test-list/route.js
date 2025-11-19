import { Entry_List } from "@/lib/paablyfunctions/functions";
import { NextResponse } from "next/server";

// Explicitly export POST method
export async function POST(req) {
  console.log('Pabbly API called with method: POST');
  
  try {
    const { user, addListId } = await req.json();

    console.log('Calling Pabbly API with data:', {
      userEmail: user?.email,
      userFullName: user?.fullName,
      addListId,
    });

    if (!user?.email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    if (!user?.password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    const res = await Entry_List({
      email: user.email,
      addListId,
      fullName: user.fullName,
    });

    console.log('Pabbly API response:', res);

    if (res.status !== "success") {
      return NextResponse.json(
        { message: "Error From Pabbly Webhook Request", details: res },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Initial Entry Test Steps Successfully Performed",
      status: 200,
      data: res,
    });
  } catch (error) {
    console.error('Route handler error:', error);
    return NextResponse.json(
      { 
        message: "Internal Server Error",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Optionally export other methods if needed
export async function GET() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}