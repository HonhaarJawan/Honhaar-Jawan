import { NextResponse } from "next/server";
 
export async function GET() {
  try {
    const response = await fetch(
      "https://emails.pabbly.com/api/subscribers-list",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer IGNLHWPJlE2A`,
          "Content-Type": "application/json",
        },
      }
    );
 
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
 