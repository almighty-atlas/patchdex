import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sourceHealth } from "./core.mjs";
import { root, readJson } from "./storage.mjs";

const md = value => String(value ?? "—").replace(/[\r\n]+/g, " ").replace(/[\\`*_{}\[\]()#+.!|<>]/g, "\\$&");
export function report(sources, inbox, state, now = new Date()) {
  const lines = ["# Discovery-Eingang", "", "Automatische Funde sind ungeprüft und keine veröffentlichten Spiele. Keine Vollständigkeitsbehauptung.", "", "## Quellen und Abdeckung", "",
    "| Quelle | Zustand | Letzter Erfolg | Historischer Import |", "| --- | --- | --- | --- |"];
  for (const source of sources) {
    const health = state[source.id];
    const progress = health?.backfill;
    lines.push(`| ${md(source.name)} | ${sourceHealth(source, health, now)} | ${md(health?.lastSuccess)} | ${md(progress ? `${progress.pages} Seiten; ${progress.complete ? "Katalogdurchlauf beendet" : "weitere Seiten offen"}` : source.backfill.status)} |`);
  }
  lines.push("");
  for (const source of sources) if (state[source.id]?.error) lines.push(`Fehler ${md(source.id)}: ${md(state[source.id].error)}`, "");
  lines.push("", "Zustände: ok = kürzlich erfolgreich; stale = länger als zwei Intervalle ohne Erfolg; never = noch nie erfolgreich; error = Abruffehler; manual = bewusst nicht automatisiert.",
    "", "Ein beendeter Katalogdurchlauf gilt nur für diese Quelle und diesen Zeitpunkt. Seiten können sich während des Imports verschieben; regelmäßige Wiederholungen bleiben nötig.", "", "## Eingangsliste", "",
    `${inbox.length} Funde; ${inbox.filter(item => ["new", "reviewing"].includes(item.status) || item.needsReview).length} zur Prüfung.`, "");
  for (const item of inbox) {
    lines.push(`### ${md(item.title)}`, "", `- ID: \`${item.id}\` · Status: ${md(item.status)}${item.needsReview ? " · Quelle geändert" : ""}`,
      `- Quelle: <${item.url.replace(/>/g, "%3E")}>`, `- Mögliche Zuordnung: ${item.matches.map(match => `${md(match.target)} (${md(match.reason)})`).join(", ") || "keine"}`,
      `- Erstmals gefunden: ${md(item.firstSeen)}`, "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
export async function writeReport(sources, inbox, state) {
  await writeFile(resolve(root, "discovery/REPORT.md"), report(sources, inbox, state));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeReport(await readJson("discovery/sources.json"), await readJson("discovery/inbox.json"), await readJson("discovery/state.json"));
}
