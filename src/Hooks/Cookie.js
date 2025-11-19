import CryptoJS from "crypto-js";

// Function to encrypt data
export const encryptData = (data) => {
  const ciphertext = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    import.meta.env.VITE_ENCRYPTION_KEY
  ).toString();
  return ciphertext;
};

// Function to decrypt data
export const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(
    ciphertext,
    import.meta.env.VITE_ENCRYPTION_KEY
  );
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return decryptedData;
};
