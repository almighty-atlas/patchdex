import { access } from "node:fs/promises";
import { resolve } from "node:path";

globalThis.window = {};
await import("../games-data.js");
await import("../media-data.js");

const games = window.PATCHDEX_GAMES || [];
const media = window.PATCHDEX_MEDIA || {};
const errors = [];
const warnings = [];
const required = ["id", "slug", "name", "type", "engine", "status", "language", "base", "version", "sourceKind", "sourceUrl", "featured", "color", "symbol", "tags", "description", "reviewedAt"];
const allowed = {
  type: new Set(["ROM-Hack", "Fan-Game"]),
  status: new Set(["Komplett", "In Entwicklung", "Demo"]),
  language: new Set(["Deutsch", "Englisch", "Mehrsprachig"]),
  engine: new Set(["GBA", "GBC", "NDS", "Switch", "RPG Maker", "Browser"])
};

for (const key of ["id", "slug"]) {
  const values = games.map(game => game[key]);
  for (const value of new Set(values.filter((item, index) => values.indexOf(item) !== index))) errors.push(`Doppelter ${key}: ${value}`);
}

for (const game of games) {
  for (const key of required) if (game[key] === undefined || game[key] === "") errors.push(`${game.slug || game.name}: ${key} fehlt`);
  for (const [key, values] of Object.entries(allowed)) if (!values.has(game[key])) errors.push(`${game.slug}: unbekannter ${key}-Wert „${game[key]}“`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug)) errors.push(`${game.slug}: ungültiger Slug`);
  if (!/^https:\/\//.test(game.sourceUrl)) errors.push(`${game.slug}: Quelle muss HTTPS verwenden`);
  if (!Array.isArray(game.tags) || game.tags.length < 2) errors.push(`${game.slug}: mindestens zwei Tags erwartet`);
  if (new Set(game.tags).size !== game.tags.length) errors.push(`${game.slug}: doppelte Tags`);
  await access(resolve("games", game.slug, "index.html")).catch(() => errors.push(`${game.slug}: statische Detailseite fehlt`));
}

for (const [slug, item] of Object.entries(media)) {
  if (!games.some(game => game.slug === slug)) errors.push(`${slug}: Medium ohne Spieleintrag`);
  for (const key of ["mediaId", "image", "imageAlt", "imageKind", "imageSourceLabel", "imageSourceUrl", "rightsStatus", "retrievedAt", "creator", "license", "history"]) {
    if (item[key] === undefined) errors.push(`${slug}: Medienfeld ${key} fehlt`);
  }
  if (item.enabled && !["freigegeben", "creative-commons"].includes(item.rightsStatus)) errors.push(`${slug}: Medium ohne geklärte Rechte aktiviert`);
  await access(resolve(item.image)).catch(() => errors.push(`${slug}: lokale Bilddatei fehlt`));
}

const oldSources = games.filter(game => Date.now() - new Date(`${game.reviewedAt}T00:00:00Z`) > 270 * 86400000);
if (oldSources.length) warnings.push(`${oldSources.length} Quellen sind älter als 270 Tage geprüft`);

for (const warning of warnings) console.warn(`WARNUNG: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`FEHLER: ${error}`);
  process.exit(1);
}
console.log(`${games.length} Spiele und ${Object.keys(media).length} Medienobjekte valide.`);
