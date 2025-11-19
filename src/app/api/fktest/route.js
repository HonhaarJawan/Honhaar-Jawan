import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Path to your public/courses folder
    const folderPath = path.join(process.cwd(), "public/ppsc/");

    // Read files in that folder
    const files = fs.readdirSync(folderPath);

    // Filter only .webp images
    const webpFiles = files.filter((file) => file.toLowerCase().endsWith(".png"));

    // Return JSON response
    return Response.json({ images: webpFiles });
  } catch (err) {
    console.error("❌ Error reading folder:", err);
    return new Response(
      JSON.stringify({ error: "Failed to read folder" }),
      { status: 500 }
    );
  }
}
