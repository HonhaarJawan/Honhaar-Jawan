"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { firestore } from "@/Backend/Firebase";
import { doc, getDoc } from "firebase/firestore";

const useAdmin = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      const sessionData = Cookies.get("admin_data");

      if (sessionData) {
        try {
          console.log("Session data found:", sessionData);
          // Parse plain JSON data directly
          const data = JSON.parse(sessionData);
          console.log("Parsed admin data:", data);

          if (data && data.admin_email) {
            setAdminData(data);
          } else {
            console.error("Session data missing required fields");
          }
        } catch (error) {
          console.error("Parsing error:", error);
          Cookies.remove("admin_data");
        }
      } else {
        console.log("No admin_data cookie found");
      }
      setLoading(false);
    };

    fetchAdmin();
  }, []);

  return { adminData, loading };
};

export default useAdmin;

export const verifyAdmin = async () => {
  const sessionData = Cookies.get("admin_data");
  console.log("Cookie content:", sessionData);

  if (!sessionData) {
    console.log("No admin_data cookie found");
    return { isValid: false };
  }

  let data;
  try {
    // Parse plain JSON data directly
    data = JSON.parse(sessionData);
    console.log("Parsed admin data:", data);
  } catch (error) {
    console.error("Parsing error:", error);
    return { isValid: false };
  }

  if (!data || !data.admin_email) {
    console.log("Invalid session data structure");
    return { isValid: false };
  }

  try {
    const adminDoc = await getDoc(
      doc(firestore, "site_admins_details", data.id)
    );
    if (!adminDoc.exists()) {
      console.log("Admin not found in Firestore");
      return { isValid: false };
    }

    const firestoreData = adminDoc.data();
    if (firestoreData.admin_email !== data.admin_email) {
      console.log("Email mismatch between cookie and Firestore");
      return { isValid: false };
    }

    return {
      isValid: true,
      role: firestoreData.role || "support",
      data: firestoreData,
    };
  } catch (error) {
    console.error("Firestore verification error:", error);
    return { isValid: false };
  }
};
