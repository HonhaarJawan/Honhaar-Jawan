
import nodemailer from "nodemailer";
 
// Initialize transporter
export const initializeTransporter = async () => {

  console.log("Transport Initialized");
  return nodemailer.createTransport({
    host: 'smtp.mandrillapp.com',
    port: 587,
    secure: false,
    auth: {
      user: 'Digital Program',
      pass: "md-YKOzkbnw5Lz7hCNnhfRzVA"
    },
  });
};
 