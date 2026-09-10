// src/app/api/meta/status/route.js
import { NextResponse } from "next/server";
import { getPageInfo } from "@/lib/meta/client";

export async function GET() {
  try {
    const pageInfo = await getPageInfo();
    return NextResponse.json({
      connected: !!pageInfo,
      pageName: pageInfo?.pageName || null,
      hasInstagram: !!pageInfo?.igUserId,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
