export const fetchSmtpConfig = async () => {
  try {
    const keys = {
      // SMTP_EMAIL_FROM: `"DigiNaujawan Initiative" support@diginaujawan.pk`,
      SMTP_EMAIL_FROM: `"DigiNaujawan Initiative" support@ehunar.org`,
      SMTP_HOST: "smtp.elasticemail.com",
      SMTP_PASS: "9FCEE9B7C686A14296BE2AF5DFF310CE905B0E246E8DA42AA5DB869291BCE18E516F5899F8D41862E7D6D4FDB0A4EA55",
      SMTP_PORT: "2525",
      SMTP_SECURE: "false",
      SMTP_USER: "9FCEE9B7C686A14296BE2AF5DFF310CE905B0E246E8DA42AA5DB869291BCE18E516F5899F8D41862E7D6D4FDB0A4EA55",
      id: "smtpConfig",
    };
    if (keys) {
      return keys;
    } else {
      throw new Error("SMTP configuration not found in Firestore.");
    }
  } catch (error) {
    console.error("Error fetching SMTP configuration:", error);
    throw error;
  }
};
