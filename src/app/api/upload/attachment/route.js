import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const storage = getStorage();
    const fileRef = ref(storage, `attachments/${Date.now()}_${file.name}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await uploadBytes(fileRef, buffer);
    const downloadURL = await getDownloadURL(fileRef);

    return NextResponse.json({
      success: true,
      url: downloadURL,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
