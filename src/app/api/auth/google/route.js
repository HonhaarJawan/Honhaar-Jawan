// app/api/auth/google/route.js
import { google } from "googleapis";

export async function GET() {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/callback/google" // must match console
  );

  const url = oAuth2.generateAuthUrl({
    access_type: "offline",   // needed for refresh_token
    prompt: "consent",        // force new refresh_token each time
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });

  return Response.redirect(url);
}
