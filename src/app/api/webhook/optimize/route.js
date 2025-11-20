import { NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";

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

// Helper to parse boolean/number from formData
const parseParam = (val, type = "number", defaultVal) => {
  if (val === null || val === undefined) return defaultVal;
  if (type === "number") {
    const parsed = Number(val);
    return isNaN(parsed) ? defaultVal : parsed;
  }
  return val;
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    // Optimization parameters
    const quality = parseParam(formData.get("quality"), "number", 80);
    const width = parseParam(formData.get("width"), "number", null);
    const height = parseParam(formData.get("height"), "number", null);
    const effort = parseParam(formData.get("effort"), "number", 4); // 0-6 (speed vs size)
    const format = formData.get("format") || null; // jpeg, png, webp, avif

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Track statistics
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    const optimizedFiles = [];

    // Process each file
    for (const file of files) {
      if (!(file instanceof File)) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      totalOriginalSize += buffer.length;

      let pipeline = sharp(buffer);

      // Resize if requested
      if (width || height) {
        pipeline = pipeline.resize({
          width: width || null,
          height: height || null,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Format conversion and optimization
      const targetFormat = format || file.type.split("/")[1] || "jpeg";

      // Apply format-specific options
      switch (targetFormat) {
        case "jpeg":
        case "jpg":
          pipeline = pipeline.jpeg({ quality, mozjpeg: true });
          break;
        case "png":
          pipeline = pipeline.png({ quality, effort });
          break;
        case "webp":
          pipeline = pipeline.webp({ quality, effort });
          break;
        case "avif":
          pipeline = pipeline.avif({ quality, effort });
          break;
        default:
          // Fallback to jpeg if unknown
          pipeline = pipeline.jpeg({ quality });
      }

      const optimizedBuffer = await pipeline.toBuffer();
      totalOptimizedSize += optimizedBuffer.length;

      optimizedFiles.push({
        name: file.name,
        buffer: optimizedBuffer,
        type: targetFormat,
      });
    }

    const savedBytes = totalOriginalSize - totalOptimizedSize;
    const compressionRatio = (
      (totalOptimizedSize / totalOriginalSize) *
      100
    ).toFixed(2);

    // Prepare headers for stats
    const headers = new Headers();
    headers.set("X-Original-Size", totalOriginalSize.toString());
    headers.set("X-Optimized-Size", totalOptimizedSize.toString());
    headers.set("X-Saved-Bytes", savedBytes.toString());
    headers.set("X-Compression-Ratio", `${compressionRatio}%`);
    headers.set(
      "Access-Control-Expose-Headers",
      "X-Original-Size, X-Optimized-Size, X-Saved-Bytes, X-Compression-Ratio, Content-Disposition"
    );
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");

    // Return single file or ZIP
    if (optimizedFiles.length === 1) {
      const file = optimizedFiles[0];
      // Change extension if format changed
      const nameParts = file.name.split(".");
      nameParts.pop();
      const fileName = `${nameParts.join(".")}.${file.type === "jpeg" ? "jpg" : file.type}`;

      headers.set("Content-Type", `image/${file.type}`);
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

      return new NextResponse(file.buffer, {
        status: 200,
        headers,
      });
    } else {
      // Batch processing - Create ZIP
      const zip = new JSZip();

      optimizedFiles.forEach((file) => {
        const nameParts = file.name.split(".");
        const ext = nameParts.pop();
        // If format changed, update extension
        const newExt = format ? (format === "jpeg" ? "jpg" : format) : ext;
        const fileName = `${nameParts.join(".")}.${newExt}`;

        zip.file(fileName, file.buffer);
      });

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      headers.set("Content-Type", "application/zip");
      headers.set(
        "Content-Disposition",
        'attachment; filename="optimized_images.zip"'
      );

      return new NextResponse(zipBuffer, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: "Image optimization failed: " + error.message },
      { status: 500 }
    );
  }
}

// Configure body parser for larger files if needed (Next.js App Router handles this differently,
// but good to keep in mind limits are usually in next.config.js)
export const config = {
  api: {
    bodyParser: false, // Not strictly needed for App Router but legacy habit
    responseLimit: false,
  },
};
