// app/api/curriculum/route.js

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // First, get all courses from Thinkific
    const coursesRes = await fetch(
      "/api/courseidthinkific"
    );
    const coursesData = await coursesRes.json();

    if (!coursesRes.ok) {
      throw new Error(coursesData.message || "Failed to fetch courses");
    }

    const courses = coursesData.courses;
    console.log(`Total courses fetched: ${courses.length}`);

    const curriculumData = [];

    // For each course, create mock curriculum data
    for (const course of courses) {
      console.log(`Processing course: ${course.name}, ID: ${course.id}`);

      // Create mock curriculum based on course name
      const mockCurriculum = {
        chapters: [
          {
            id: 1,
            title: "Introduction",
            lessons: [
              { id: 1, title: `Welcome to ${course.name}`, duration: "5 min" },
              { id: 2, title: "Getting Started", duration: "10 min" },
              { id: 3, title: "Course Overview", duration: "8 min" },
            ],
          },
          {
            id: 2,
            title: "Core Concepts",
            lessons: [
              { id: 4, title: "Fundamentals", duration: "15 min" },
              { id: 5, title: "Key Principles", duration: "12 min" },
              { id: 6, title: "Best Practices", duration: "10 min" },
            ],
          },
          {
            id: 3,
            title: "Practical Application",
            lessons: [
              { id: 7, title: "Hands-on Exercise", duration: "20 min" },
              { id: 8, title: "Real-world Examples", duration: "15 min" },
              { id: 9, title: "Case Studies", duration: "18 min" },
            ],
          },
          {
            id: 4,
            title: "Advanced Topics",
            lessons: [
              { id: 10, title: "Expert Techniques", duration: "25 min" },
              { id: 11, title: "Troubleshooting", duration: "15 min" },
              { id: 12, title: "Optimization", duration: "20 min" },
            ],
          },
        ],
        totalDuration: "2 hours 38 minutes",
        totalLessons: 12,
        courseInfo: {
          level: "Intermediate",
          prerequisites: "Basic understanding of the subject",
          outcomes: [
            "Master core concepts",
            "Apply practical skills",
            "Complete real-world projects",
          ],
        },
      };

      curriculumData.push({
        id: course.id,
        name: course.name,
        lmsCourseId: course.id,
        curriculum: mockCurriculum,
      });

      console.log(`✅ Added curriculum for course: ${course.name}`);
    }

    console.log(`Total curriculum entries: ${curriculumData.length}`);

    return NextResponse.json({
      success: true,
      count: curriculumData.length,
      curriculum: curriculumData,
    });
  } catch (error) {
    console.error("Error in curriculum API:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "An error occurred while fetching curriculum data",
      },
      { status: 500 }
    );
  }
}
