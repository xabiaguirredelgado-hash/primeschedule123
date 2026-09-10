// src/app/api/publish/route.js
import { NextResponse } from "next/server";
import { saveVideoTemporarily } from "@/lib/storage/local";
import { getValidAccessToken as getTiktokToken, uploadVideoToTikTok } from "@/lib/tiktok/client";
import { getPageInfo, publishToInstagram, publishToFacebookPage } from "@/lib/meta/client";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const platforms = JSON.parse(formData.get("platforms") || "[]");

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 });
    }
    if (platforms.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos una plataforma." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const videoUrl = saveVideoTemporarily(buffer, file.name, BASE_URL);

    const results = {};

    if (platforms.includes("tiktok")) {
      try {
        const accessToken = await getTiktokToken();
        if (!accessToken) throw new Error("TikTok no está conectado.");
        const publishId = await uploadVideoToTikTok({
          accessToken,
          videoUrl,
          title,
          privacyLevel: "SELF_ONLY",
        });
        results.tiktok = { success: true, publishId };
      } catch (err) {
        results.tiktok = { success: false, error: err.message };
      }
    }

    if (platforms.includes("instagram")) {
      try {
        const pageInfo = await getPageInfo();
        if (!pageInfo?.igUserId) throw new Error("Instagram no está conectado.");
        const mediaId = await publishToInstagram({
          igUserId: pageInfo.igUserId,
          pageAccessToken: pageInfo.pageAccessToken,
          videoUrl,
          caption: description,
        });
        results.instagram = { success: true, mediaId };
      } catch (err) {
        results.instagram = { success: false, error: err.message };
      }
    }

    if (platforms.includes("facebook")) {
      try {
        const pageInfo = await getPageInfo();
        if (!pageInfo?.pageId) throw new Error("Facebook no está conectado.");
        const videoId = await publishToFacebookPage({
          pageId: pageInfo.pageId,
          pageAccessToken: pageInfo.pageAccessToken,
          videoUrl,
          description,
        });
        results.facebook = { success: true, videoId };
      } catch (err) {
        results.facebook = { success: false, error: err.message };
      }
    }

    return NextResponse.json({ success: true, videoUrl, results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
