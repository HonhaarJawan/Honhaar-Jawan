import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { invoiceNumber } = await req.json();

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    const url = "https://api.eduprogram.pk/api/check-1biller";
    const headers = { "Content-Type": "application/json" };
    const data = {
      customerTransactionId: invoiceNumber,
      requestedAccountId: "283",
    };

    console.log("Sending to external API:", data);

    // Wait for the fetch call to complete using `await`
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    // Parse the response body as JSON
    const responseData = await response.json();

    console.log("Check Status Response:", responseData);

    // Send the data back to the client
    return NextResponse.json(responseData, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
