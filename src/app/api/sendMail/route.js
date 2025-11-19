// File: apphttps://honhaarjawan.pk/api/sendMail/route.js
// A generic API route to send emails using a provided template and data via Elastic Email API.

import { NextResponse } from "next/server";
import axios from "axios";
import SiteDetails from "@/Data/SiteData";
import { initializeTransporter } from "@/lib/TransportNodeMailer";
import { clear } from "@tsparticles/engine";

// Helper function for replacing placeholders (can be imported or defined here)
const replacePlaceholders = (template, placeholders) => {
  console.log("replacePlaceholders called with:", { template, placeholders });
  if (!template) return "";
  const data =
    typeof placeholders === "object" && placeholders !== null
      ? placeholders
      : {};
  const result = template.replace(
    /\{([^}]*)\}|\${(.*?)}/g,
    (match, key1, key2) => {
      const key = key1 ? key1.trim() : key2.trim();
      console.log("Replacing placeholder:", { match, key, value: data[key] });
      return data[key] || "";
    }
  );
  console.log("replacePlaceholders result:", result);
  return result;
};

// Basic email validation regex (adjust for stricter needs if required)
const validateEmail = (email) => {
  console.log("validateEmail called with:", email);
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = re.test(String(email).toLowerCase());
  console.log("Email validation result:", isValid);
  return isValid;
};

export async function POST(req) {
  console.log("Generic email sending API request received...");
  let requestBody;

  try {
    requestBody = await req.json();
    console.log("Request body:", requestBody);
    const { to, subject, htmlTemplate, placeholders } = requestBody;

    console.log("Received email request:", {
      to: to,
      subject: subject,
      template: htmlTemplate,
      placeholders: placeholders,
    });

    // --- Input Validation ---
    // Convert single email to array for consistent handling
    const toEmails = Array.isArray(to) ? to : [to];
    console.log("Processed toEmails array:", toEmails);

    // Validate each email address
    if (
      !toEmails.length ||
      !toEmails.every(
        (email) => typeof email === "string" && validateEmail(email)
      )
    ) {
      console.error("Invalid 'to' email address(es):", toEmails);
      return NextResponse.json(
        { message: "Invalid or missing email address(es) provided." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      console.error("Invalid or missing 'subject':", subject);
      return NextResponse.json(
        { message: "Invalid or missing 'subject' provided." },
        { status: 400 }
      );
    }
    if (!htmlTemplate || typeof htmlTemplate !== "string") {
      console.error("Invalid or missing 'htmlTemplate':", htmlTemplate);
      return NextResponse.json(
        { message: "Invalid or missing 'htmlTemplate' provided." },
        { status: 400 }
      );
    }
    // Placeholders are optional, but if provided, they should be an object
    if (placeholders && typeof placeholders !== "object") {
      console.error(
        "Invalid 'placeholders' format (must be an object):",
        placeholders
      );
      return NextResponse.json(
        { message: "Invalid 'placeholders' format. It must be an object." },
        { status: 400 }
      );
    }

    const CONFIG = {
      fromEmail: `${SiteDetails.supportEmail}`,
      fromName: `${process.env.NEXT_PUBLIC_SUPPORT_NAME}`,
      apiKey: `${process.env.NEXT_PUBLIC_EMAILING_API_KEY}`,
    };
    console.log("Email configuration:", CONFIG);

    // Replace placeholders in the HTML template
    const htmlContent = replacePlaceholders(htmlTemplate, placeholders || {});
    console.log("Processed HTML content:", htmlContent);

    const params = new URLSearchParams();
    params.append("apikey", CONFIG.apiKey);
    params.append("subject", subject);
    params.append("from", CONFIG.fromEmail);
    params.append("fromName", CONFIG.fromName);
    params.append("to", toEmails.join(",")); // Join multiple emails with commas
    params.append("bodyHtml", htmlContent);
    params.append("isTransactional", "true");
    let response;

    if (SiteDetails.isElasticMail_SMTP === true) {
      console.log("Using Elastic Email API for sending emails.");

      const url = "https://api.elasticemail.com/v2/email/send";
      console.log("Making API request to:", url);

      try {
        const response = await axios.post(url, params);
        console.log("API response:", response.data);

        return NextResponse.json(
          {
            message: `Email successfully sent to ${toEmails.join(", ")}`,
            data: response.data, // ✅ safe for JSON
            statusCode: response.status,
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
      console.log(htmlContent, "waheawkehajkweakjeawkejhakjwehj");
      const transporter = await initializeTransporter();
      const mailOptions = {
        from: process.env.NEXT_PUBLIC_SUPPORT_EMAIL_FROM,
        to: toEmails,
        subject: subject,
        html: htmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        response = { email: toEmails, status: "success" };
        return NextResponse.json(
          {
            message: `Email successfully sent to ${toEmails.join(", ")}`,
            data: response,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error(`Error sending email to ${toEmails}:`, error);
        return { email: toEmails, status: "failed", error: error.message };
      }
    }

    return NextResponse.json(
      {
        message: `Email successfully sent to ${toEmails.join(", ")}`,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in generic email sending API:", error);
    if (error.response) {
      console.error("Elastic Email API error response:", error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }

    // Determine the appropriate status code and message based on the error
    let statusCode = 500;
    let message = "Internal Server Error sending email.";

    if (
      error.message.includes("Invalid login") ||
      error.message.includes("Authentication credentials invalid")
    ) {
      statusCode = 500;
      message = "Internal Server Error: Email server authentication failed.";
      console.error("SMTP Authentication Error Detected.");
    } else if (error.message.includes("configuration is missing")) {
      statusCode = 500;
      message = "Internal Server Error: Email server configuration issue.";
    }
    console.log("Returning error response:", { statusCode, message });

    return NextResponse.json(
      { message: message, error: error.message || "An unknown error occurred" },
      { status: statusCode }
    );
  }
}
