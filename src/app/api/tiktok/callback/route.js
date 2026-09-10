// src/app/api/tiktok/callback/route.js
import { NextResponse } from "next/server";
import { getTokensFromCode, saveTokens } from "@/lib/tiktok/client";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?tiktok_error=${error}`, BASE_URL));
  }

  try {
    const tokens = await getTokensFromCode(code);
    await saveTokens(tokens);
    return NextResponse.redirect(new URL("/dashboard?connected=tiktok", BASE_URL));
  } catch (err) {
    return NextResponse.redirect(new URL(`/dashboard?tiktok_error=${err.message}`, BASE_URL));
  }
}
