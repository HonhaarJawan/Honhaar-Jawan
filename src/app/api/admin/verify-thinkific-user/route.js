// src/app/api/admin/verify-thinkific-user/route.js
import axios from "axios";

export async function POST(req) {
  // Validate environment variables first
  if (
    !process.env.NEXT_PUBLIC_THINKIFIC_API_KEY ||
    !process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN
  ) {
    console.error("Missing Thinkific API configuration");
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return Response.json(
        { error: "Either userId or email must be provided" },
        { status: 400 }
      );
    }

    const THINKIFIC_API_BASE_URL = "https://api.thinkific.com/api/public/v1";
    const headers = {
      "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
      "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
      "Content-Type": "application/json",
    };

    // 1. Try by ID if provided
    if (userId) {
      try {
        const response = await axios.get(
          `${THINKIFIC_API_BASE_URL}/users/${userId}`,
          {
            headers,
            validateStatus: (status) => status < 500, // Don't throw for 404
          }
        );

        if (response.status === 200) {
          return Response.json({
            verified: true,
            user: response.data,
            method: "id",
          });
        }
      } catch (error) {
        console.error("ID lookup error:", error.message);
        // Continue to email search
      }
    }

    // 2. Fall back to email search if provided
    if (email) {
      try {
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return Response.json(
            { error: "Invalid email format" },
            { status: 400 }
          );
        }

        // Use the search endpoint with proper query parameter
        const response = await axios.get(
          `${THINKIFIC_API_BASE_URL}/users`,
          {
            headers,
            params: {
              query: email,
              limit: 1 // We only need to check if the user exists
            },
            validateStatus: (status) => status < 500,
          }
        );

        if (response.status === 200) {
          if (response.data.items && response.data.items.length > 0) {
            // Find the exact match by email
            const exactMatch = response.data.items.find(
              user => user.email.toLowerCase() === email.toLowerCase()
            );
            
            if (exactMatch) {
              return Response.json({
                verified: true,
                user: exactMatch,
                method: "email",
              });
            }
          }
          
          return Response.json({
            verified: false,
            message: "User not found by email",
          });
        }

        // Handle Thinkific API errors
        return Response.json(
          {
            error: "Thinkific API error",
            message: response.data?.message || "Email search failed",
          },
          { status: response.status }
        );
      } catch (error) {
        console.error("Email lookup error:", error);
        
        // Log more details about the error
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
        }
        
        return Response.json(
          {
            error: "Email verification failed",
            message: error.response?.data?.message || error.message,
          },
          { status: error.response?.status || 500 }
        );
      }
    }

    // If we get here, both methods failed
    return Response.json(
      {
        verified: false,
        error: "User not found",
        message: "The user was not found in Thinkific by ID or email",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Endpoint error:", error);
    
    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    
    return Response.json(
      {
        error: "Verification failed",
        message: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}