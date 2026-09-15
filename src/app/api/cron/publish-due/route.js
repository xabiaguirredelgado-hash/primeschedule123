// src/app/api/cron/publish-due/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveVideoTemporarily } from "@/lib/storage/local";
import { getValidAccessToken as getTiktokToken, uploadVideoToTikTok } from "@/lib/tiktok/client";
import { getPageInfo, publishToInstagram, publishToFacebookPage } from "@/lib/meta/client";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

// Procesa solo 1 post por invocación, para no exceder el tiempo límite de una request
// (publicar en Instagram puede tardar hasta ~60s por la espera del procesamiento del video)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const due = await prisma.scheduledPost.findFirst({
    where: { status: "pending", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
  });

  if (!due) {
    return NextResponse.json({ message: "Nada pendiente por publicar todavía." });
  }

  // Marca como "publishing" de inmediato para evitar que otra invocación lo tome también
  await prisma.scheduledPost.update({
    where: { id: due.id },
    data: { status: "publishing" },
  });

  const results = {};
  let videoUrl;

  try {
    videoUrl = saveVideoTemporarily(Buffer.from(due.videoData), due.fileName, BASE_URL);
  } catch (err) {
    await prisma.scheduledPost.update({
      where: { id: due.id },
      data: { status: "failed", results: { error: `No se pudo preparar el video: ${err.message}` } },
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (due.platforms.includes("tiktok")) {
    try {
      const accessToken = await getTiktokToken();
      if (!accessToken) throw new Error("TikTok no está conectado.");
      const publishId = await uploadVideoToTikTok({
        accessToken,
        videoUrl,
        title: due.title,
        privacyLevel: "SELF_ONLY",
      });
      results.tiktok = { success: true, publishId };
    } catch (err) {
      results.tiktok = { success: false, error: err.message };
    }
  }

  if (due.platforms.includes("instagram")) {
    try {
      const pageInfo = await getPageInfo();
      if (!pageInfo?.igUserId) throw new Error("Instagram no está conectado.");
      const mediaId = await publishToInstagram({
        igUserId: pageInfo.igUserId,
        pageAccessToken: pageInfo.pageAccessToken,
        videoUrl,
        caption: due.caption,
      });
      results.instagram = { success: true, mediaId };
    } catch (err) {
      results.instagram = { success: false, error: err.message };
    }
  }

  if (due.platforms.includes("facebook")) {
    try {
      const pageInfo = await getPageInfo();
      if (!pageInfo?.pageId) throw new Error("Facebook no está conectado.");
      const videoId = await publishToFacebookPage({
        pageId: pageInfo.pageId,
        pageAccessToken: pageInfo.pageAccessToken,
        videoUrl,
        description: due.caption,
      });
      results.facebook = { success: true, videoId };
    } catch (err) {
      results.facebook = { success: false, error: err.message };
    }
  }

  const anySuccess = Object.values(results).some((r) => r.success);
  const finalStatus = anySuccess ? "published" : "failed";

  await prisma.scheduledPost.update({
    where: { id: due.id },
    data: { status: finalStatus, results },
  });

  return NextResponse.json({ processed: due.id, results });
}
