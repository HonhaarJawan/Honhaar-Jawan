  // app/api/image/optimize/[id]/route.js
  import { NextResponse } from "next/server";
  import { processImageBuffer } from "@/lib/imageProcessor";

  export async function POST(req) {
    try {
      const form = await req.formData();
      const file = form.get("image");
      const settingsJson = form.get("settings") || "{}";
      const settings = JSON.parse(settingsJson);

      if (!file || !file.arrayBuffer) {
        return NextResponse.json({ error: "Missing image" }, { status: 400 });
      }

      // IMPORTANT: small buffers are fast, large still ok (no lossless).
      const buf = Buffer.from(await file.arrayBuffer());
      const { buffer, headers } = await processImageBuffer(buf, settings);

      const res = new NextResponse(buffer);
      Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (err) {
      console.error("optimize error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }
