import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { mergeFinding, matchesFor, parseFeed, parseListing, publicUrl } from "./core.mjs";
import { createClient } from "./network.mjs";
import { readJson, writeJson, loadGames, acquireLock } from "./storage.mjs";
import { writeReport } from "./report.mjs";

export async function collect({ sources, inbox, state, games, get = createClient(), now = new Date().toISOString(), sourceId, backfill = false, maxPages = 3 }) {
  if (sourceId && !sources.some(source => source.id === sourceId)) throw new Error(`Unbekannte Quelle: ${sourceId}`);
  if (backfill && !sourceId) throw new Error("Historischen Import mit --source auf eine Quelle begrenzen");
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10) throw new Error("--max-pages muss zwischen 1 und 10 liegen");
  const results = [];
  for (const source of sources.filter(item => !sourceId || item.id === sourceId)) {
    if (!source.enabled || source.adapter === "manual") {
      results.push({ id: source.id, status: "manual" });
      continue;
    }
    if (backfill && source.adapter !== "html") throw new Error("Diese Quelle unterstützt keinen automatischen historischen Import");
    const health = state[source.id] ||= { failures: 0 };
    health.lastAttempt = now;
    let added = 0, changed = 0, observed = 0;
    const ingest = findings => {
      // Validate an entire response before mutating the inbox or its cursor.
      const draft = structuredClone(inbox);
      let newCount = 0, changedCount = 0;
      for (const finding of findings) {
        const result = mergeFinding(draft, finding, source.id, games, now);
        newCount += Number(result.isNew);
        changedCount += Number(result.changed);
      }
      inbox.splice(0, inbox.length, ...draft);
      added += newCount; changed += changedCount; observed += findings.length;
    };
    try {
      if (source.adapter === "rss") {
        const response = await get(source.url, source);
        ingest(parseFeed(response.body, source.url));
      } else if (source.adapter === "html") {
        const progress = health.backfill ||= { nextUrl: source.url, pages: 0, complete: false };
        let url = backfill ? progress.nextUrl : source.url;
        for (let page = 0; url && page < (backfill ? maxPages : 1); page++) {
          const response = await get(url, source);
          const parsed = parseListing(response.body, source, url);
          ingest(parsed.findings);
          if (backfill) Object.assign(progress, { nextUrl: parsed.next, pages: progress.pages + 1, complete: !parsed.next, lastSuccess: now });
          url = parsed.next;
        }
      } else if (source.adapter === "github-releases") {
        const failures = [];
        for (const game of games) {
          const repository = game.sourceUrl.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/?$/)?.[1];
          if (!repository) continue;
          try {
            const response = await get(`https://api.github.com/repos/${repository}/releases?per_page=100`, source);
            const releases = JSON.parse(response.body);
            if (!Array.isArray(releases)) throw new Error("GitHub lieferte keine Release-Liste");
            ingest(releases.filter(release => !release.draft).map(release => ({
              title: `${game.name} · ${release.tag_name}`, url: release.html_url,
              version: release.tag_name, publishedAt: release.published_at,
              excerpt: [release.name || release.tag_name, release.body || ""].join(" ")
            })));
          } catch (error) { failures.push(`${repository}: ${error.message}`); }
        }
        if (failures.length) throw new Error(failures.join("; "));
      } else if (source.adapter === "github-issues") {
        for (let page = 1; page <= 10; page++) {
          const url = new URL(source.url); url.searchParams.set("page", page);
          const response = await get(url.href, source);
          const issues = JSON.parse(response.body);
          if (!Array.isArray(issues)) throw new Error("GitHub lieferte keine Issue-Liste");
          const findings = [];
          for (const issue of issues.filter(issue => !issue.pull_request && issue.title.startsWith("[Spiel]"))) {
            const field = name => issue.body?.match(new RegExp(`### ${name}\\r?\\n+([\\s\\S]*?)(?=\\r?\\n### |$)`))?.[1]?.trim();
            const title = field("Spielname");
            const projectUrl = field("Projektquelle");
            if (!title || !projectUrl) continue;
            // Never fetch submitted URLs. The original issue stays the stable evidence URL.
            try { publicUrl(projectUrl); } catch { continue; }
            findings.push({ title, url: issue.html_url, projectUrl, excerpt: `Projektquelle: ${projectUrl}` });
          }
          ingest(findings);
          if (issues.length < 100) break;
          if (page === 10) throw new Error("Issue-Seitenlimit erreicht; verbleibender Bestand muss separat erfasst werden");
        }
      } else throw new Error(`Unbekannter Adapter: ${source.adapter}`);
      if (!backfill) health.lastSuccess = now;
      health.error = null; health.failures = 0; health.observed = observed;
      results.push({ id: source.id, status: "ok", added, changed, observed });
    } catch (error) {
      health.error = String(error.message).slice(0, 400);
      health.failures++;
      results.push({ id: source.id, status: "error", error: health.error, added, changed, observed });
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let release;
  try {
    const { values } = parseArgs({ options: { source: { type: "string" }, backfill: { type: "boolean", default: false }, "max-pages": { type: "string", default: "3" } } });
    release = await acquireLock();
    const sources = await readJson("discovery/sources.json");
    const inbox = await readJson("discovery/inbox.json");
    const state = await readJson("discovery/state.json");
    const games = await loadGames();
    const results = await collect({ sources, inbox, state, games, sourceId: values.source, backfill: values.backfill, maxPages: Number(values["max-pages"]) });
    for (const item of inbox) item.matches = matchesFor(item, games, inbox);
    await writeJson("discovery/inbox.json", inbox);
    await writeJson("discovery/state.json", state);
    await writeReport(sources, inbox, state);
    results.forEach(result => console.log(JSON.stringify(result)));
    if (results.some(result => result.status === "error")) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { if (release) await release(); }
}
