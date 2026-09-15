// src/app/api/schedule/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title") || "";
    const caption = formData.get("caption") || "";
    const scheduledAt = formData.get("scheduledAt");
    const platforms = JSON.parse(formData.get("platforms") || "[]");

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo." }, { status: 400 });
    }
    if (platforms.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos una plataforma." }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: "Falta la fecha/hora de publicación." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const post = await prisma.scheduledPost.create({
      data: {
        fileName: file.name,
        videoData: buffer,
        title,
        caption,
        platforms,
        scheduledAt: new Date(scheduledAt),
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, id: post.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Devuelve la lista de programados, para mostrar estado en la interfaz
export async function GET() {
  try {
    const posts = await prisma.scheduledPost.findMany({
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        fileName: true,
        platforms: true,
        scheduledAt: true,
        status: true,
        results: true,
      },
    });
    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
