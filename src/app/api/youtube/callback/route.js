import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokensFromCode, saveTokens } from "../../../../lib/youtube/client";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const errorUrl = new URL("/", request.url);
      errorUrl.searchParams.set("youtube_error", error);
      return NextResponse.redirect(errorUrl);
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get("youtube_oauth_state")?.value;

    if (!code || !state || !savedState || state !== savedState) {
      const errorUrl = new URL("/", request.url);
      errorUrl.searchParams.set("youtube_error", "invalid_state");
      return NextResponse.redirect(errorUrl);
    }

    const tokens = await getTokensFromCode(code);
    saveTokens(tokens);
    cookieStore.delete("youtube_oauth_state");

    const successUrl = new URL("/", request.url);
    successUrl.searchParams.set("youtube_connected", "true");
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Error en callback:", error);
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("youtube_error", "callback_failed");
    return NextResponse.redirect(errorUrl);
  }
}
