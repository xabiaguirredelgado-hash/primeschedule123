// src/lib/youtube/refresh.js
import { google } from 'googleapis';

export async function refreshAccessToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    access_token: credentials.access_token,
    expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
  };
}

