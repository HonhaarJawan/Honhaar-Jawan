import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, firstName, lastName } = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MAILER_APIENDPOINT}/subscribers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_token: process.env.NEXT_PUBLIC_MAILER_API_TOKEN,
          list_uid: process.env.NEXT_PUBLIC_ALL_USERS_LIST_ID,
          EMAIL: email,
          FIRST_NAME: firstName,
          LAST_NAME: lastName,
          status: "subscribed",
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to add contact: ${text}`);
    }

    return NextResponse.json(
      { message: "Contact added to all users list" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
