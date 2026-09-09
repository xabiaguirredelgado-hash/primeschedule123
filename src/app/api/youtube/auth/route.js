import { NextResponse } from "next/server";
import { getAuthUrl } from "../../../../lib/youtube/client";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    const state = new URL(authUrl).searchParams.get("state");

    const cookieStore = await cookies();
    cookieStore.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error en /api/youtube/auth:", error);
    return NextResponse.json({ error: "Error al iniciar la autenticación" }, { status: 500 });
  }
}


