// src/backend/Firebase.js (THIS IS THE CORRECT VERSION)
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

// Data Storing
const firestore = getFirestore(app); // Here, you define it as 'firestore'
const auth = getAuth(app);
// REMOVED: import { db } from '../../../../../Backend/firebase'; // This line was problematic and should be gone
const storage = getStorage(app, process.env.NEXT_PUBLIC_STORAGE_BUCKET);

// You are EXPORTING 'firestore' here
export { auth, firestore, onAuthStateChanged, app, storage, Timestamp };
                              