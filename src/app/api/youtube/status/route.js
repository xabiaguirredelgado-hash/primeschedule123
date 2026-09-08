import { NextResponse } from "next/server";
import { getTokens } from "../../../../lib/youtube/client";

export async function GET() {
  try {
    const tokens = getTokens();
    if (!tokens || !tokens.access_token) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = tokens.expiry_date ? tokens.expiry_date < Date.now() : true;

    return NextResponse.json({
      connected: true,
      expiresAt: tokens.expiry_date,
      isExpired,
    });
  } catch (error) {
    console.error("Error en /api/youtube/status:", error);
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}
