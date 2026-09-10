// src/app/api/meta/callback/route.js
import { NextResponse } from "next/server";
import {
  getTokensFromCode,
  saveTokens,
  getManagedPages,
  getInstagramAccountId,
  savePageInfo,
} from "@/lib/meta/client";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?meta_error=${error}`, request.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    await saveTokens(tokens);

    const pages = await getManagedPages(tokens.access_token);
    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL("/dashboard?meta_error=no_pages_found", request.url)
      );
    }

    const page = pages[0];
    const igUserId = await getInstagramAccountId(page.id, page.access_token);

    await savePageInfo({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      igUserId,
    });

    return NextResponse.redirect(new URL("/dashboard?connected=meta", request.url));
  } catch (err) {
    return NextResponse.redirect(new URL(`/dashboard?meta_error=${err.message}`, request.url));
  }
}
