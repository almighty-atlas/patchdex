import { createHash } from "node:crypto";
import { load } from "cheerio";

export const statuses = ["new", "reviewing", "adopted", "duplicate", "excluded"];
export const hash = value => createHash("sha256").update(value).digest("hex");
export const plain = value => load(String(value ?? "")).text().replace(/\s+/g, " ").trim();
export const normalizeName = value => plain(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function publicUrl(value) {
  const u = new URL(value);
  if (u.protocol !== "https:" || u.username || u.password || u.port || !u.hostname.includes(".")
      || /(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname)
      || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(":")) throw new Error("Nur öffentliche HTTPS-URLs ohne Zugangsdaten erlaubt");
  return u;
}

export function canonicalUrl(value) {
  const u = publicUrl(value);
  u.hash = "";
  u.hostname = u.hostname.replace(/^www\./, "");
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/.test(key)) u.searchParams.delete(key);
  u.searchParams.sort();
  // XenForo titles can change while the numeric thread ID stays stable.
  const thread = u.pathname.match(/^(.*\/threads\/)(?:[^/]*\.)?(\d+)(?:\/.*)?$/);
  if (thread) u.pathname = `${thread[1]}${thread[2]}/`;
  u.pathname = u.pathname.replace(/\/+$/, "") || "/";
  return u.href;
}

export function matchesFor(candidate, games, inbox = []) {
  const names = new Set([candidate.title, ...(candidate.aliases || [])].map(normalizeName).filter(Boolean));
  const url = canonicalUrl(candidate.projectUrl || candidate.url);
  const matches = [];
  for (const game of [...games, ...inbox.filter(item => item.id !== candidate.id)]) {
    const reference = game.slug || game.id;
    if (game.sourceUrl || game.url) {
      const otherUrl = canonicalUrl(game.sourceUrl || game.projectUrl || game.url);
      if (otherUrl === url) { matches.push({ target: reference, reason: "same-url" }); continue; }
      if (otherUrl.startsWith("https://github.com/") && url.startsWith(`${otherUrl}/releases/`)) { matches.push({ target: reference, reason: "project-release" }); continue; }
    }
    const otherNames = [game.name || game.title, ...(game.aliases || [])].map(normalizeName);
    if (otherNames.some(name => names.has(name))) matches.push({ target: reference, reason: "same-name" });
    else if (otherNames.some(name => name.length >= 10 && [...names].some(candidateName => candidateName.includes(name)))) matches.push({ target: reference, reason: "name-in-release-title" });
    else if (candidate.developer && game.developer && normalizeName(candidate.developer) === normalizeName(game.developer)
      && candidate.base && candidate.base === game.base) matches.push({ target: reference, reason: "same-developer-and-base" });
  }
  return matches;
}

