import { readJson, loadGames } from "./storage.mjs";
import { publicUrl, statuses } from "./core.mjs";
import { validateGame } from "./catalog.mjs";

const sources = await readJson("discovery/sources.json");
const inbox = await readJson("discovery/inbox.json");
const state = await readJson("discovery/state.json");
const games = await loadGames();
const unique = (items, label) => { if (new Set(items).size !== items.length) throw new Error(`${label}: doppelte IDs`); };
unique(sources.map(source => source.id), "Quellen");
unique(inbox.map(item => item.id), "Kandidaten");
unique(window.PATCHDEX_REVIEWED_GAMES.map(game => game.slug), "Freigaben");
for (const source of sources) {
  if (!/^[a-z0-9-]+$/.test(source.id) || !source.name || typeof source.enabled !== "boolean" || !source.accessNote || !source.backfill) throw new Error("Unvollständiges Quellenregister");
  if (!["manual", "rss", "html", "github-releases", "github-issues"].includes(source.adapter)) throw new Error(`${source.id}: unbekannter Adapter`);
  if (source.enabled && source.adapter === "manual") throw new Error(`${source.id}: manuelle Quelle kann nicht automatisch aktiviert werden`);
  if (!Number.isFinite(source.intervalHours) || source.intervalHours < 1) throw new Error(`${source.id}: ungültiges Prüfintervall`);
  publicUrl(source.url);
  if (source.adapter.startsWith("github-") && new URL(source.url).origin !== "https://api.github.com") throw new Error("GitHub-Adapter benötigt die offizielle API");
  if (source.adapter === "html" && (!source.linkSelector || !source.pageParameter)) throw new Error("HTML-Quelle benötigt Selektor und Seitenparameter");
  const cursor = state[source.id]?.backfill?.nextUrl;
  if (cursor && publicUrl(cursor).origin !== publicUrl(source.url).origin) throw new Error("Import-Cursor liegt außerhalb der Quelle");
}
for (const id of Object.keys(state)) if (!sources.some(source => source.id === id)) throw new Error(`Zustand ohne Quelle: ${id}`);
for (const item of inbox) {
  if (!/^candidate-[a-f0-9]{16}$/.test(item.id) || !statuses.includes(item.status) || !item.title || !item.evidence?.length || !Array.isArray(item.history)) throw new Error(`Ungültiger Kandidat: ${item.id}`);
  publicUrl(item.url);
  for (const evidence of item.evidence) {
    if (!sources.some(source => source.id === evidence.sourceId) || !/^[a-f0-9]{64}$/.test(evidence.fingerprint)) throw new Error(`${item.id}: ungültiger Beleg`);
    publicUrl(evidence.url);
  }
  if (item.status === "adopted" && !games.some(game => game.slug === item.targetSlug)) throw new Error(`${item.id}: übernommenes Zielspiel fehlt`);
}
for (const game of window.PATCHDEX_REVIEWED_GAMES) {
  const errors = validateGame(game);
  if (errors.length) throw new Error(`${game.slug}: ${errors.join(", ")}`);
  if (!game.editorialHistory?.length) throw new Error(`${game.slug}: Freigabeverlauf fehlt`);
}
console.log(`${sources.length} Quellen und ${inbox.length} Kandidaten geprüft; Eingang und öffentlicher Katalog getrennt.`);
