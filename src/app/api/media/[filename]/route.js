// src/app/api/media/[filename]/route.js
import fs from "fs";
import { NextResponse } from "next/server";
import { getVideoPath } from "@/lib/storage/local";

export async function GET(request, { params }) {
  const { filename } = await params;
  const filePath = getVideoPath(filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Video no encontrado o ya expiró." }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const contentType = filename.endsWith(".mov") ? "video/quicktime" : "video/mp4";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
    },
  });
}
