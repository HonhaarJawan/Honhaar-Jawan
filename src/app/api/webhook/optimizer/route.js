import { NextResponse } from "next/server";

// Configuration: List of worker nodes
// To scale horizontally, deploy the optimization service to multiple servers
// and add their URLs here
const WORKER_NODES = [
  "https://honhaarjawan.pk/api/webhook/optimize/1",
  "https://honhaarjawan.pk/api/webhook/optimize/2",
  "https://honhaarjawan.pk/api/webhook/optimize/3",
  "https://honhaarjawan.pk/api/webhook/optimize/4",
  "https://honhaarjawan.pk/api/webhook/optimize/5",
  "https://honhaarjawan.pk/api/webhook/optimize/6",
  "https://honhaarjawan.pk/api/webhook/optimize/7",
  "https://honhaarjawan.pk/api/webhook/optimize/8",
  "https://honhaarjawan.pk/api/webhook/optimize/9",
  "https://honhaarjawan.pk/api/webhook/optimize/10",
];

let currentWorkerIndex = 0;

// Round-robin worker selection
function selectWorker() {
  const worker = WORKER_NODES[currentWorkerIndex];
  currentWorkerIndex = (currentWorkerIndex + 1) % WORKER_NODES.length;
  return worker;
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  try {
    // Select a worker node
    const workerUrl = selectWorker();

    console.log(`[Load Balancer] Routing request to: ${workerUrl}`);

    // Get the raw request body as a stream
    const body = await req.arrayBuffer();
    const contentType = req.headers.get("content-type");

    // Forward the request to the selected worker
    const workerResponse = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: body,
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker returned ${workerResponse.status}`);
    }

    // Get response data and headers from worker
    const responseData = await workerResponse.arrayBuffer();

    // Copy relevant headers from worker response
    const headers = new Headers();
    headers.set(
      "Content-Type",
      workerResponse.headers.get("content-type") || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      workerResponse.headers.get("content-disposition") || "attachment"
    );

    // Copy stats headers
    const statsHeaders = [
      "x-original-size",
      "x-optimized-size",
      "x-saved-bytes",
      "x-compression-ratio",
    ];

    statsHeaders.forEach((header) => {
      const value = workerResponse.headers.get(header);
      if (value) headers.set(header, value);
    });

    // CORS headers
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set(
      "Access-Control-Expose-Headers",
      "X-Original-Size, X-Optimized-Size, X-Saved-Bytes, X-Compression-Ratio, Content-Disposition"
    );

    return new NextResponse(responseData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Load Balancer] Error:", error);
    return NextResponse.json(
      {
        error: "Load balancer failed to process request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
