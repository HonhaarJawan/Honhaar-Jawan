// File: @/stores/authStore.js

import { create } from "zustand";
import Cookies from "js-cookie";

const COOKIE_NAME = "registration";
const COOKIE_EXPIRATION_DAYS = 55;

export const useAuthStore = create((set, get) => ({
  user: null,
  
  // Set user and save to cookies
  setUser: (userData) => {
    if (typeof userData !== "object" || userData === null) {
      console.error("Invalid user data");
      return false;
    }
    
    try {
      const dataString = JSON.stringify(userData);
      console.log("Setting cookie with data:", dataString);
      
      // Set the cookie with explicit options
      const cookieOptions = {
        expires: COOKIE_EXPIRATION_DAYS,
        path: "/", // Ensure cookie is valid for all paths
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production' // Only secure in production
      };
      
      Cookies.set(COOKIE_NAME, dataString, cookieOptions);
      
      // Verify immediately
      const cookieValue = Cookies.get(COOKIE_NAME);
      if (cookieValue) {
        console.log("Cookie set successfully:", JSON.parse(cookieValue));
        set({ user: userData });
        return true;
      } else {
        console.error("Failed to set cookie");
        return false;
      }
    } catch (error) {
      console.error("Error setting cookie:", error);
      return false;
    }
  },

  // Update user data and store in cookies
  updateUser: (updatedFields) => {
    const currentState = get();
    if (!currentState.user) {
      console.error("No user to update");
      return false;
    }
    
    const updatedUser = { ...currentState.user, ...updatedFields };
    
    try {
      const dataString = JSON.stringify(updatedUser);
      console.log("Updating cookie with data:", dataString);
      
      const cookieOptions = {
        expires: COOKIE_EXPIRATION_DAYS,
        path: "/",
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production'
      };
      
      Cookies.set(COOKIE_NAME, dataString, cookieOptions);
      
      // Verify immediately
      const cookieValue = Cookies.get(COOKIE_NAME);
      if (cookieValue) {
        console.log("Cookie updated successfully:", JSON.parse(cookieValue));
        set({ user: updatedUser });
        return true;
      } else {
        console.error("Failed to update cookie");
        return false;
      }
    } catch (error) {
      console.error("Error updating cookie:", error);
      return false;
    }
  },

  // Reset user data and remove from cookies
  resetUser: () => {
    try {
      console.log("Removing cookie");
      Cookies.remove(COOKIE_NAME, { path: "/" }); // Ensure path is specified when removing cookie
      set({ user: null });
      return true;
    } catch (error) {
      console.error("Error removing cookie:", error);
      return false;
    }
  },

  // Load user from cookies
  loadUserFromCookie: () => {
    try {
      const cookieData = Cookies.get(COOKIE_NAME);
      if (cookieData) {
        const parsedData = JSON.parse(cookieData);
        console.log("Loaded user from cookie:", parsedData);
        set({ user: parsedData });
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user data from cookie:", error);
      Cookies.remove(COOKIE_NAME, { path: "/" });
      return null;
    }
  },

  // Fallback methods if cookies fail
  setUserWithFallback: (userData) => {
    console.log("=== Attempting to store user data ===");
    console.log("User data:", userData);
    
    // Try cookie first
    const cookieSuccess = get().setUser(userData);
    
    if (cookieSuccess) {
      console.log("Cookie storage successful");
      return true;
    }
    
    // Fallback to sessionStorage
    try {
      console.log("Cookie failed, trying sessionStorage");
      sessionStorage.setItem(COOKIE_NAME, JSON.stringify(userData));
      set({ user: userData });
      console.log("SessionStorage set successfully");
      return true;
    } catch (error) {
      console.error("SessionStorage failed:", error);
    }
    
    // Fallback to localStorage
    try {
      console.log("SessionStorage failed, trying localStorage");
      localStorage.setItem(COOKIE_NAME, JSON.stringify(userData));
      set({ user: userData });
      console.log("LocalStorage set successfully");
      return true;
    } catch (error) {
      console.error("LocalStorage failed:", error);
      return false;
    }
  },

  // Get user from any storage method
  getUserFromAnySource: () => {
    console.log("=== Attempting to retrieve user data ===");
    
    // Try cookie first
    const cookieData = Cookies.get(COOKIE_NAME);
    if (cookieData) {
      try {
        const parsedData = JSON.parse(cookieData);
        console.log("Found data in cookie:", parsedData);
        set({ user: parsedData });
        return parsedData;
      } catch (error) {
        console.error("Error parsing cookie:", error);
      }
    }

    // Try sessionStorage
    try {
      const sessionData = sessionStorage.getItem(COOKIE_NAME);
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        console.log("Found data in sessionStorage:", parsedData);
        set({ user: parsedData });
        return parsedData;
      }
    } catch (error) {
      console.error("Error parsing sessionStorage:", error);
    }

    // Try localStorage
    try {
      const localData = localStorage.getItem(COOKIE_NAME);
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log("Found data in localStorage:", parsedData);
        set({ user: parsedData });
        return parsedData;
      }
    } catch (error) {
      console.error("Error parsing localStorage:", error);
    }

    console.log("No registration data found anywhere");
    return null;
  },
}));

// Initialize the store when the module is imported
if (typeof window !== 'undefined') {
  // Try to initialize with a small delay to ensure DOM is ready
  setTimeout(() => {
    console.log("Initializing auth store...");
    const currentState = useAuthStore.getState();
    if (!currentState.user) {
      console.log("No user in state, attempting to load from storage");
      currentState.getUserFromAnySource();
    } else {
      console.log("User already in state:", currentState.user);
    }
  }, 100);
}