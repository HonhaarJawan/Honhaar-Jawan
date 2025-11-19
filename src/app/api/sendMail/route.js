// File: app/api/sendMail/route.js
// A generic API route to send emails using a provided template and data via Elastic Email API.

import { NextResponse } from "next/server";
import axios from "axios";
import SiteDetails from "@/Data/SiteData";
import { initializeTransporter } from "@/lib/TransportNodeMailer";

// Helper function for replacing placeholders (can be imported or defined here)
const replacePlaceholders = (template, placeholders) => {
  if (!template) return "";
  const data =
    typeof placeholders === "object" && placeholders !== null
      ? placeholders
      : {};
  return template.replace(
    /\{([^}]*)\}|\${(.*?)}/g,
    (match, key1, key2) => {
      const key = key1 ? key1.trim() : key2.trim();
      return data[key] || "";
    }
  );
};

// Basic email validation regex (adjust for stricter needs if required)
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export async function POST(req) {
  console.log("Generic email sending API request received...");
  try {
    const requestBody = await req.json();
    const { to, subject, htmlTemplate, placeholders } = requestBody;

    // --- Input Validation ---
    const toEmails = Array.isArray(to) ? to : [to];

    if (
      !toEmails.length ||
      !toEmails.every(
        (email) => typeof email === "string" && validateEmail(email)
      )
    ) {
      return NextResponse.json(
        { message: "Invalid or missing email address(es) provided." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { message: "Invalid or missing 'subject' provided." },
        { status: 400 }
      );
    }
    if (!htmlTemplate || typeof htmlTemplate !== "string") {
      return NextResponse.json(
        { message: "Invalid or missing 'htmlTemplate' provided." },
        { status: 400 }
      );
    }
    if (placeholders && typeof placeholders !== "object") {
      return NextResponse.json(
        { message: "Invalid 'placeholders' format. It must be an object." },
        { status: 400 }
      );
    }

    // --- CONFIGURATION ---
    // SECURITY: Use server-side only environment variables for secrets.
    const CONFIG = {
      fromEmail: SiteDetails.supportEmail,
      fromName: process.env.SUPPORT_NAME, // Use a server-side env var
      apiKey: process.env.ELASTIC_EMAIL_API_KEY, // <-- FIX: Use non-public variable
    };

    if (!CONFIG.apiKey) {
        console.error("FATAL: Elastic Email API key is not configured in environment variables.");
        return NextResponse.json(
            { message: "Email service is not configured correctly." },
            { status: 500 }
        );
    }

    // Replace placeholders in the HTML template
    const htmlContent = replacePlaceholders(htmlTemplate, placeholders || {});

    const params = new URLSearchParams();
    params.append("apikey", CONFIG.apiKey);
    params.append("subject", subject);
    params.append("from", CONFIG.fromEmail);
    params.append("fromName", CONFIG.fromName);
    params.append("to", toEmails.join(","));
    params.append("bodyHtml", htmlContent);
    params.append("isTransactional", "true");

    // --- SENDING LOGIC ---
    if (SiteDetails.isElasticMail_SMTP === true) {
      console.log("Using Elastic Email API for sending emails.");
      const url = "https://api.elasticemail.com/v2/email/send";

      try {
        const response = await axios.post(url, params);
        console.log("Elastic Email API response:", response.data);

        return NextResponse.json(
          {
            message: `Email successfully sent to ${toEmails.join(", ")}`,
            data: response.data,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error(
          "Elastic Email API error:",
          error.response?.data || error.message
        );
        return NextResponse.json(
          {
            message: "Failed to send email via Elastic Email API.",
            error: error.response?.data || error.message,
          },
          { status: 500 }
        );
      }
    } else {
      console.log("Using SMTP transport for sending emails.");
      try {
        const transporter = await initializeTransporter();
        const mailOptions = {
          from: process.env.SUPPORT_EMAIL_FROM || CONFIG.fromEmail, // Use a server-side env var
          to: toEmails.join(","), // Nodemailer expects a comma-separated string for multiple recipients
          subject: subject,
          html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("SMTP transport response:", info);

        return NextResponse.json(
          {
            message: `Email successfully sent to ${toEmails.join(", ")}`,
            data: { messageId: info.messageId, status: "success" },
          },
          { status: 200 }
        );
      } catch (error) {
        console.error(`Error sending email via SMTP to ${toEmails}:`, error);
        return NextResponse.json(
          {
            message: "Failed to send email via SMTP.",
            error: error.message,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in generic email sending API:", error);
    return NextResponse.json(
      { message: "Internal Server Error sending email.", error: error.message },
      { status: 500 }
    );
  }
}