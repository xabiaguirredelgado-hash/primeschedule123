const fs = require('fs');

const archivos = [
  "src/app/api/youtube/upload/route.js",
  "src/app/page.js",
  "src/lib/config.js"
  // agrega aquí los 2 archivos que falten cuando me confirmes cuáles son
];

archivos.forEach((archivo) => {
  const buffer = fs.readFileSync(archivo);
  let texto;
  try {
    // Intenta decodificar como UTF-8 estricto
    texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch (e) {
    // Si falla, el archivo probablemente está en Windows-1252 (típico de copiar/pegar desde Word)
    texto = new TextDecoder('windows-1252').decode(buffer);
    console.log(`${archivo}: tenía bytes inválidos, decodificado como Windows-1252`);
  }
  fs.writeFileSync(archivo, texto, { encoding: 'utf8' });
  console.log(`Corregido: ${archivo}`);
});