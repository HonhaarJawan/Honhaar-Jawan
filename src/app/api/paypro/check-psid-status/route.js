// app/api/checkInvoice/route.js

export async function POST(req) {
  try {
    const { payproId, requestedAccountId } = await req.json();

    const url = "https://api.eduprogram.pk/api/check-invoice";
    const headers = { "Content-Type": "application/json" };
    const data = {
      payproId: payproId,
      requestedAccountId: "44",
    };
console.log(data)
    // Wait for the fetch call to complete using `await`
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    }); 
    
    // Check if the response was successful
    // if (!response.ok) {
      //   throw new Error("Failed to fetch invoice status");
      // }
      
      // Parse the response body as JSON
      const ResponseData = await response.json();
      console.log(ResponseData)

    // Send the data back to the client
    return new Response(JSON.stringify(ResponseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}