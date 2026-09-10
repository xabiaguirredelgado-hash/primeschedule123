// src/app/api/tiktok/auth/route.js
import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/tiktok/client";

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
