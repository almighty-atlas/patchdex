import { publicUrl } from "./core.mjs";

export const allowed = {
  type: new Set(["ROM-Hack", "Fan-Game", "Unbekannt"]),
  status: new Set(["Komplett", "In Entwicklung", "Demo", "Eingestellt", "Unveröffentlicht", "Unbekannt"]),
  language: new Set(["Deutsch", "Englisch", "Mehrsprachig", "Spanisch", "Französisch", "Italienisch", "Portugiesisch", "Japanisch", "Andere", "Unbekannt"]),
  engine: new Set(["GBA", "GBC", "NDS", "3DS", "Switch", "RPG Maker", "Browser", "PC", "Andere", "Unbekannt"])
};
export function validateGame(game) {
  const errors = [];
  const required = ["id", "slug", "name", "type", "engine", "status", "language", "base", "version", "sourceKind", "sourceUrl", "featured", "color", "symbol", "tags", "description", "reviewedAt"];
  for (const key of required) if (game[key] === undefined || game[key] === "") errors.push(`${key} fehlt`);
  for (const [key, values] of Object.entries(allowed)) if (!values.has(game[key])) errors.push(`unbekannter ${key}-Wert`);
  if (!Number.isInteger(game.id) || game.id < 1) errors.push("id muss eine positive Ganzzahl sein");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug || "")) errors.push("ungültiger Slug");
  if (!Number.isFinite(game.featured) || game.featured < 0 || game.featured > 100) errors.push("featured muss zwischen 0 und 100 liegen");
  if (!/^#[a-f\d]{6}$/i.test(game.color || "")) errors.push("ungültige Farbe");
  if (!Array.isArray(game.tags) || !game.tags.length || game.tags.some(tag => typeof tag !== "string" || !tag.trim())) errors.push("mindestens ein belegter Tag erwartet");
  else if (new Set(game.tags).size !== game.tags.length) errors.push("doppelte Tags");
  for (const key of ["name", "base", "version", "sourceKind", "symbol", "description"]) {
    if (typeof game[key] !== "string" || /[<>]/.test(game[key])) errors.push(`${key} muss Klartext sein`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(game.reviewedAt || "") || !Number.isFinite(Date.parse(game.reviewedAt))
    || new Date(game.reviewedAt).toISOString().slice(0, 10) !== game.reviewedAt
    || game.reviewedAt > new Date().toISOString().slice(0, 10)) errors.push("ungültiges Prüfdatum");
  try { publicUrl(game.sourceUrl); if (/["'<>\s]/.test(game.sourceUrl)) throw new Error(); } catch { errors.push("Quelle muss eine öffentliche HTTPS-URL sein"); }
  if (game.availability && !["Verfügbar", "Nicht verfügbar", "Unbekannt"].includes(game.availability)) errors.push("unbekannte Verfügbarkeit");
  if (game.aliases && (!Array.isArray(game.aliases) || game.aliases.some(alias => typeof alias !== "string"))) errors.push("aliases muss eine Textliste sein");
  if (game.relations && (!Array.isArray(game.relations) || game.relations.some(relation => !["translation-of", "fork-of", "remake-of", "successor-of"].includes(relation.kind) || !/^[a-z0-9-]+$/.test(relation.slug)))) errors.push("ungültige Projektbeziehung");
  return errors;
}

export function prepareApproval(candidate, document, games, now = new Date().toISOString()) {
  if (!candidate || !["new", "reviewing"].includes(candidate.status)) throw new Error("Kandidat ist nicht zur Übernahme geöffnet");
  if (document.candidateId !== candidate.id) throw new Error("Entwurf gehört zu einem anderen Kandidaten");
  const review = document.review;
  if (!review?.reviewer?.trim() || !review.notes?.trim() || !Array.isArray(review.evidence) || !review.evidence.length) throw new Error("Prüfer, Prüfnotiz und Beleglinks erforderlich");
  review.evidence.forEach(publicUrl);
  const fingerprints = candidate.evidence.map(item => item.fingerprint).sort();
  if (JSON.stringify(document.evidenceFingerprints?.slice().sort()) !== JSON.stringify(fingerprints)) throw new Error("Quelle wurde seit Erstellung des Entwurfs geändert; Entwurf neu erstellen");
  if (!review.evidence.includes(document.game?.sourceUrl)) throw new Error("Die veröffentlichte Projektquelle muss als Beleg geprüft werden");
  const existing = games.find(game => game.slug === document.targetSlug);
  if (document.targetSlug && !existing) throw new Error("Zielspiel existiert nicht");
  const game = { ...document.game, id: existing?.id || Math.max(0, ...games.map(game => game.id)) + 1, reviewedAt: review.reviewedAt };
  if (existing && game.slug !== existing.slug) throw new Error("Korrekturen dürfen den bestehenden Slug nicht umbenennen");
  if (!existing && games.some(item => item.slug === game.slug)) throw new Error("Slug existiert bereits; Korrekturziel ausdrücklich angeben");
  const errors = validateGame(game);
  if (errors.length) throw new Error(errors.join("; "));
  for (const relation of game.relations || []) if (!games.some(item => item.slug === relation.slug) || relation.slug === game.slug) throw new Error("Projektbeziehung benötigt ein anderes, vorhandenes Zielspiel");
  game.editorialHistory = [...(existing?.editorialHistory || []), { at: now, candidateId: candidate.id, reviewer: review.reviewer.trim(), notes: review.notes.trim(), evidence: review.evidence, version: game.version, status: game.status }];
  return game;
}
