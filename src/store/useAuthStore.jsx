import { create } from "zustand";
import Cookies from "js-cookie";

const COOKIE_NAME = "userlogged";
const COOKIE_EXPIRATION_DAYS = 7;

export const useAuthStore = create((set) => ({
  user: null, // Set user initially to null, load user data from cookies in a separate effect

  // Set the user and save to cookies
  setUser: (userData) => {
    if (typeof userData !== "object" || userData === null) {
      console.error("Invalid user data");
      return;
    }
    Cookies.set(COOKIE_NAME, JSON.stringify(userData), {
      expires: COOKIE_EXPIRATION_DAYS,
      path: "/", // Ensure the cookie is valid for all paths
    });
    set(() => ({ user: userData }));
  },

  // Update user data and store in cookies
  updateUser: (updatedFields) =>
    set((state) => {
      const updatedUser = { ...state.user, ...updatedFields };
      Cookies.set(COOKIE_NAME, JSON.stringify(updatedUser), {
        expires: COOKIE_EXPIRATION_DAYS,
        path: "/",
      });
      return { user: updatedUser };
    }),

  // Reset user data and remove from cookies
  resetUser: () => {
    Cookies.remove(COOKIE_NAME, { path: "/" }); // Ensure the path is specified when removing the cookie
    set(() => ({ user: null }));
  },

  // Load user from cookies (to be triggered only once when store is initialized)
  loadUserFromCookie: () => {
    const cookieData = Cookies.get(COOKIE_NAME);
    if (cookieData) {
      try {
        const parsedData = JSON.parse(cookieData);
        set(() => ({ user: parsedData }));
      } catch (error) {
        console.error("Error parsing user data from cookie:", error);
        Cookies.remove(COOKIE_NAME, { path: "/" });
      }
    }
  },
}));

// Initialize the store once when the app starts
useAuthStore.getState().loadUserFromCookie();

export default useAuthStore;
