  import { NextResponse } from "next/server";
  import { google } from "googleapis";

  export async function GET(req) {
    try {
      const { searchParams } = new URL(req.url);
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        return NextResponse.json({ error: `Google OAuth Error: ${error}` }, { status: 400 });
      }

      if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
      }

      console.log("🔄 Exchanging code for tokens...");

      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:3000/api/auth/callback/google"
      );

      // Exchange code for tokens
      const { tokens } = await oAuth2Client.getToken(code);
      
      console.log('🎉 New tokens received!');
      console.log('📋 COPY THIS REFRESH TOKEN TO YOUR .env FILE:');
      console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
      console.log('⏰ Expires at:', new Date(tokens.expiry_date));

      // Return HTML page with the token for easy copying
      const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .token { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; margin: 10px 0; }
            .success { color: #28a745; }
            .warning { color: #ffc107; background: #fff3cd; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ OAuth Successful!</h1>
          <div class="warning">
            <strong>⚠️ Important:</strong> Copy the refresh token below and update your .env file
          </div>
          <h3>Refresh Token:</h3>
          <div class="token">
            <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</code>
          </div>
          <p><strong>Steps:</strong></p>
          <ol>
            <li>Copy the refresh token above</li>
            <li>Open your <code>.env</code> file</li>
            <li>Replace the old <code>GOOGLE_REFRESH_TOKEN</code> value with the new one</li>
            <li>Restart your dev server</li>
            <li>Test your Gmail API again</li>
          </ol>
          <p>You can close this tab now.</p>
        </body>
        </html>
      `;

      return new Response(htmlResponse, {
        headers: { 'Content-Type': 'text/html' },
      });
      
    } catch (error) {
      console.error("❌ OAuth Callback Error:", error);
      return NextResponse.json({ 
        error: "Failed to exchange code for tokens", 
        details: error.message 
      }, { status: 500 });
    }
  }