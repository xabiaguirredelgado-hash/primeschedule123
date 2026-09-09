const fs = require('fs');

const archivos = [
  "src/app/api/youtube/upload/route.js",
  "src/app/page.js",
  "src/lib/config.js",
  "src/app/api/upload/route.js",
  "src/app/api/youtube/auth/route.js"
];

archivos.forEach((archivo) => {
  const buffer = fs.readFileSync(archivo);
  let texto;
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    console.log(`${archivo}: ya era UTF-8 válido (revisa el contenido a mano)`);
  } catch (e) {
    texto = new TextDecoder('windows-1252').decode(buffer);
    console.log(`${archivo}: tenía bytes inválidos, decodificado como Windows-1252 y corregido`);
  }
  fs.writeFileSync(archivo, texto, { encoding: 'utf8' });
});