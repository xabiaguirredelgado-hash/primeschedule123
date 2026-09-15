// src/app/api/meta/callback/route.js
import { NextResponse } from "next/server";
import {
  getTokensFromCode,
  saveTokens,
  getManagedPages,
  getInstagramAccountId,
  savePageInfo,
} from "@/lib/meta/client";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?meta_error=${error}`, BASE_URL));
  }

  try {
    const tokens = await getTokensFromCode(code);
    await saveTokens(tokens);

    const pages = await getManagedPages(tokens.access_token);
    if (pages.length === 0) {
      return NextResponse.redirect(new URL("/?meta_error=no_pages_found", BASE_URL));
    }

    const page = pages[0];
    const igUserId = await getInstagramAccountId(page.id, page.access_token);

    await savePageInfo({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      igUserId,
    });

    return NextResponse.redirect(new URL("/?meta_connected=true", BASE_URL));
  } catch (err) {
    return NextResponse.redirect(new URL(`/?meta_error=${err.message}`, BASE_URL));
  }
}
