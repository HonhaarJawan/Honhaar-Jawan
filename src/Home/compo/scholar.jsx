"use client";
import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Laptop,
  Sun,
  Banknote,
  Users,
  MapPin,
  Award,
  Target,
  Briefcase,
  Globe,
} from "lucide-react";
import SiteDetails from "@/Data/SiteData";
const cards = [
  {
    id: "honhaar-card",
    title: `${SiteDetails.studentCard}`,
    tagline: "Your unified access pass",
    description:
      "The official Honhaar Card that connects you to all education programs and digital initiatives.",
    href: "/honhaar-student-card",
    Icon: CreditCard,
  },
  {
    id: "solar-laptop",
    title: "Solar & Laptop Scheme",
    tagline: "Empowering learning through energy and devices",
    description:
      "Combined initiative providing free laptops and solar support to ensure uninterrupted digital education.",
    href: "/solar-laptop-scheme",
    Icon: Sun,
  },
  {
    id: "education-finance",
    title: "Study & Education Finance",
    tagline: "Study Abroad & Education Funding",
    description:
      "financial aid and mentorship to help students pursue higher education locally and globally.",
    href: "/education-finance",
    Icon: Banknote,
  },
  {
    id: "internships",
    title: "Internships",
    tagline: "From learning to earning",
    description:
      "Gain hands-on experience and professional exposure through the Internship initiative.",
    href: "/internships",
    Icon: Briefcase,
  },
];

const regionalStats = [
  {
    region: "Punjab",
    students: "20,000",
    color: "bg-blue-500",
    image: "/card/punjab.avif",
    landmark: "Badshahi Mosque, Lahore",
  },
  {
    region: "Khyber Pakhtunkhwa",
    students: "15,000",
    color: "bg-green-500",
    image: "/card/khybar.avif",
    landmark: "Khyber Pass",
  },
  {
    region: "Sindh",
    students: "15,000",
    color: "bg-yellow-500",
    image: "/card/sindh.avif",
    landmark: "Mohenjo-daro",
  },
  {
    region: "Balochistan",
    students: "15,000",
    color: "bg-red-500",
    image: "/card/blochistan.avif",
    landmark: "Hanna Lake",
  },
  {
    region: "GB & AJK",
    students: "15,000",
    color: "bg-purple-500",
    image: "/card/AJK.avif",
    landmark: "Hunza Valley",
  },
];

function Scholar() {
  return (
    <section className="relative py-20 mt-10 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden">
      <style jsx>{`
        @keyframes rotate3d {
          0% {
            transform: perspective(1200px) rotateY(-10deg) rotateX(5deg);
          }
          50% {
            transform: perspective(1200px) rotateY(10deg) rotateX(-5deg);
          }
          100% {
            transform: perspective(1200px) rotateY(-10deg) rotateX(5deg);
          }
        }

        .card-3d-rotate {
          animation: rotate3d 8s ease-in-out infinite;
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }

        .govt-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.4) 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
          z-index: 1;
        }

        .stat-card-content {
          position: relative;
          z-index: 10;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 govt-badge rounded-full text-white font-semibold text-sm mb-6">
            <Award className="w-4 h-4" />
            Vision of Government of Punjab
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {SiteDetails.studentCard} Programs
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Empowering students across Pakistan with access to technology,
            energy, finance, and career-building opportunities.
          </p>
        </header>

        {/* Honhaar Card Visual */}
        <div className="flex flex-col mx-auto items-center">
          <div className="card-3d-rotate mb-6">
            <img
              src="/Student-Card.avif"
              className="rounded-2xl border border-white shadow-2xl max-w-lg w-full"
              alt={`${SiteDetails.studentCard} Display`}
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <Target className="w-6 h-6 text-yellow-300" />
              <h3 className="text-2xl font-bold text-white">
                Free Technical Training – 80,000 {SiteDetails.studentCard}s
              </h3>
              <Users className="w-6 h-6 text-yellow-300" />
            </div>
          </div>

          {/* Regional Grid */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-0.5 bg-green-300/30 absolute hidden lg:block"></div>
              <div className="h-4/5 w-0.5 bg-green-300/30 absolute hidden lg:block"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
              {regionalStats.map((stat, index) => (
                <div key={stat.region} className="group relative">
                  <div
                    className="stat-card relative rounded-2xl p-6 border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-lg group-hover:shadow-2xl h-64 overflow-hidden"
                    style={{ backgroundImage: `url(${stat.image})` }}
                  >
                    <div className="absolute inset-0 bg-white/75 z-10"></div>
                    <div
                      className="absolute inset-0 z-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${stat.image})` }}
                    ></div>

                    <div className="stat-card-content relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div>
                          <MapPin className="w-4 h-4 text-black" />
                        </div>
                        <div className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full">
                          #{index + 1}
                        </div>
                      </div>

                      <div className="text-center mb-3">
                        <div className="text-3xl font-bold text-primary">
                          {stat.students}
                        </div>
                        <div className="text-xs text-primary uppercase tracking-wider font-semibold">
                          Students
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-0.5 bg-white/50 mx-auto mb-2 group-hover:bg-yellow-300 transition-colors"></div>
                        <div className="text-sm font-bold text-primary">
                          {stat.region}
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-0.5 right-0.5 bg-yellow-500 text-green-900 text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300 z-20">
                      ✓ Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="flex flex-col gap-8 mt-16 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {cards.map(({ id, title, tagline, description, href, Icon }) => (
              <Link
                key={id}
                href={href}
                className="group block bg-white rounded-2xl p-6 border-2 border-green-800 hover:shadow-xl relative h-[300px] transition-all duration-300 hover:border-green-600"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-green-800 flex items-center justify-center border-2 border-green-800 group-hover:bg-green-700 transition-colors">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900 mb-1">
                      {title}
                    </h3>
                    <p className="text-xs font-semibold text-green-700">
                      {tagline}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">{description}</p>

                <div className="absolute bottom-6 left-6 right-6">
                  <hr className="border-t border-green-200 mb-4" />
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-green-800 hover:bg-green-900 text-white font-bold rounded-lg transition-colors group-hover:gap-3">
                    Apply Now
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Scholar;
