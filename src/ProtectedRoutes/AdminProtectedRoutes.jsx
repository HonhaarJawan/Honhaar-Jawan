"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { firestore } from "@/Backend/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/components/primary/Toast";
import { ImSpinner } from "react-icons/im";

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  SUPPORT: "support",
  CHC_MANAGER: "chc-manager",
};

// Define allowed paths for each role
const ROLE_ALLOWED_PATHS = {
  [ROLES.SUPPORT]: ["/admin/dashboard/issues"],
  [ROLES.CHC_MANAGER]: ["/admin/dashboard/chc-requests"],
  [ROLES.ADMIN]: [
    "/admin/dashboard",
    "/admin/dashboard/manage-admins",
    "/admin/dashboard/users",
    "/admin/dashboard/emails-management",
    "/admin/addadmin",
    "/admin/dashboard/test",
    "/admin/dashboard/issues",
    "/admin/dashboard/chc-requests",
    "/admin/dashboard/email-queries",
    "/admin/dashboard/blogs-editor",
    "/admin/dashboard/image-optimizing",
  ],
  [ROLES.OWNER]: [
    "/admin/dashboard",
    "/admin/dashboard/manage-admins",
    "/admin/dashboard/users",
    "/admin/dashboard/emails-management",
    "/admin/addadmin",
    "/admin/dashboard/test",
    "/admin/dashboard/issues",
    "/admin/dashboard/chc-requests",
    "/admin/dashboard/email-queries",
    "/admin/dashboard/blogs-editor",
    "/admin/dashboard/image-optimizing",
    ],
};

// Default redirect paths after login
const ROLE_DEFAULT_REDIRECTS = {
  [ROLES.SUPPORT]: "/admin/dashboard/issues",
  [ROLES.CHC_MANAGER]: "/admin/dashboard/chc-requests",
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.OWNER]: "/admin/dashboard",
};

const AdminProtectedRoutes = ({ children, isLoginPage = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const verifyAdminSession = async () => {
    const sessionData = Cookies.get("admin_data");

    if (!sessionData) {
      showToast("No admin session found", "error");
      return { isValid: false };
    }

    try {
      const data = JSON.parse(sessionData);

      if (!data?.id || !data?.admin_email) {
        showToast("Session data is invalid", "error");
        return { isValid: false };
      }

      const adminDoc = await getDoc(
        doc(firestore, "site_admins_details", data.id)
      );

      if (!adminDoc.exists()) {
        showToast("Admin document not found", "error");
        return { isValid: false };
      }

      const adminData = adminDoc.data();

      return {
        isValid: adminData.admin_email === data.admin_email,
        role: adminData.role || ROLES.SUPPORT,
        data: adminData,
      };
    } catch (error) {
      showToast("Session verification error", "error");
      return { isValid: false };
    }
  };

  const isPathAllowed = (role, path) => {
    // Allow logout path for everyone
    if (path === "/admin/logout") return true;

    // Get allowed paths for role
    const allowed = ROLE_ALLOWED_PATHS[role] || [];

    // Check exact match or starts with (for dynamic paths like /admin/dashboard/issues/[email])
    return allowed.some(
      (allowedPath) =>
        path === allowedPath || path.startsWith(allowedPath + "/")
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoginPage) {
        const { isValid, role } = await verifyAdminSession();
        if (isValid) {
          // Redirect to role-specific default page
          router.push(ROLE_DEFAULT_REDIRECTS[role] || "/admin/dashboard");
        } else {
          setIsAuthorized(true);
          setLoading(false);
        }
        return;
      }

      try {
        const { isValid, role } = await verifyAdminSession();

        if (!isValid) {
          throw new Error("Invalid session");
        }

        // Check if current path is allowed for this role
        if (!isPathAllowed(role, pathname)) {
          // Redirect to role-specific default page
          router.push(ROLE_DEFAULT_REDIRECTS[role] || "/admin/dashboard");
          return;
        }

        setIsAuthorized(true);
        setLoading(false);
      } catch (error) {
        showToast("Authentication error", "error");
        Cookies.remove("admin_data");
        localStorage.removeItem("admin_email");
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  return isAuthorized ? children : null;
};

export default AdminProtectedRoutes;
