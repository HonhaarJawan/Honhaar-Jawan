export const BlogsData = [
  {
    id: "honhaar-student-card-program-launch",
    title:
      "Honhaar Student Card Program Launch - Your Gateway to Digital Learning",
    content: `
      <p>We are excited to announce the launch of the Honhaar Student Card Program, aimed at providing IT skills training and career development opportunities to eligible students.</p>
      
      <p>The Honhaar Student Card is your official pass to unlock a world of digital learning and career-building opportunities. This government initiative empowers youth with access to high-quality training programs, hands-on practical learning, and an internationally recognized curriculum.</p>
      
      <p>Key benefits include:</p>
      <ul>
        <li>Access to advanced IT courses</li>
        <li>Eligibility for Laptop Scheme</li>
        <li>Solar Scheme benefits</li>
        <li>Education Finance options</li>
        <li>Study Abroad opportunities</li>
        <li>National & International Internship opportunities</li>
      </ul>
      
      <p>Eligibility criteria:</p>
      <ul>
        <li>Resident of Pakistan</li>
        <li>Age between 15 to 40 years</li>
        <li>Valid CNIC / B-Form</li>
        <li>Enrolled in a registered course under Honhaar Jawan</li>
      </ul>
      
      <p>The program is completely free of cost and backed by the Government of Punjab, Department of Technical Education & Skill Development.</p>
    `,
    excerpt:
      "Announcing the launch of Honhaar Student Card Program - your gateway to digital learning and career development opportunities...",
    category: "Program Launch",
    date: "November 1 2025",
    readTime: "4 min read",
    isNew: true,
    highlights: {
      benefits: "Multiple Benefits",
      cost: "Free of Cost",
      eligibility: "Age 15-40",
    },
    programInfo:
      "The Honhaar Student Card provides access to advanced courses, learning materials, discount vouchers and other opportunities. Valid for the duration of the course (up to 6 months per phase).",
    applicationProcess: [
      "Visit the official website to apply",
      "Click 'Honhaar Student Card' menu",
      "Fill the application form with correct information",
      "Upload required documents",
      "Wait for verification and approval",
    ],
    contactInfo:
      "For queries, contact the Help Desk at info.department@honhaarjawan.pk",
    keyConditions: [
      "Must maintain ≥85% in evaluations",
      "Pass periodic assessments",
      "Regular attendance required",
      "Card is non-transferable",
      "Terms & Conditions apply",
    ],
  },

  {
    id: "course-enrollments-of-Honhaar-Jawan-are-open-only-50-000-seats",
    title:
      "Course Enrollments of Honhaar Jawan are OPEN (Only 50,000 Seats) - Jawan Skills Development Initiative",
    content: `
      <p>We are excited to announce that admissions for the Honhaar Jawan (Jawan Skills Development Initiative) are now open, offering a wide range of courses designed to equip the youth of Jawan with the skills they need for success in today's fast-paced job market.</p>
      
      <p>Honhaar Jawan is a government-backed initiative aimed at empowering the youth of Jawan with technical and vocational education, enabling them to develop skills that are in high demand across various industries. With over 80+ courses available, Honhaar Jawan offers a unique opportunity for students to learn and grow professionally.</p>
      
      <p>Our courses are structured to provide hands-on experience and practical knowledge, ensuring that every trainee not only gains theoretical insights but also develops industry-relevant skills. These courses are ideal for anyone looking to build a successful career in IT, business, design, cybersecurity, and more.</p>
      
      <p>The program includes access to our Learning Management System (LMS), where you can view course videos, attend assessments or assignments, and track your progress. Videos and relevant content will be made available regularly through LMS, and students must complete their course content to become eligible for an E-Certificate upon successful completion.</p>
      
      <p>The Honhaar Jawan initiative has already helped thousands of students enhance their careers, and many have started earning through freelancing and other job opportunities thanks to the skills they learned through the program.</p>
    `,
    excerpt:
      "We are excited to announce that admissions for the Honhaar Jawan are now open, offering a wide range of courses designed to equip the youth of Jawan...",
    category: "Announcement",
    date: "November 1 2025",
    readTime: "3 min read",
    isNew: true,
    highlights: {
      seats: "50,000",
      courses: "80+",
      level: "All Levels",
    },
    learningSystemInfo:
      "Videos, along with course content, will be made available every working Monday by 11:00 AM via the Honhaar Jawan Learning Management System. To become eligible for the E-Certificate, students must actively engage with the course content on LMS.",
    applicationProcess: [
      "Visit www.honhaarjawan.pk to apply now",
      "Register as a new applicant",
      "Select the course(s) you wish to enroll in",
      "Complete your application process by passing the admission test",
      "Enroll in your selected course(s) after payment",
    ],
    contactInfo:
      "For more information or any questions, feel free to contact us at info.department@honhaarjawan.pk.",
    relatedPosts: [
      {
        id: 1,
        title: "Complete Guide to YouTube Success - New Course Launch",
        category: "New Course",
        date: "2 hours ago",
        slug: "complete-guide-to-youtube-success",
      },
      {
        id: 5,
        title: "Cybersecurity Fundamentals Certification",
        category: "New Course",
        date: "5 days ago",
        slug: "cybersecurity-fundamentals-certification",
      },
    ],
  },
];

// Helper function to get blog by ID
export const getBlogById = (id) => {
  return BlogsData.find((blog) => blog.id === id);
};

// Helper function to get all blogs
export const getAllBlogs = () => {
  return BlogsData.sort((a, b) => b.timestamp - a.timestamp);
};

// Helper function to get blogs by category
export const getBlogsByCategory = (category) => {
  return BlogsData.filter((blog) => blog.category === category);
};

// Helper function to get recent blogs
export const getRecentBlogs = (limit = 3) => {
  return BlogsData.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
};
