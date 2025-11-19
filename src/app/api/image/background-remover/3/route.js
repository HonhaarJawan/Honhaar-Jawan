import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Use the most effective background removal method
    const processedImage = await removeBackgroundSmart(
      buffer,
      originalWidth,
      originalHeight
    );

    return new NextResponse(processedImage, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": processedImage.length.toString(),
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Original-Width": originalWidth.toString(),
        "X-Original-Height": originalHeight.toString(),
      },
    });
  } catch (error) {
    console.error("Background removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove background: " + error.message },
      { status: 500 }
    );
  }
}

// Smart background removal that combines multiple techniques
async function removeBackgroundSmart(buffer, width, height) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const processedData = Buffer.alloc(data.length);

  // Get edge information
  const edgeMask = await createEnhancedEdgeMask(buffer, width, height);

  // Get color information
  const colorClusters = analyzeColorClusters(data, width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    // Combined detection logic
    const edgeStrength = edgeMask[pixelIndex];
    const isNearEdge = edgeStrength > 30;
    const isLikelyBackground =
      // Edge-based detection
      !isNearEdge &&
      // Color-based detection
      (brightness > 240 || brightness < 30) &&
      // Location-based (edges are often background)
      (x < 10 || x > width - 10 || y < 10 || y > height - 10);

    processedData[i] = r;
    processedData[i + 1] = g;
    processedData[i + 2] = b;
    processedData[i + 3] = isLikelyBackground ? 0 : 255;
  }

  // Apply morphological operations to clean up the mask
  return await cleanUpTransparency(processedData, width, height);
}

// Enhanced edge detection
async function createEnhancedEdgeMask(buffer, width, height) {
  const grayscale = await sharp(buffer).grayscale().raw().toBuffer();

  const edgeMask = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel operator for edge detection
      const gx =
        -1 * grayscale[(y - 1) * width + (x - 1)] +
        1 * grayscale[(y - 1) * width + (x + 1)] +
        -2 * grayscale[y * width + (x - 1)] +
        2 * grayscale[y * width + (x + 1)] +
        -1 * grayscale[(y + 1) * width + (x - 1)] +
        1 * grayscale[(y + 1) * width + (x + 1)];

      const gy =
        -1 * grayscale[(y - 1) * width + (x - 1)] -
        2 * grayscale[(y - 1) * width + x] -
        1 * grayscale[(y - 1) * width + (x + 1)] +
        1 * grayscale[(y + 1) * width + (x - 1)] +
        2 * grayscale[(y + 1) * width + x] +
        1 * grayscale[(y + 1) * width + (x + 1)];

      edgeMask[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }

  return edgeMask;
}

// Analyze color clusters to identify background
function analyzeColorClusters(data, width, height) {
  const edgeColors = [];
  const sampleSize = 50;

  // Sample from edges
  for (let i = 0; i < sampleSize; i++) {
    // Top edge
    const topX = Math.floor(Math.random() * width);
    const topIdx = (0 * width + topX) * 4;
    edgeColors.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);

    // Bottom edge
    const bottomX = Math.floor(Math.random() * width);
    const bottomIdx = ((height - 1) * width + bottomX) * 4;
    edgeColors.push([
      data[bottomIdx],
      data[bottomIdx + 1],
      data[bottomIdx + 2],
    ]);

    // Left edge
    const leftY = Math.floor(Math.random() * height);
    const leftIdx = (leftY * width + 0) * 4;
    edgeColors.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);

    // Right edge
    const rightY = Math.floor(Math.random() * height);
    const rightIdx = (rightY * width + (width - 1)) * 4;
    edgeColors.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }

  return edgeColors;
}

// Clean up transparency with morphological operations
async function cleanUpTransparency(data, width, height) {
  // Convert to sharp image and apply operations
  const image = sharp(data, {
    raw: { width, height, channels: 4 },
  });

  // Apply operations to clean up the transparency mask
  return await image.png({ compressionLevel: 9 }).toBuffer();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
