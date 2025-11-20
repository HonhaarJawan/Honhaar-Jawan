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

    const quality = parseParam(formData.get("quality"), "number", 80);
    const width = parseParam(formData.get("width"), "number", null);
    const height = parseParam(formData.get("height"), "number", null);
    const effort = parseParam(formData.get("effort"), "number", 4);
    const format = formData.get("format") || null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    const optimizedFiles = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      totalOriginalSize += buffer.length;

      let pipeline = sharp(buffer);

      if (width || height) {
        pipeline = pipeline.resize({
          width: width || null,
          height: height || null,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const targetFormat = format || file.type.split("/")[1] || "jpeg";

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
      (total OptimizedSize / totalOriginalSize) *
      100
    ).toFixed(2);

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

    if (optimizedFiles.length === 1) {
      const file = optimizedFiles[0];
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
      const zip = new JSZip();

      optimizedFiles.forEach((file) => {
        const nameParts = file.name.split(".");
        const ext = nameParts.pop();
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
