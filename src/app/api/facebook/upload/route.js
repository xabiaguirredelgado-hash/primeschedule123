// src/app/api/facebook/upload/route.js
import { NextResponse } from "next/server";
import { publishToFacebookPage, getPageInfo } from "@/lib/meta/client";

export async function POST(request) {
  try {
    const { videoUrl, description } = await request.json();

    const pageInfo = await getPageInfo();
    if (!pageInfo || !pageInfo.pageId) {
      return NextResponse.json(
        { error: "No hay una Página de Facebook conectada. Conéctala primero." },
        { status: 401 }
      );
    }

    const videoId = await publishToFacebookPage({
      pageId: pageInfo.pageId,
      pageAccessToken: pageInfo.pageAccessToken,
      videoUrl,
      description,
    });

    return NextResponse.json({ success: true, videoId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
