// src/app/api/tiktok/upload/route.js
import { NextResponse } from "next/server";
import { getValidAccessToken, uploadVideoToTikTok } from "@/lib/tiktok/client";

export async function POST(request) {
  try {
    const { videoUrl, title, privacyLevel } = await request.json();

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "No hay una cuenta de TikTok conectada. Conéctala primero." },
        { status: 401 }
      );
    }

    const publishId = await uploadVideoToTikTok({
      accessToken,
      videoUrl,
      title,
      privacyLevel,
    });

    return NextResponse.json({ success: true, publishId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
