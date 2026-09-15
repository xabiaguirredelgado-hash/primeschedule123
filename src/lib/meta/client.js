// src/lib/meta/client.js
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI;

const SCOPES = [
  "instagram_basic",
  "instagram_content_publishing",
  "pages_read_engagement",
  "business_management",
  "pages_show_list",
];

export function getAuthUrl() {
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(","),
    state,
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function getTokensFromCode(code) {
  const shortRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: APP_SECRET,
        code,
      })
  );
  const shortData = await shortRes.json();
  if (shortData.error) throw new Error(`Meta token error: ${shortData.error.message}`);

  const longRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortData.access_token,
      })
  );
  const longData = await longRes.json();
  if (longData.error) throw new Error(`Meta long-lived token error: ${longData.error.message}`);

  return longData;
}

export async function saveTokens(tokens) {
  const toSave = { ...tokens, obtained_at: Date.now() };
  await prisma.platformToken.upsert({
    where: { platform: "meta" },
    update: { data: toSave },
    create: { platform: "meta", data: toSave },
  });
}

export async function getTokens() {
  const record = await prisma.platformToken.findUnique({ where: { platform: "meta" } });
  return record ? record.data : null;
}

export async function getValidUserAccessToken() {
  const tokens = await getTokens();
  if (!tokens) return null;
  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  if (ageSeconds > tokens.expires_in - 3600) return null;
  return tokens.access_token;
}

// Guarda el ID de página, su Page Access Token, y el ID de la cuenta de Instagram vinculada
export async function savePageInfo(pageInfo) {
  await prisma.platformToken.upsert({
    where: { platform: "meta_page" },
    update: { data: pageInfo },
    create: { platform: "meta_page", data: pageInfo },
  });
}

export async function getPageInfo() {
  const record = await prisma.platformToken.findUnique({ where: { platform: "meta_page" } });
  return record ? record.data : null;
}

export async function getManagedPages(userAccessToken) {
  const res = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${userAccessToken}`);
  const data = await res.json();
  if (data.error) throw new Error(`Meta pages error: ${data.error.message}`);
  return data.data;
}

export async function getInstagramAccountId(pageId, pageAccessToken) {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(`Meta IG lookup error: ${data.error.message}`);
  return data.instagram_business_account?.id || null;
}

export async function getPublishingLimit(igUserId, pageAccessToken) {
  const res = await fetch(
    `${GRAPH_BASE}/${igUserId}/content_publishing_limit?access_token=${pageAccessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(`Meta limit error: ${data.error.message}`);
  return data.data[0];
}

export async function publishToInstagram({ igUserId, pageAccessToken, videoUrl, caption }) {
  const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption || "",
      access_token: pageAccessToken,
    }),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error(`Instagram container error: ${container.error.message}`);

  let status = "IN_PROGRESS";
  let attempts = 0;
  while (status === "IN_PROGRESS" && attempts < 20) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `${GRAPH_BASE}/${container.id}?fields=status_code&access_token=${pageAccessToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.status_code;
    attempts++;
  }
  if (status !== "FINISHED") throw new Error(`Instagram container no terminó a tiempo: ${status}`);

  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({
      creation_id: container.id,
      access_token: pageAccessToken,
    }),
  });
  const publish = await publishRes.json();
  if (publish.error) throw new Error(`Instagram publish error: ${publish.error.message}`);
  return publish.id;
}

export async function publishToFacebookPage({ pageId, pageAccessToken, videoUrl, description }) {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/videos`, {
    method: "POST",
    body: new URLSearchParams({
      file_url: videoUrl,
      description: description || "",
      access_token: pageAccessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Facebook publish error: ${data.error.message}`);
  return data.id;
}
