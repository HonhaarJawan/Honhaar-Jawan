// src/Backend/FirebaseAdminSDK.js
import admin from "firebase-admin";

// Parse the service account from environment variable
const getServiceAccount = () => {
  // Check if we have the JSON string in environment variable
  const envVar = process.env.FIREBASE_ADMIN_SDK; // Fixed typo - removed NEXT_PUBLIC
  
  if (envVar) {
    try {
      // Clean up the string - remove extra quotes and whitespace
      let jsonString = envVar.trim();
      
      // Remove surrounding single quotes if present
      if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
        jsonString = jsonString.slice(1, -1);
      }
      
      // Parse the JSON
      const serviceAccount = JSON.parse(jsonString);
      
      // Handle escaped newlines in private key
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      return serviceAccount;
    } catch (error) {
      console.error('Error parsing Firebase service account JSON:', error);
      throw new Error('Invalid Firebase service account JSON');
    }
  }
  
  // Fallback to individual environment variables
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };
};

const serviceAccount = getServiceAccount();

if (!serviceAccount.project_id && !serviceAccount.projectId) {
  console.error('Missing Firebase project_id in service account');
  throw new Error('Missing Firebase credentials');
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id || serviceAccount.projectId,
        clientEmail: serviceAccount.client_email || serviceAccount.clientEmail,
        privateKey: serviceAccount.private_key || serviceAccount.privateKey,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw error;
  }
} else {
  console.log('Firebase Admin SDK already initialized');
}

// Export the admin instance and services
export default admin;
export const db = admin.firestore();
export const auth = admin.auth();