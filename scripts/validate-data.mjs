import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateGame } from "./discovery/catalog.mjs";

globalThis.window = {};
await import("../games-reviewed.js");
await import("../games-data.js");
await import("../media-data.js");

const games = window.PATCHDEX_GAMES || [];
const media = window.PATCHDEX_MEDIA || {};
const errors = [];
const warnings = [];

for (const key of ["id", "slug"]) {
  const values = games.map(game => game[key]);
  for (const value of new Set(values.filter((item, index) => values.indexOf(item) !== index))) errors.push(`Doppelter ${key}: ${value}`);
}

for (const game of games) {
  errors.push(...validateGame(game).map(error => `${game.slug}: ${error}`));
  await access(resolve("games", game.slug, "index.html")).catch(() => errors.push(`${game.slug}: statische Detailseite fehlt`));
  if (!media[game.slug]) warnings.push(`${game.slug}: noch kein Motiv; neutrales Cover wird verwendet`);
}

const mediaIds = new Set();
for (const [slug, item] of Object.entries(media)) {
  if (mediaIds.has(item.mediaId)) errors.push(`${slug}: doppelte Medien-ID ${item.mediaId}`);
  mediaIds.add(item.mediaId);
  if (!["cover", "contain", "screenshot"].includes(item.imageFit)) errors.push(`${slug}: unbekannte Bilddarstellung`);
  if (!games.some(game => game.slug === slug)) errors.push(`${slug}: Medium ohne Spieleintrag`);
  for (const key of ["mediaId", "image", "imageAlt", "imageKind", "imageSourceLabel", "imageSourceUrl", "rightsStatus", "retrievedAt", "creator", "license", "history"]) {
    if (item[key] === undefined) errors.push(`${slug}: Medienfeld ${key} fehlt`);
  }
  if (item.enabled && !["freigegeben", "creative-commons"].includes(item.rightsStatus)) warnings.push(`${slug}: aktives Medium mit ungeklärten Rechten`);
  await access(resolve(item.image)).catch(() => errors.push(`${slug}: lokale Bilddatei fehlt`));
  const bytes = await readFile(resolve(item.image)).catch(() => null);
  if (bytes) {
    const signature = bytes.subarray(0, 12);
    const isImage = signature.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      || (signature[0] === 255 && signature[1] === 216 && signature[2] === 255)
      || (signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP")
      || /^GIF8[79]a/.test(signature.toString("ascii"));
    if (!isImage) errors.push(`${slug}: Datei ist kein unterstütztes Rasterbild`);
  }
}

const oldSources = games.filter(game => Date.now() - new Date(`${game.reviewedAt}T00:00:00Z`) > 270 * 86400000);
if (oldSources.length) warnings.push(`${oldSources.length} Quellen sind älter als 270 Tage geprüft`);

for (const warning of warnings) console.warn(`WARNUNG: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`FEHLER: ${error}`);
  process.exit(1);
}
console.log(`${games.length} Spiele und ${Object.keys(media).length} Medienobjekte valide.`);
