// src/app/api/tiktok/status/route.js
import { NextResponse } from "next/server";
import { getTokens } from "@/lib/tiktok/client";

export async function GET() {
  try {
    const tokens = await getTokens();
    return NextResponse.json({ connected: !!tokens });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
