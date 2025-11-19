"use client";
import React, { useState } from "react";
import Header from "@/components/primary/Header";
import Navbar from "@/components/primary/Navbar";
import Footer from "@/components/primary/Footer";

import HomeHeader from "./compo/HomeHeader";
import About from "./compo/About";
import Courses from "./compo/courses";
import Reviews from "./compo/Reviews";
import StepsGuide from "./compo/Test";
import Scholar from "./compo/scholar";
const Home = () => {
  return (
    <div>
      <Navbar />
      <HomeHeader />
      <About />
      <Scholar />
      <Courses />

      {/* <Reviews /> */}
      <StepsGuide />
      <Footer />
    </div>
  );
};

export default Home;
