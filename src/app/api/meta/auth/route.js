// src/app/api/meta/auth/route.js
import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/meta/client";

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
