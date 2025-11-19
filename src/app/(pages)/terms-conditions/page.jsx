// TermsConditions.js
import Copyright from "@/components/primary/Copyright";
import Navbar from "@/components/primary/Navbar";

import SiteDetails from "@/Data/SiteData";
import Client from "./client/Client";

export function generateMetadata() {
  return {
    title: {
      default: `Terms & Conditions | ${SiteDetails.programName}`,
    },
    description:
      "Honhaar Jawan, a flagship initiative by the Government of Punjab, provides free online and on-campus training in IT, freelancing, digital marketing, and technical skills to empower youth with career-ready opportunities.",
    metadataBase: new URL(`https://${SiteDetails.domain}`),
    keywords: [
      "Honhaar Jawan",
      "honhaar Jawan",
      " Honhaar Jawan Program",
      "Jawan Government Skills Program",
      "Chief Minister Skills Initiative",
      "CM Jawan Honhaar Program",
      "Government of Jawan free courses",
      "Jawan youth training program",
      "Jawan digital skills program",
      "Jawan IT training",
      "Jawan free online courses",
      "Honhaar Jawan courses",
      "Honhaar Jawan registration",
      "Honhaar Jawan admissions",
      "Honhaar Jawan portal",
      "Honhaar Jawan login",
      "Honhaar Jawan LMS",
      "Honhaar Jawan official website",
      "honhaarjawan.pk",
      "Jawan youth empowerment",
      "Jawan skills development",
      "Jawan free skill training",
      "Jawan vocational education",
      "technical training Jawan",
      "IT skills Jawan",
      "free courses Jawan",
      "online training Jawan",
      "digital literacy Jawan",
      "freelancing training Jawan",
      "eCommerce training Jawan",
      "programming courses Jawan",
      "graphic design courses Jawan",
      "career development Jawan",
      "job ready skills Jawan",
      "technical education Jawan",
      "vocational training Jawan",
      "free certifications Jawan",
      "digital skills training Jawan",
      "youth employability Jawan",
      "Jawan technology education",
      "learn and earn Jawan",
      "freelancers Jawan",
      "Jawan online education",
      "Honhaar Jawan initiative",
      "Honhaar Jawan skill courses",
      "Honhaar Jawan free IT training",
      "Honhaar Jawan application",
      "Honhaar Jawan career growth",
      "Honhaar Jawan registration form",
      "Honhaar Jawan government initiative",
      "Jawan talent development program",
      "Jawan youth future",
      "Jawan jobs and training",
      "Jawan learning portal",
      "Professional courses Jawan",
      "Free government courses Jawan",
      "Skill building Jawan",
      "Jawan CM youth initiative",
      "Honhaar Jawan certificate program",
      "Jawan government free learning",
      "Digital Jawan youth training",
      "Skill development Jawan",
      "Honhaar Jawan job opportunities",
      "Honhaar Jawan technical training",
      "Honhaar Jawan IT courses",
      "Jawan education initiative",
      "Youth success Jawan",
      "Jawan youth employment program",
      "Government funded training Jawan",
      "Career skills Jawan",
      "Future ready youth Jawan",
      "Empowering Jawan youth",
      "Professional training Jawan",
      "Online learning Jawan",
      "Free education Jawan",
      "Career growth Jawan",
      "Jawan innovation program",
      "Technology courses Jawan",
      "Freelancing skills Jawan",
      "Web development training Jawan",
      "Digital marketing Jawan",
      "Creative skills Jawan",
      "Honhaar Jawan success stories",
      "Honhaar Jawan free admissions",
      "Honhaar Jawan official site",
      "Honhaar Jawan online apply",
      "Jawan technical education board",
      "Jawan youth excellence program",
      "Honhaar Jawan talent empowerment",
      "Government of Jawan youth initiative",
      "Honhaar Jawan skill development program",
      "Honhaar Jawan learning management system",
      "Jawan youth digital future",
      "Honhaar Jawan professional certifications",
      "CM Jawan youth program",
      "Honhaar Jawan IT courses online",
      "Honhaar Jawan training center",
      "Honhaar Jawan youth platform",
      "Honhaar Jawan skills empowerment",
      "Honhaar Jawan vocational certifications",
      "Jawan youth empowerment scheme",
      "Honhaar Jawan application form",
      "honhaarjawan.pk login",
      "honhaarjawan.pk apply",
      "honhaarjawan.pk registration",
    ],
    openGraph: {
      title: `${SiteDetails.programName}`,
      description:
        "Honhaar Jawan, a flagship initiative by the Government of Punjab, provides free online and on-campus training in IT, freelancing, digital marketing, and technical skills to empower youth with career-ready opportunities.",

      url: "https://honhaarjawan.pk/contact",
      type: "website",
      images: [
        {
          url: "/favicon.ico",
          width: 1200,
          height: 630,
          alt: "Honhaar Jawan",
        },
      ],
      locale: "en_PK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${SiteDetails.programName}`,
      description:
        "Honhaar Jawan, a flagship initiative by the Government of Punjab, provides free online and on-campus training in IT, freelancing, digital marketing, and technical skills to empower youth with career-ready opportunities.",
      images: ["/favicon.ico"],
    },
    canonical: `https://${SiteDetails.domain}`,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
  };
}

const TermsConditions = () => {
  return (
    <>
      <Navbar />
      <Client />
      <Copyright />
    </>
  );
};

export default TermsConditions;
