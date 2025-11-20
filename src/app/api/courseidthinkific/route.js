// /app/api/thinkific-courses/route.js
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_THINKIFIC_API_KEY;
    const subdomain = process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN;

    if (!apiKey || !subdomain) {
      return NextResponse.json(
        {
          message:
            "Missing NEXT_PUBLIC_THINKIFIC_API_KEY or NEXT_PUBLIC_THINKIFIC_SUBDOMAIN",
        },
        { status: 400 }
      );
    }

    let allCourses = [];
    let page = 1;
    let hasMore = true;
    const limit = 100; // Max per page

    while (hasMore) {
      const res = await fetch(
        `https://api.thinkific.com/api/public/v1/courses?page=${page}&limit=${limit}`,
        {
          headers: {
            "X-Auth-API-Key": apiKey,
            "X-Auth-Subdomain": subdomain,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Thinkific API error: ${res.status} ${errorText}`);
      }

      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const courses = data.items.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          status: c.status,
        }));

        allCourses = allCourses.concat(courses);

        // Check if we've reached the last page
        if (data.meta && data.meta.pagination) {
          const { current_page, total_pages } = data.meta.pagination;
          if (current_page >= total_pages) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          // If no pagination meta, assume single page
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Add a small delay to be respectful of rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Fetched ${allCourses.length} courses from Thinkific`);

    return NextResponse.json({
      count: allCourses.length,
      courses: allCourses,
    });
  } catch (err) {
    console.error("Thinkific fetch error:", err.message);
    return NextResponse.json(
      { message: "Internal Server Error", error: err.message },
      { status: 500 }
    );
  }
}
