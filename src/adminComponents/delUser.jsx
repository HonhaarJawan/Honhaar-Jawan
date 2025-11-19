// src/adminComponents/delUser.js
import { doc, deleteDoc } from "firebase/firestore";
import { getAuth, deleteUser as deleteAuthUser } from "firebase/auth"; // Still commented out as per original
import { firestore as db } from "@/Backend/Firebase"; // Adjust path as needed

/**
 * Handles the deletion of a user from Firestore and (ideally) Firebase Authentication.
 * @param {object} userToDelete - The user object to be deleted.
 * @param {function} setUsers - Function to update the users state in the parent component.
 * @param {function} showToast - Toast notification function from useToast hook.
 */
export const handleDeleteUser = async (userToDelete, setUsers, showToast) => {
  if (
    !window.confirm(
      `Are you sure you want to delete user "${
        userToDelete.fullName || userToDelete.email
      }"? This action cannot be undone.`
    )
  ) {
    showToast("User deletion cancelled.", "success", 2000);
    return; // User cancelled the deletion
  }

  try {
    showToast(
      `Deleting user "${userToDelete.fullName || userToDelete.id}"...`,
      "success",
      3000
    );

    // Firebase Authentication user deletion skipped client-side.
    console.warn(
      "Firebase Authentication user deletion skipped client-side. For a complete deletion, implement a Firebase Cloud Function or secure backend for Auth user management."
    );

    // Delete from Firestore
    const userDocRef = doc(db, "users", userToDelete.id);
    await deleteDoc(userDocRef);

    // Update local state to remove the deleted user
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== userToDelete.id)
    );

    // Show success notification
    showToast(
      `User "${
        userToDelete.fullName || userToDelete.id
      }" deleted successfully!`,
      "success",
      3000
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    showToast(
      `Failed to delete user "${userToDelete.fullName || userToDelete.id}": ${
        error.message
      }`,
      "error",
      5000
    );
  }
};