export function mergeFinding(inbox, finding, sourceId, games, now) {
  const url = publicUrl(finding.url).href;
  const identity = canonicalUrl(url);
  const projectKey = finding.projectKey || null;
  if (projectKey !== null && (typeof projectKey !== "string" || !/^[a-z0-9-]{1,100}$/.test(projectKey))) throw new Error("projectKey muss ein kurzer stabiler Slug sein");
  const title = plain(finding.title).slice(0, 240);
  if (!title) throw new Error("Fund ohne Titel");
  const fullExcerpt = plain(finding.excerpt);
  const excerpt = fullExcerpt.slice(0, 400);
  if (finding.projectUrl) publicUrl(finding.projectUrl);
  const fingerprint = hash(JSON.stringify([title, fullExcerpt, finding.version || null]));
  let candidate = inbox.find(item => canonicalUrl(item.url) === identity && (item.projectKey || null) === projectKey);
  const isNew = !candidate;
  if (!candidate) {
    candidate = { id: `candidate-${hash(projectKey ? `${identity}|${projectKey}` : identity).slice(0, 16)}`, title, url, status: "new", firstSeen: now, lastSeen: now,
      aliases: [], developer: null, base: null, evidence: [], history: [], matches: [], draft: null, review: null };
    inbox.push(candidate);
    if (projectKey) candidate.projectKey = projectKey;
  }
  const evidence = candidate.evidence.find(item => item.sourceId === sourceId);
  const changed = Boolean(evidence && evidence.fingerprint !== fingerprint);
  const record = { sourceId, url, title, excerpt, version: finding.version || null, publishedAt: finding.publishedAt || null,
    observedAt: now, fingerprint };
  if (evidence) Object.assign(evidence, record); else candidate.evidence.push(record);
  candidate.lastSeen = now;
  if (changed) candidate.title = title;
  if (finding.projectUrl) candidate.projectUrl = finding.projectUrl;
  if (finding.aliases !== undefined) {
    if (!Array.isArray(finding.aliases) || finding.aliases.some(alias => typeof alias !== "string")) throw new Error("Aliasnamen müssen eine Textliste sein");
    candidate.aliases = [...new Set([...candidate.aliases, ...finding.aliases.map(plain)])];
  }
  if (finding.developer) candidate.developer = plain(finding.developer).slice(0, 160);
  if (finding.base) candidate.base = plain(finding.base).slice(0, 100);
  if (isNew || changed || !evidence) candidate.history.push({ at: now, action: isNew ? "discovered" : changed ? "source-changed" : "source-added", sourceId, fingerprint });
  if (changed) {
    candidate.needsReview = true;
    // Do not silently undo a human exclusion/duplicate decision.
    if (candidate.status === "adopted") candidate.status = "reviewing";
  }
  candidate.matches = matchesFor(candidate, games, inbox);
  return { candidate, isNew, changed };
}

export function parseFeed(body, sourceUrl) {
  if (/<!DOCTYPE|<!ENTITY/i.test(body)) throw new Error("DTD/Entities sind in Feeds nicht erlaubt");
  const $ = load(body, { xml: true });
  if (!$("rss > channel, feed").length) throw new Error("Antwort ist kein RSS-/Atom-Feed");
  return $("item, feed > entry").toArray().map(node => {
    const item = $(node);
    const link = item.find("link").filter((_, a) => !$(a).attr("rel") || $(a).attr("rel") === "alternate").first();
    const rawUrl = link.attr("href") || link.text();
    if (!rawUrl?.trim()) throw new Error("Feed-Eintrag ohne Projektlink");
    return { title: item.find("title").first().text(), url: new URL(rawUrl, sourceUrl).href,
      excerpt: item.find("description, summary, content\\:encoded, content").first().text(),
      publishedAt: item.find("pubDate, published").first().text() || null };
  });
}

export function parseListing(body, source, pageUrl) {
  const $ = load(body);
  const findings = $(source.linkSelector).toArray().map(node => ({
    title: $(node).text(), url: new URL($(node).attr("href"), pageUrl).href,
    excerpt: $(node).parent().find(".game__category").text(),
    version: $(node).parent().find(".game__category .text--light").text().replace(/\s*—\s*$/, "").trim() || null
  }));
  if (!findings.length) throw new Error("Keine Projektlinks gefunden: Selektor geändert oder Zugriff blockiert");
  const current = Number(new URL(pageUrl).searchParams.get(source.pageParameter) || 1);
  const next = $("a[href]").toArray().map(node => {
    try { return new URL($(node).attr("href"), pageUrl); } catch { return null; }
  }).find(url => url && url.origin === new URL(source.url).origin && url.pathname === new URL(source.url).pathname
    && Number(url.searchParams.get(source.pageParameter)) === current + 1);
  return { findings, next: next?.href || null };
}

export function sourceHealth(source, state, now = new Date()) {
  if (!source.enabled) return "manual";
  if (state?.error) return "error";
  if (!state?.lastSuccess) return "never";
  return +now - Date.parse(state.lastSuccess) > source.intervalHours * 2 * 3600000 ? "stale" : "ok";
}
