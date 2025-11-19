import axios from "axios";

export async function POST(req) {
  // Validate environment variables first
  if (
    !process.env.NEXT_PUBLIC_THINKIFIC_API_KEY ||
    !process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN
  ) {
    console.error("Missing Thinkific API configuration");
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { user } = await req.json();

    if (!user || !user.email) {
      return Response.json(
        { error: "User data with email is required" },
        { status: 400 }
      );
    }

    const THINKIFIC_API_BASE_URL = "https://api.thinkific.com/api/public/v1";
    const NEXT_PUBLIC_THINKIFIC_API_KEY = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
    const NEXT_PUBLIC_THINKIFIC_SUBDOMAIN = process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;

    const url = `${THINKIFIC_API_BASE_URL}/users`;
    const headers = {
      "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
      "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
      "Content-Type": "application/json",
    };

    // Split fullName into first_name and last_name
    const nameParts = user.fullName ? user.fullName.split(" ") : ["", ""];
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "Name";

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      password: user.password || "defaultuser",
    };

    console.log("Creating Thinkific user with payload:", payload);

    const response = await axios.post(url, payload, { headers });
    console.log("Thinkific user created successfully:", response.data);

    return Response.json({
      success: true,
      thinkificUserId: response.data.id,
      user: response.data
    });
  } catch (error) {
    console.error(
      "Thinkific user creation failed:",
      error.response?.data || error.message
    );

    // If email is already taken, try to find the user again to get their ID
    if (error.response?.data?.errors?.email?.includes("already been taken")) {
      console.log("Email already taken, trying to find existing user...");

      try {
        const THINKIFIC_API_BASE_URL = "https://api.thinkific.com/api/public/v1";
        const NEXT_PUBLIC_THINKIFIC_API_KEY = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
        const NEXT_PUBLIC_THINKIFIC_SUBDOMAIN = process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;

        const headers = {
          "X-Auth-API-Key": NEXT_PUBLIC_THINKIFIC_API_KEY,
          "X-Auth-Subdomain": NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
          "Content-Type": "application/json",
        };

        // Wait a bit and try again to find the user
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const finalResponse = await axios.get(
          `${THINKIFIC_API_BASE_URL}/users?query=${encodeURIComponent(user.email)}`,
          { headers }
        );

        if (finalResponse.data.items && finalResponse.data.items.length > 0) {
          console.log(
            "Found existing user after creation error:",
            finalResponse.data.items[0]
          );
          return Response.json({
            success: true,
            thinkificUserId: finalResponse.data.items[0].id,
            user: finalResponse.data.items[0],
            existing: true
          });
        }
      } catch (finalError) {
        console.error(
          "Final attempt failed:",
          finalError.response?.data || finalError.message
        );
      }
    }

    return Response.json(
      {
        success: false,
        error: "Failed to create Thinkific user",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}