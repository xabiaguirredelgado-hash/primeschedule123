// src/app/api/instagram/upload/route.js
import { NextResponse } from "next/server";
import { publishToInstagram, getPublishingLimit, getPageInfo } from "@/lib/meta/client";

export async function POST(request) {
  try {
    const { videoUrl, caption } = await request.json();

    const pageInfo = await getPageInfo();
    if (!pageInfo || !pageInfo.igUserId) {
      return NextResponse.json(
        { error: "No hay una cuenta de Instagram conectada. Conéctala primero." },
        { status: 401 }
      );
    }

    const limit = await getPublishingLimit(pageInfo.igUserId, pageInfo.pageAccessToken);
    if (limit.quota_usage >= limit.config.quota_total) {
      return NextResponse.json(
        { error: "Se alcanzó el límite diario de publicación de Instagram para esta cuenta." },
        { status: 429 }
      );
    }

    const mediaId = await publishToInstagram({
      igUserId: pageInfo.igUserId,
      pageAccessToken: pageInfo.pageAccessToken,
      videoUrl,
      caption,
    });

    return NextResponse.json({ success: true, mediaId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
