import { NextResponse } from 'next/server';
import { getOAuthClient, saveOAuthState } from '@/lib/youtube/client';

export async function GET() {
  const oauth2Client = getOAuthClient();
  // Generar un state aleatorio (sin crypto en JS, usamos Math.random)
  const state = saveOAuthState(Math.random().toString(36).substring(2));
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    state: state,
  });
  
  return NextResponse.redirect(url);
}

