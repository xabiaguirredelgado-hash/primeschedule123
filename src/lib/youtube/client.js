// src/lib/youtube/client.js
import { google } from "googleapis";
import { createReadStream } from "fs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
];

export function getOAuthClient() {
  return oauth2Client;
}

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: randomBytes(16).toString("hex"),
  });
}

export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || refreshToken,
    expiry_date: credentials.expiry_date,
  };
}

export async function saveTokens(tokens) {
  await prisma.platformToken.upsert({
    where: { platform: "youtube" },
    update: { data: tokens },
    create: { platform: "youtube", data: tokens },
  });
}

export async function getTokens() {
  const record = await prisma.platformToken.findUnique({ where: { platform: "youtube" } });
  return record ? record.data : null;
}

export async function getValidAccessToken() {
  const tokens = await getTokens();
  if (!tokens) return null;

  const isExpired = tokens.expiry_date ? tokens.expiry_date < Date.now() : true;
  if (!isExpired) return tokens.access_token;
  if (!tokens.refresh_token) return null;

  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await saveTokens({ ...tokens, ...refreshed });
  return refreshed.access_token;
}

export async function uploadVideoToYouTube({
  accessToken,
  filePath,
  title,
  description,
  privacyStatus = "private",
  publishAt,
}) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const youtube = google.youtube({ version: "v3", auth });

  const status = { privacyStatus: "private" };
  if (publishAt) status.publishAt = publishAt;
  else status.privacyStatus = privacyStatus;

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: { snippet: { title, description }, status },
    media: { body: createReadStream(filePath) },
  });

  return response.data.id;
}
