// paymentService.js
import axios from "axios";

/**
 * Initiates a payment intent based on the generation type.
 *
 * @param {("challan"|"online")} generationType - The type of payment generation.
 * @param {Object} payload - The payload to send to the API.
 * @returns {Promise<Object>} - The response data from the API.
 * @throws Will throw an error if the generation type is not valid or the API call fails.
 */
export async function initiatePayment(generationType, payload) {
  // Define mapping for generation type to endpoint URLs.
  const endpoints = {
    challan: "/api/generate-psid",
    bundle: "/api/generate-online", 
  };
// find the generation type in the endpoints object
  const endpoint = endpoints[generationType];

  if (!endpoint) {
    throw new Error(
      "Invalid generation type. Expected 'challan' or 'online'."
    );
  }

  try {
    // sending requests to the asigned api endpoint from the generationtype ^
    const response = await axios.post(endpoint, payload);
    return response.data;
  } catch (error) {
    // Properly handle errors: you may customize error parsing depending on your API.
    let errorMessage = `Error initiating ${generationType} payment: ${error.message}`;
    if (error.response) {
      errorMessage = `Error initiating ${generationType} payment: ${
        error.response.data?.message || `Server responded with status ${error.response.status}`
      }`;
    }
    throw new Error(errorMessage);
  }
}
