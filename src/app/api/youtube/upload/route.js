import { NextResponse } from "next/server";
import { getValidAccessToken, uploadVideoToYouTube } from "../../../../lib/youtube/client";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "YouTube no está conectado. Conéctate primero." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title") || "Video subido desde PrimeScheduler";
    const description = formData.get("description") || "";
    const privacyStatus = formData.get("privacyStatus") || "private";
    const publishAt = formData.get("publishAt") || undefined;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo de video" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFileName = `${uuidv4()}-${file.name}`;
    const tempFilePath = join(os.tmpdir(), tempFileName);
    await writeFile(tempFilePath, buffer);

    const videoId = await uploadVideoToYouTube({
      accessToken,
      filePath: tempFilePath,
      title,
      description,
      privacyStatus,
      publishAt,
    });

    await unlink(tempFilePath).catch(() => {});

    return NextResponse.json({
      success: true,
      videoId,
      message: "Video subido exitosamente a YouTube",
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (error) {
    console.error("Error al subir video:", error);
    return NextResponse.json({ error: error.message || "Error interno al subir el video" }, { status: 500 });
  }
}


