// src/lib/storage/local.js
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

const MEDIA_DIR = path.join(os.tmpdir(), "primescheduler-media");

// Se borra automáticamente después de este tiempo (los platforms ya deberían
// haber descargado el video mucho antes de esto)
const CLEANUP_AFTER_MS = 10 * 60 * 1000; // 10 minutos

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Guarda el video temporalmente y devuelve la URL pública que hay que
// pasarle a TikTok/Instagram/Facebook
export function saveVideoTemporarily(buffer, originalFilename, baseUrl) {
  const extension = originalFilename.split(".").pop() || "mp4";
  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(MEDIA_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  // Programa el borrado automático
  setTimeout(() => {
    fs.unlink(filePath, () => {});
  }, CLEANUP_AFTER_MS);

  return `${baseUrl}/api/media/${filename}`;
}

export function getVideoPath(filename) {
  // Evita path traversal (que alguien pida "../../algo")
  const safeName = path.basename(filename);
  return path.join(MEDIA_DIR, safeName);
}
