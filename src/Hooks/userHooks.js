// hooks/useUser.js
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import useAuthStore from "@/stores/authStore";

const userHooks = () => {
  const [loading, setLoading] = useState(true);
  const setUserData = useAuthStore((state) => state.setUserData); // Get Zustand setter
  const userData = useAuthStore((state) => state.userData); // Get user data from Zustand

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataFromCookie = Cookies.get("user_data");

        if (userDataFromCookie) {
          const decryptedData = userDataFromCookie;
          setUserData(decryptedData); // Set user data in Zustand store
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [setUserData]);

  return { userData, loading };
};

export default userHooks;
