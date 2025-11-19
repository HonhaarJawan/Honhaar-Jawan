// src/app/api/thinkific/route.js
import { NextResponse } from "next/server";

const NEXT_PUBLIC_THINKIFIC_API_KEY = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
const NEXT_PUBLIC_THINKIFIC_SUBDOMAIN = process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;
const THINKIFIC_API_BASE_URL = `https://api.thinkific.com/api/2`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("query"); // Get the email from the 'query' param

  if (!userEmail) {
    return NextResponse.json(
      { error: "Missing email query parameter" },
      { status: 400 }
    );
  }

  try {
    // THIS IS THE CRITICAL LINE TO VERIFY WITH THINKIFIC DOCS
    // Using filter[email] which is a common Thinkific v2 filtering method
    const thinkificResponse = await fetch(
      `${THINKIFIC_API_BASE_URL}/users?filter[email]=${encodeURIComponent(
        userEmail
      )}`,
      {
        headers: {
          "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
          "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!thinkificResponse.ok) {
      const errorData = await thinkificResponse.json();
      console.error(
        "Thinkific GET API Error Response (from Thinkific itself):",
        thinkificResponse.status,
        errorData
      );
      return NextResponse.json(
        {
          error: `Thinkific API Error: ${
            thinkificResponse.status
          } - ${JSON.stringify(errorData)}`,
        },
        { status: thinkificResponse.status }
      );
    }

    const data = await thinkificResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy GET error (network/unexpected):", error);
    return NextResponse.json(
      { error: `Failed to fetch from Thinkific: ${error.message}` },
      { status: 500 }
    );
  }
}

// Keep your POST function as is, its endpoint is typically just /users for creation.
export async function POST(request) {
  const body = await request.json();
  const { email, first_name, last_name, password } = body;

  if (!email || !first_name || !password) {
    return NextResponse.json(
      { error: "Missing required fields for Thinkific user creation" },
      { status: 400 }
    );
  }

  try {
    const createResponse = await fetch(`${THINKIFIC_API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
        "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name,
        last_name,
        password,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error(
        "Thinkific POST API Error Response (from Thinkific itself):",
        createResponse.status,
        errorData
      );
      return NextResponse.json(
        {
          error: `Thinkific User Creation Error: ${
            createResponse.status
          } - ${JSON.stringify(errorData)}`,
        },
        { status: createResponse.status }
      );
    }

    const newThinkificUser = await createResponse.json();
    return NextResponse.json(newThinkificUser);
  } catch (error) {
    console.error("Proxy POST error (network/unexpected):", error);
    return NextResponse.json(
      { error: `Failed to create user in Thinkific: ${error.message}` },
      { status: 500 }
    );
  }
}
