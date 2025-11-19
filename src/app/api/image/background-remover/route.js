import { NextResponse } from "next/server";
import sharp from "sharp";

// Increase the maximum duration for the serverless function (300 seconds for large batches)
export const maxDuration = 300;

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
    let image = sharp(Buffer.from(arrayBuffer));

    // Get original dimensions and metadata
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Advanced background removal algorithm
    // 1. Convert to LAB color space for better color detection
    const labImage = await image.clone().toColorspace('lab').raw().toBuffer();
    const labSharp = sharp(labImage, { raw: { width: originalWidth, height: originalHeight, channels: 3 } });

    // 2. Analyze the image to find background color
    const { data } = await labSharp.raw().toBuffer({ resolveWithObject: true });
    
    // Find the most common background color (usually corners and edges)
    const backgroundColors = [];
    const sampleSize = 5;
    
    // Sample corners
    for (let x = 0; x < sampleSize; x++) {
      for (let y = 0; y < sampleSize; y++) {
        const cornerIndex = (y * originalWidth + x) * 3;
        const l = data[cornerIndex];
        const a = data[cornerIndex + 1];
        const b = data[cornerIndex + 2];
        
        // Sample more from edges
        if (x === 0 || x === sampleSize - 1) {
          for (let edgeY = sampleSize; edgeY < originalHeight - sampleSize; edgeY += sampleSize * 2) {
            const edgeIndex = (edgeY * originalWidth + x) * 3;
            const edgeL = data[edgeIndex];
            const edgeA = data[edgeIndex + 1];
            const edgeB = data[edgeIndex + 2];
            backgroundColors.push([l, a, b]);
          }
        }
        
        if (y === 0 || y === sampleSize - 1) {
          for (let edgeX = sampleSize; edgeX < originalWidth - sampleSize; edgeX += sampleSize * 2) {
            const edgeIndex = (y * originalWidth + edgeX) * 3;
            const edgeL = data[edgeIndex];
            const edgeA = data[edgeIndex + 1];
            const edgeB = data[edgeIndex + 2];
            backgroundColors.push([l, a, b]);
          }
        }
      }
    }

    // Find the most common background color
    const colorCounts = new Map();
    backgroundColors.forEach(color => {
      const key = color.join(',');
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    });

    let mostCommonColor = [128, 128, 128]; // Default to gray
    let maxCount = 0;
    
    colorCounts.forEach((count, color) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonColor = color.split(',').map(Number);
      }
    });

    // Convert LAB back to RGB for processing
    const [bgL, bgA, bgB] = mostCommonColor;
    
    // 3. Create a mask for the background color with tolerance
    const tolerance = 30; // Adjust tolerance for better results
    const mask = await image
      .clone()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const maskData = mask.data;
    const maskBuffer = Buffer.alloc(maskData.length);
    
    for (let i = 0; i < maskData.length; i += 3) {
      const l = maskData[i];
      const a = maskData[i + 1];
      const b = maskData[i + 2];
      
      const lDiff = Math.abs(l - bgL);
      const aDiff = Math.abs(a - bgA);
      const bDiff = Math.abs(b - bgB);
      
      // If pixel is within tolerance of background color, mark as background (0)
      if (lDiff < tolerance && aDiff < tolerance && bDiff < tolerance) {
        maskBuffer[i] = 0;
        maskBuffer[i + 1] = 0;
        maskBuffer[i + 2] = 0;
      } else {
        maskBuffer[i] = 255;
        maskBuffer[i + 1] = 255;
        maskBuffer[i + 2] = 255;
      }
    }

    // 4. Apply morphological operations to clean up the mask
    const maskSharp = sharp(maskBuffer, { 
      raw: { width: originalWidth, height: originalHeight, channels: 1 } 
    });
    
    // Remove small noise and fill holes
    const cleanedMask = await maskSharp
      .median(3)
      .blur(1)
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 5. Apply the mask to make background transparent
    const processedImage = await image
      .composite([{
        input: await image.clone().raw().toBuffer({ resolveWithObject: true }),
        mask: {
          raw: cleanedMask,
          width: originalWidth,
          height: originalHeight,
          channels: 1
        },
        blend: 'dest-in'
      }])
      .ensureAlpha()
      .png({ 
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true // Use palette for smaller file size
      })
      .toBuffer();

    // Get content type
    const contentType = "image/png";

    // Return processed image
    return new NextResponse(processedImage, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": processedImage.length.toString(),
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Original-Width": originalWidth.toString(),
        "X-Original-Height": originalHeight.toString(),
        "X-Background-Color": JSON.stringify(mostCommonColor),
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

// Handle OPTIONS request for CORS
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
    responseLimit: "50mb",
  },
};