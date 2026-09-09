// src/app/api/youtube/upload/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadVideoToYouTube } from '@/lib/youtube/client';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // 1. Verificar sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Obtener el token de acceso de YouTube
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'google',
      },
      select: {
        id: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
    });

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: 'Cuenta de YouTube no vinculada. Conéctate primero.' },
        { status: 400 }
      );
    }

    // 3. Verificar si el token ha expirado y refrescarlo
    let accessToken = account.access_token;
    if (account.expires_at && account.expires_at < Math.floor(Date.now() / 1000)) {
      // Token expirado, refrescar
      const { refreshAccessToken } = await import('@/lib/youtube/refresh');
      const newTokens = await refreshAccessToken(account.refresh_token);
      accessToken = newTokens.access_token;

      // Actualizar en la base de datos
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: newTokens.access_token,
          expires_at: newTokens.expires_at,
        },
      });
    }

    // 4. Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || 'Video subido desde PrimeScheduler';
    const description = formData.get('description') || '';
    const privacyStatus = formData.get('privacyStatus') || 'private';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo de video' },
        { status: 400 }
      );
    }

    // 5. Guardar archivo temporalmente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFileName = `${uuidv4()}-${file.name}`;
    const tempFilePath = join('/tmp', tempFileName);
    await writeFile(tempFilePath, buffer);

    // 6. Subir a YouTube
    const videoId = await uploadVideoToYouTube({
      accessToken,
      filePath: tempFilePath,
      title,
      description,
      privacyStatus,
    });

    // 7. Limpiar archivo temporal
    await unlink(tempFilePath).catch(() => {});

    // 8. (Opcional) Guardar en tu base de datos el registro del video
    // await prisma.post.create({ data: { title, videoId, userId, platform: 'youtube' } });

    return NextResponse.json({
      success: true,
      videoId,
      message: 'Video subido exitosamente a YouTube',
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (error) {
    console.error('Error al subir video:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al subir el video' },
      { status: 500 }
    );
  }
}





