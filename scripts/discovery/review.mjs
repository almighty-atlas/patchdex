import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mergeFinding, matchesFor, statuses } from "./core.mjs";
import { prepareApproval } from "./catalog.mjs";
import { root, readJson, writeJson, loadGames, acquireLock } from "./storage.mjs";
import { writeReport } from "./report.mjs";

let release;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    id: { type: "string" }, source: { type: "string" }, file: { type: "string" }, out: { type: "string" },
    target: { type: "string" }, status: { type: "string" }, note: { type: "string" }
  } });
  const command = positionals[0];
  if (command !== "list") release = await acquireLock();
  const sources = await readJson("discovery/sources.json");
  const inbox = await readJson("discovery/inbox.json");
  const games = await loadGames();
  const now = new Date().toISOString();
  const candidate = inbox.find(item => item.id === values.id);
  if (command === "list") {
    inbox.forEach(item => console.log(`${item.id}\t${item.status}\t${item.title}`));
  } else if (command === "import") {
    if (!values.file || !sources.some(source => source.id === values.source)) throw new Error("import benötigt --file und eine bekannte --source");
    const findings = JSON.parse(await readFile(resolve(values.file), "utf8"));
    if (!Array.isArray(findings) || findings.length > 1000) throw new Error("Import erwartet eine Liste mit höchstens 1000 Funden");
    for (const finding of findings) mergeFinding(inbox, finding, values.source, games, now);
    console.log(`${findings.length} Funde in die Eingangsliste aufgenommen, nichts veröffentlicht.`);
  } else if (command === "draft") {
    if (!candidate || !values.out) throw new Error("draft benötigt --id und --out");
    const existing = values.target && games.find(game => game.slug === values.target);
    if (values.target && !existing) throw new Error("Zielspiel unbekannt");
    const draft = { candidateId: candidate.id, targetSlug: existing?.slug || null,
      evidenceFingerprints: candidate.evidence.map(item => item.fingerprint),
      review: { reviewer: "", reviewedAt: now.slice(0, 10), notes: "", evidence: [existing?.sourceUrl || candidate.projectUrl || candidate.url] },
      game: existing || { slug: "", name: candidate.title, type: "Unbekannt", engine: "Unbekannt", status: "Unbekannt", language: "Unbekannt", base: "Unbekannt", version: "Unbekannt", sourceKind: "Projektquelle", sourceUrl: candidate.projectUrl || candidate.url, featured: 0, color: "#56766a", symbol: "?", tags: [], description: "", aliases: [], developer: "", availability: "Unbekannt", relations: [] } };
    await writeFile(resolve(values.out), `${JSON.stringify(draft, null, 2)}\n`, { flag: "wx" });
    candidate.status = "reviewing";
    candidate.history.push({ at: now, action: "draft-created" });
    console.log(`Entwurf: ${values.out}. Unbekannte Angaben nicht erraten; keine automatische Empfehlung.`);
  } else if (command === "approve") {
    if (!values.file) throw new Error("approve benötigt --file");
    const document = JSON.parse(await readFile(resolve(values.file), "utf8"));
    const item = inbox.find(item => item.id === document.candidateId);
    const game = prepareApproval(item, document, games, now);
    const reviewed = window.PATCHDEX_REVIEWED_GAMES.filter(entry => entry.slug !== game.slug);
    reviewed.push(game);
    // JSON serialization, never evaluate submitted text as JavaScript.
    const serialized = JSON.stringify(reviewed, null, 2).replace(/</g, "\\u003c");
    await writeFile(resolve(root, "games-reviewed.js"), `/* Geprüfte Ergänzungen und Korrekturen. Erzeugt über discovery:review approve. */\nwindow.PATCHDEX_REVIEWED_GAMES = ${serialized};\n`);
    item.status = "adopted"; item.needsReview = false; item.targetSlug = game.slug;
    item.review = { ...document.review, at: now };
    item.history.push({ at: now, action: "adopted", targetSlug: game.slug });
    console.log(`${game.slug} lokal übernommen. Jetzt npm test und npm run build; Veröffentlichung erst nach Commit/PR-Freigabe.`);
  } else if (command === "resolve") {
    if (!candidate || !statuses.includes(values.status) || values.status === "adopted" || !values.note?.trim()) throw new Error("resolve benötigt --id, --status (nicht adopted) und --note");
    if (values.status === "duplicate" && !games.some(game => game.slug === values.target) && !inbox.some(item => item.id === values.target && item.id !== candidate.id)) throw new Error("Dublette benötigt ein vorhandenes --target");
    candidate.status = values.status; candidate.needsReview = false;
    candidate.review = { note: values.note, target: values.target || null, at: now };
    candidate.history.push({ at: now, action: values.status, note: values.note, target: values.target || null });
  } else throw new Error("Befehle: list | import --source ID --file JSON | draft --id ID --out JSON [--target SLUG] | approve --file JSON | resolve --id ID --status STATUS --note TEXT [--target ID]");
  if (command !== "list") {
    for (const item of inbox) item.matches = matchesFor(item, games, inbox);
    await writeJson("discovery/inbox.json", inbox);
    await writeReport(sources, inbox, await readJson("discovery/state.json"));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (release) await release(); }
