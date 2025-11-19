export const verifyAdmin = async () => {
  // Debug cookie
  const encryptedData = Cookies.get("admin_data");
  console.log("Cookie content:", encryptedData);

  if (!encryptedData) {
    console.log("No admin_data cookie found");
    return { isValid: false };
  }

  // Decrypt with try-catch
  let decryptedData;
  try {
    const bytes = CryptoJS.AES.decrypt(
      encryptedData,
      process.env.NEXT_PUBLIC_ADMIN_ENCRYPTION_KEY
    );
    decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log("Decrypted data:", decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    return { isValid: false };
  }

  // Validate session data
  if (!decryptedData || !decryptedData.admin_email) {
    console.log("Invalid decrypted data structure");
    return { isValid: false };
  }

  // Verify against Firestore
  try {
    const adminDoc = await getDoc(
      doc(firestore, "site_admins_details", decryptedData.id)
    );
    if (!adminDoc.exists()) {
      console.log("Admin not found in Firestore");
      return { isValid: false };
    }

    const firestoreData = adminDoc.data();
    if (firestoreData.admin_email !== decryptedData.admin_email) {
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
