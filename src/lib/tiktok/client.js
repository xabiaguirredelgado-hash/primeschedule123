// src/lib/tiktok/client.js
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

const SCOPES = ["video.publish", "user.info.basic"];

export function getAuthUrl() {
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    scope: SCOPES.join(","),
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function getTokensFromCode(code) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`TikTok token error: ${data.error_description || data.error}`);
  return data;
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`TikTok refresh error: ${data.error_description || data.error}`);
  return data;
}

export async function saveTokens(tokens) {
  const toSave = { ...tokens, obtained_at: Date.now() };
  await prisma.platformToken.upsert({
    where: { platform: "tiktok" },
    update: { data: toSave },
    create: { platform: "tiktok", data: toSave },
  });
}

export async function getTokens() {
  const record = await prisma.platformToken.findUnique({ where: { platform: "tiktok" } });
  return record ? record.data : null;
}

export async function getValidAccessToken() {
  const tokens = await getTokens();
  if (!tokens) return null;

  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  const isExpired = ageSeconds > tokens.expires_in - 60;
  if (!isExpired) return tokens.access_token;
  if (!tokens.refresh_token) return null;

  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await saveTokens(refreshed);
  return refreshed.access_token;
}

export async function uploadVideoToTikTok({
  accessToken,
  videoUrl,
  title,
  privacyLevel = "SELF_ONLY",
  disableComment = false,
  disableDuet = false,
  disableStitch = false,
}) {
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: privacyLevel,
        disable_comment: disableComment,
        disable_duet: disableDuet,
        disable_stitch: disableStitch,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const initData = await initRes.json();
  if (initData.error && initData.error.code !== "ok") {
    throw new Error(`TikTok init error: ${initData.error.message}`);
  }

  return initData.data.publish_id;
}

export async function getPublishStatus({ accessToken, publishId }) {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await res.json();
  return data.data;
}
