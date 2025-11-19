import axios from "axios";

export async function POST(req) {
  try {
    const { email } = await req.json(); // Extract email from the request body

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    // Call Teachable's API to check if user exists by email
    const options = {
      method: "GET",
      url: `https://developers.teachable.com/v1/users?email=${encodeURIComponent(
        email
      )}`,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        apiKey: process.env.NEXT_PUBLIC_TEACHABLE_API_KEY,
      },
    };

    const res = await axios.request(options);

    // Teachable API returns an array of users; check if any match the email
    const users = res.data.users || [];
    const userExists =
      users.length > 0 && users.some((user) => user.email === email);

    if (userExists) {
      const user = users.find((u) => u.email === email);
      return new Response(
        JSON.stringify({
          verified: true,
          userId: user.id,
          email: user.email,
          name: user.name,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          verified: false,
          message: "User not found on Teachable",
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(
      "Error verifying user on Teachable:",
      error.response?.data || error.message
    );
    return new Response(
      JSON.stringify({
        error: "Failed to verify user on Teachable",
        details: error.response?.data?.error || error.message,
      }),
      { status: 500 }
    );
  }
}
