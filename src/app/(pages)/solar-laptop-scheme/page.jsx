import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import PageInfo from "@/components/PageInfo";
import SiteDetails from "@/Data/SiteData";
import Client from "./Client/client";

export function generateMetadata() {
  return {
    title: {
      default: `Laptop Scheme | ${SiteDetails.programName}`,
    },
    description:
      "Honhaar Jawan, a flagship initiative by the Government of Punjab, provides free online and on-campus training in IT, freelancing, digital marketing, and technical skills to empower youth with career-ready opportunities.",
    metadataBase: new URL(`https://${SiteDetails.domain}`),
    keywords: [
      "Honhaar Jawan",
      "honhaar Jawan",
      "honhaar Jawan program",
      "Punjab Government Skills Program",
      "Chief Minister Skills Initiative",
      "CM Punjab Honhaar Program",
      "Government of Punjab free courses",
      "Punjab youth training program",
      "Punjab digital skills program",
      "Punjab IT training",
      "Punjab free online courses",
      "Honhaar Jawan courses",
      "Honhaar Jawan registration",
      "Honhaar Jawan admissions",
      "Honhaar Jawan portal",
      "Honhaar Jawan login",
      "Honhaar Jawan LMS",
      "Honhaar Jawan official website",
      "honhaarjawan.pk",
      "Punjab youth empowerment",
      "Honhaar Jawan",
      "Punjab free skill training",
      "Punjab vocational education",
      "technical training Punjab",
      "IT skills Punjab",
      "free courses Punjab",
      "online training Punjab",
      "digital literacy Punjab",
      "freelancing training Punjab",
      "eCommerce training Punjab",
      "programming courses Punjab",
      "graphic design courses Punjab",
      "career development Punjab",
      "job ready skills Punjab",
      "technical education Punjab",
      "vocational training Punjab",
      "free certifications Punjab",
      "digital skills training Punjab",
      "youth employability Punjab",
      "Punjab technology education",
      "learn and earn Punjab",
      "freelancers Punjab",
      "Punjab online education",
      "Honhaar Jawan initiative",
      "Honhaar Jawan skill courses",
      "Honhaar Jawan free IT training",
      "Honhaar Jawan application",
      "Honhaar Jawan career growth",
      "Honhaar Jawan registration form",
      "Honhaar Jawan government initiative",
      "Punjab talent development program",
      "Punjab youth future",
      "Punjab jobs and training",
      "Punjab learning portal",
      "Professional courses Punjab",
      "Free government courses Punjab",
      "Skill building Punjab",
      "Punjab CM youth initiative",
      "Honhaar Jawan certificate program",
      "Punjab government free learning",
      "Digital Punjab youth training",
      "Skill development Punjab",
      "Honhaar Jawan job opportunities",
      "Honhaar Jawan technical training",
      "Honhaar Jawan IT courses",
      "Punjab education initiative",
      "Youth success Punjab",
      "Punjab youth employment program",
      "Government funded training Punjab",
      "Career skills Punjab",
      "Future ready youth Punjab",
      "Empowering Punjab youth",
      "Professional training Punjab",
      "Online learning Punjab",
      "Free education Punjab",
      "Career growth Punjab",
      "Punjab innovation program",
      "Technology courses Punjab",
      "Freelancing skills Punjab",
      "Web development training Punjab",
      "Digital marketing Punjab",
      "Creative skills Punjab",
      "Honhaar Jawan success stories",
      "Honhaar Jawan free admissions",
      "Honhaar Jawan official site",
      "Honhaar Jawan online apply",
      "Punjab technical education board",
      "Punjab youth excellence program",
      "Honhaar Jawan talent empowerment",
      "Government of Punjab youth initiative",
      "Honhaar Jawan skill development program",
      "Honhaar Jawan learning management system",
      "Punjab youth digital future",
      "Honhaar Jawan professional certifications",
      "CM Punjab youth program",
      "Honhaar Jawan IT courses online",
      "Honhaar Jawan training center",
      "Honhaar Jawan youth platform",
      "Honhaar Jawan skills empowerment",
      "Honhaar Jawan vocational certifications",
      "Punjab youth empowerment scheme",
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

const LaptopScheme = () => {
  return (
    <>
      <Navbar />

      <Client />

      <Copyright />
    </>
  );
};

export default LaptopScheme;
