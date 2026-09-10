// src/app/api/tiktok/callback/route.js
import { NextResponse } from "next/server";
import { getTokensFromCode, saveTokens } from "@/lib/tiktok/client";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?tiktok_error=${error}`, request.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    saveTokens(tokens);
    return NextResponse.redirect(new URL("/dashboard?connected=tiktok", request.url));
  } catch (err) {
    return NextResponse.redirect(new URL(`/dashboard?tiktok_error=${err.message}`, request.url));
  }
}
