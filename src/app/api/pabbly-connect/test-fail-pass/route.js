import { Test_Failed } from "@/lib/paablyfunctions/functions";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { user, addListId, removeListId, testMarks, htmlTemplate, subject } =
    await req.json();

  if (!user.email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }
  try {
    const res = await Test_Failed({
      email: user.email,
      fullName: user.fullName,
      addListId,
      removeListId,
      
      htmlTemplate,
      subject,
      testMarks,
    });

    if (res.status !== "success") {
      return NextResponse.json(
        { message: "Error From Pabbly Webhook Request" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Account Created Successfully",
      status: 200,
      data: res,
    });
  } catch (error) {
    console.log(error);
  }
}
