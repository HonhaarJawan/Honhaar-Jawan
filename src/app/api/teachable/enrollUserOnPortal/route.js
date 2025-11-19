import axios from "axios";

export async function POST(req) {
  const { courseId, user_lms_id } = await req.json(); // Extracting data from the frontend request

  try {
    // Call Teachable's API to create a user
    const options = {
      method: "POST",
      url: `https://developers.teachable.com/v1/enroll`,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        apiKey: process.env.NEXT_PUBLIC_TEACHABLE_API_KEY,
      },
      data: { user_id: user_lms_id, course_id: courseId },
    };

    const res = await axios
      .request(options)
      .then((res) => {
        return res.data;    
      })
      .catch((err) => console.error(err));

    return new Response(JSON.stringify(res), { status: 200 });
  } catch (error) {
    console.error("Error creating user on Teachable:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create user on Teachable",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}