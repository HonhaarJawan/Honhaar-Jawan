"use client";
import useAuthStore from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, keyframes } from "framer-motion";

const AuthWrapper = ({ children }) => {
  const { loadUserFromCookie, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isValidated, setIsValidated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Define keyframes
  const animateC = {
    rotate: [0, 360],
  };

  const animate = {
    rotate: [45, 405],
  };

  const LoadingComponent = () => {
    return <div></div>;
  };

  useEffect(() => {
    const initializeUser = async () => {
      await loadUserFromCookie();
      setLoading(false);
    };
    initializeUser();
  }, [loadUserFromCookie]);

  useEffect(() => {
    if (!loading) {
      const publicPaths = [
        "/",
        "/login",
        "/enrollment-process",
        "/about",
        "/certificate",
        "/contact",
        "/forgot-password",
        "/mailactions",
        "/faq",
        "/terms-conditions",
        "/privacy-policy",
        "/get-certificate",
        "/courses",
        "/admin/dashboard/chc-requests",
        "/blogs",
        "/blogs/details",
        "/new-registration",
        "/application-submitted",
        "/change-password",
        "/apply-now",
        "/internships",
        "/honhaar-student-card",
        "/education-finance",
        "/solar-laptop-scheme",
        "/apply-honhaar-student-card",
        "/honhaar-card",
        "/refund-policy",
        "/admin/dashboard",
        "/admin/login",
        "/admin/dashboard/blogs-editor",
        "/admin/dashboard/issues",
        "/admin/dashboard/test",
        "/admin/dashboard/manage-admins",
        "/admin/dashboard/emails-management",
      ];

      const publicPatterns = [
        /^\/details\/.*$/,
        /^\/get-certificate\/.*$/,
        /^\/blogs\/details\/.*$/,

        /^\/courses\/.*$/,
        /^\/admin\/dashboard\/issues\/.*$/, // ✅ allow issues/[email]
      ];

      const validateAccess = () => {
        const isExactPublicPath = publicPaths.includes(pathname);
        const isPatternPublicPath = publicPatterns.some((pattern) =>
          pattern.test(pathname)
        );

        // If user is not logged in and trying to access a protected route
        if (!user && !isExactPublicPath && !isPatternPublicPath) {
          router.push("/");
          console.log("Unauthorized access attempt - redirecting to home");
          return false;
        }

        // If user is logged in and trying to access apply-now, redirect to dashboard
        if (user && pathname === "/apply-now") {
          router.push("/dashboard");
          console.log(
            "User already logged in, redirecting from apply-now to dashboard"
          );
          return false;
        }

        // If user is not logged in and trying to access dashboard, redirect to home
        if (!user && pathname === "/dashboard") {
          router.push("/");
          console.log("No user logged in, redirecting from dashboard to home");
          return false;
        }

        return true;
      };

      const isValid = validateAccess();
      setIsValidated(isValid);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <LoadingComponent />;
  }

  if (!isValidated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
