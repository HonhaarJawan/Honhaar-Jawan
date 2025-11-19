export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { courses } from "@/Data/sitemapdata/data";

export async function POST() {
  console.log("🔹 API called, total courses:", courses.length);

  try {
    const BASE_URL = "https://honhaarjawan.pk";

    const urls = courses
      .map((c) => {
        const loc = `${BASE_URL}/courses/details/${c.slug}`;
        return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    const out = path.join(process.cwd(), "public", "sitemap.xml");
    fs.writeFileSync(out, xml);
    console.log("✅ sitemap.xml written at:", out);

    return new Response(
      JSON.stringify({ success: true, count: courses.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ sitemap generation failed:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
