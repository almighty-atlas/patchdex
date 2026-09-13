import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { canonicalUrl, publicUrl, matchesFor, mergeFinding, parseFeed, parseListing, sourceHealth } from "../scripts/discovery/core.mjs";
import { collect } from "../scripts/discovery/collect.mjs";
import { createClient } from "../scripts/discovery/network.mjs";
import { prepareApproval, validateGame } from "../scripts/discovery/catalog.mjs";
import { report } from "../scripts/discovery/report.mjs";
import { root, loadGames } from "../scripts/discovery/storage.mjs";

const now = "2026-09-13T08:00:00.000Z";
const finding = { title: "Pokémon Beispiel", url: "https://example.org/game", excerpt: "Demo" };
const source = { id: "test-source", name: "Test", enabled: true, adapter: "rss", url: "https://example.org/feed", intervalHours: 24, backfill: { status: "manual" } };
function candidate() { const inbox = []; mergeFinding(inbox, finding, source.id, [], now); return inbox[0]; }
const game = { id: 1, slug: "pokemon-beispiel", name: finding.title, type: "Fan-Game", engine: "RPG Maker", status: "Eingestellt", language: "Unbekannt", base: "Essentials", version: "Unbekannt", sourceKind: "Projektquelle", sourceUrl: finding.url, featured: 0, color: "#56766a", symbol: "?", tags: ["Story"], description: "Ein dokumentiertes Beispielprojekt.", reviewedAt: "2026-09-13" };
function approval(item) { return { candidateId: item.id, targetSlug: null, evidenceFingerprints: item.evidence.map(e => e.fingerprint), game,
  review: { reviewer: "Redaktion", reviewedAt: "2026-09-13", notes: "Projektquelle geprüft.", evidence: [game.sourceUrl] } }; }

test("canonical URLs normalize tracking, fragments and renamed XenForo threads", () => {
  assert.equal(canonicalUrl("https://www.example.org/threads/old-title.123/page-2?utm_source=test#post-8"), "https://example.org/threads/123");
  assert.equal(canonicalUrl("https://example.org/threads/123/"), "https://example.org/threads/123");
  assert.notEqual(canonicalUrl("https://example.org/a?project=1"), canonicalUrl("https://example.org/a?project=2"));
});
test("unsafe URLs and credentials are rejected", () => {
  for (const url of ["javascript:alert(1)", "http://example.org", "https://127.0.0.1", "https://[::1]", "https://user:secret@example.org", "https://host.local", "https://example.org:8080/"]) assert.throws(() => publicUrl(url));
});
test("same URL merges, repeated observations do not create history spam", () => {
  const inbox = [];
  mergeFinding(inbox, finding, source.id, [], now);
  mergeFinding(inbox, { ...finding, url: `${finding.url}?utm_source=x` }, source.id, [], now);
  assert.equal(inbox.length, 1); assert.equal(inbox[0].history.length, 1);
});
test("real content changes reopen adopted records but preserve exclusions", () => {
  const inbox = [candidate()]; inbox[0].status = "adopted";
  mergeFinding(inbox, { ...finding, excerpt: "Version 2" }, source.id, [], now);
  assert.equal(inbox[0].status, "reviewing"); assert.equal(inbox[0].needsReview, true);
  inbox[0].status = "excluded";
  mergeFinding(inbox, { ...finding, excerpt: "Version 3" }, source.id, [], now);
  assert.equal(inbox[0].status, "excluded");
});
test("same-name discoveries stay separate and only suggest matches", () => {
  const inbox = [candidate()];
  mergeFinding(inbox, { ...finding, url: "https://example.org/another-game" }, source.id, [game], now);
  assert.equal(inbox.length, 2); assert.equal(inbox[1].status, "new");
  assert.equal(inbox[1].matches[0].reason, "same-name");
  assert.equal(matchesFor({ ...finding, title: "An alias" }, [{ ...game, aliases: ["An alias"], sourceUrl: "https://example.org/other" }])[0].reason, "same-name");
});
test("shared developer landing pages can contain distinct projects", () => {
  const inbox = [];
  mergeFinding(inbox, { ...finding, projectKey: "project-one" }, source.id, [], now);
  mergeFinding(inbox, { ...finding, title: "Another Game", projectKey: "project-two" }, source.id, [], now);
  assert.equal(inbox.length, 2); assert.notEqual(inbox[0].id, inbox[1].id);
  mergeFinding(inbox, { ...finding, projectKey: "project-one" }, source.id, [], now);
  assert.equal(inbox.length, 2);
});
test("GitHub releases suggest their existing project", () => {
  assert.equal(matchesFor({ title: "Version 2", url: "https://github.com/team/game/releases/tag/v2" }, [{ slug: "game", name: "Game", sourceUrl: "https://github.com/team/game" }])[0].reason, "project-release");
});
test("RSS CDATA and Atom links parse without fetching embedded assets", () => {
  const rss = '<rss><channel><item><title>Pokémon &amp; Co</title><link>https://example.org/game</link><description><![CDATA[<b>Demo</b>]]></description></item></channel></rss>';
  assert.equal(parseFeed(rss, source.url)[0].title, "Pokémon & Co");
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Game</title><link rel="alternate" href="/game"/><summary>Demo</summary></entry></feed>';
  assert.equal(parseFeed(atom, source.url)[0].url, finding.url);
  assert.throws(() => parseFeed("<html>Access denied</html>", source.url));
  assert.throws(() => parseFeed('<!DOCTYPE rss><rss/>', source.url));
  assert.throws(() => parseFeed('<rss><channel><item><title>No URL</title></item></channel></rss>', source.url));
});
test("HTML importer follows only the adjacent catalog page", () => {
  const config = { url: "https://example.org/games/", linkSelector: ".game__link", pageParameter: "page" };
  const parsed = parseListing('<a class="game__link" href="/game">Game</a><a href="?page=2">2</a><a href="?page=99">Last</a>', config, config.url);
  assert.equal(parsed.next, "https://example.org/games/?page=2"); assert.equal(parsed.findings.length, 1);
  assert.throws(() => parseListing("<h1>Blocked</h1>", config, config.url));
  const actual = parseListing('<div><a class="game__link" href="/game">Game</a><div class="game__category"><span class="text--light">Beta 2 —</span> ROM Hacking GBA</div></div>', config, config.url);
  assert.equal(actual.findings[0].version, "Beta 2");
  assert.match(actual.findings[0].excerpt, /ROM Hacking GBA/);
});
test("one unavailable GitHub project does not prevent other release checks", async () => {
  const inbox = [], state = {};
  const config = { ...source, adapter: "github-releases", url: "https://api.github.com/" };
  const games = [{ sourceUrl: "https://github.com/team/missing", name: "Missing" }, { sourceUrl: "https://github.com/team/works", name: "Works" }];
  const result = await collect({ sources: [config], inbox, state, games, now, get: async url => {
    if (url.includes("missing")) throw new Error("HTTP 404");
    return { body: JSON.stringify([{ tag_name: "v2", html_url: "https://github.com/team/works/releases/tag/v2", body: "Update" }]) };
  } });
  assert.equal(result[0].status, "error"); assert.equal(inbox.length, 1);
});
test("collector respects manual sources and retains successful sources on failure", async () => {
  const inbox = [], state = {};
  const results = await collect({ sources: [source, { ...source, id: "bad", url: "https://example.org/bad" }, { ...source, id: "manual", enabled: false }], inbox, state, games: [], now,
    get: async url => { if (url.endsWith("bad")) throw new Error("HTTP 429"); return { body: '<rss><channel><item><title>Game</title><link>https://example.org/game</link></item></channel></rss>' }; } });
  assert.equal(inbox.length, 1); assert.equal(state.bad.failures, 1); assert.equal(state.bad.lastSuccess, undefined);
  assert.equal(results[2].status, "manual");
});
test("backfill resumes after last successfully committed page", async () => {
  const config = { ...source, adapter: "html", url: "https://example.org/games/", linkSelector: ".game__link", pageParameter: "page" };
  const inbox = [], state = {};
  const options = { sources: [config], sourceId: config.id, inbox, state, games: [], now, backfill: true, maxPages: 2 };
  await collect({ ...options, get: async url => { if (url.includes("page=2")) throw new Error("HTTP 503"); return { body: '<a class="game__link" href="/one">One</a><a href="?page=2">2</a>' }; } });
  assert.equal(state[config.id].backfill.pages, 1); assert.equal(inbox.length, 1);
  await collect({ ...options, get: async url => { assert.ok(url.includes("page=2")); return { body: '<a class="game__link" href="/two">Two</a>' }; } });
  assert.equal(state[config.id].backfill.complete, true); assert.equal(inbox.length, 2);
});
test("source health exposes stale, failed, never checked and manual sources", () => {
  assert.equal(sourceHealth(source, {}, new Date(now)), "never");
  assert.equal(sourceHealth(source, { lastSuccess: "2026-01-01" }, new Date(now)), "stale");
  assert.equal(sourceHealth(source, { lastSuccess: now, error: "403" }, new Date(now)), "error");
  assert.equal(sourceHealth({ ...source, enabled: false }, {}, new Date(now)), "manual");
});
test("issue submissions are imported without fetching user-supplied URLs", async () => {
  const inbox = [], state = {};
  const config = { ...source, adapter: "github-issues", url: "https://api.github.com/repos/team/archive/issues" };
  const result = await collect({ sources: [config], inbox, state, games: [game], now, get: async url => {
    assert.ok(url.startsWith("https://api.github.com/"));
    return { body: JSON.stringify([
      { title: "[Spiel] Beispiel", html_url: "https://github.com/team/archive/issues/1", body: `### Spielname\r\n\r\n${finding.title}\r\n\r\n### Projektquelle\r\n\r\n${finding.url}\r\n\r\n### Hinweise\r\n\r\nDetails` },
      { title: "[Spiel] Unsafe", html_url: "https://github.com/team/archive/issues/2", body: "### Spielname\nUnsafe\n### Projektquelle\njavascript:alert(1)" }
    ]) };
  } });
  assert.equal(result[0].status, "ok"); assert.equal(inbox.length, 1);
  assert.equal(inbox[0].projectUrl, finding.url); assert.equal(inbox[0].matches[0].reason, "same-url");
});
test("network honors robots rules and does not impersonate allowed bots", async () => {
  const calls = [];
  const get = createClient({ minDelay: 0, fetchImpl: async (url, options) => { calls.push(url); assert.match(options.headers["User-Agent"], /^PatchdexDiscovery/); return new Response("User-agent: Googlebot\nAllow: /\nUser-agent: *\nDisallow: /", { status: 200 }); } });
  await assert.rejects(get(source.url, source), /untersagt/); assert.equal(calls.length, 1);
});
test("network refuses redirects, inaccessible robots and oversized responses", async () => {
  const noDelay = { minDelay: 0, sleep: async () => {} };
  for (const response of [new Response("", { status: 302, headers: { location: "https://other.org" } }), new Response("", { status: 503 }), new Response("x", { status: 200, headers: { "content-length": "9999999" } })]) {
    const get = createClient({ ...noDelay, fetchImpl: async () => response });
    await assert.rejects(get(source.url, source));
  }
  const get = createClient({ ...noDelay, fetchImpl: async () => { throw new Error("must not fetch"); } });
  await assert.rejects(get("https://other.org/", source), /außerhalb/);
});
test("review requires human evidence and fresh source fingerprints", () => {
  const item = candidate(); const document = approval(item);
  assert.equal(prepareApproval(item, document, [], now).featured, 0);
  assert.equal(prepareApproval(item, document, [], now).editorialHistory.length, 1);
  assert.throws(() => prepareApproval(item, { ...document, review: { ...document.review, reviewer: "" } }, [], now));
  assert.throws(() => prepareApproval(item, { ...document, evidenceFingerprints: [] }, [], now), /geändert/);
  assert.throws(() => prepareApproval(item, document, [game], now), /existiert bereits/);
  assert.equal(prepareApproval(item, { ...document, targetSlug: game.slug }, [game], now).id, game.id);
});
test("missing images and unknown/discontinued metadata do not prevent archive inclusion", () => {
  assert.deepEqual(validateGame(game), []);
  assert.ok(validateGame({ ...game, color: 'red; background:url(x)' }).length);
  assert.ok(validateGame({ ...game, reviewedAt: "2026-02-30" }).length);
});
test("report escapes untrusted Markdown/HTML and surfaces errors", () => {
  const item = candidate(); item.title = '<script>alert(1)</script> [click](bad)';
  const output = report([source], [item], { [source.id]: { error: "HTTP 403" } }, new Date(now));
  assert.ok(!output.includes("<script>")); assert.match(output, /HTTP 403/);
});
test("CLI import → draft → approve changes only the reviewed catalog in an isolated repository", async t => {
  const directory = await mkdtemp(resolve(tmpdir(), "patchdex-discovery-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(resolve(root, "scripts/discovery"), resolve(directory, "scripts/discovery"), { recursive: true });
  await cp(resolve(root, "discovery"), resolve(directory, "discovery"), { recursive: true });
  await symlink(resolve(root, "node_modules"), resolve(directory, "node_modules"), "dir");
  await writeFile(resolve(directory, "games-data.js"), 'window.PATCHDEX_GAMES = [...window.PATCHDEX_REVIEWED_GAMES];');
  await cp(resolve(root, "games-reviewed.js"), resolve(directory, "games-reviewed.js"));
  await writeFile(resolve(directory, "package.json"), '{"type":"module"}');
  await writeFile(resolve(directory, "discovery/inbox.json"), "[]");
  await writeFile(resolve(directory, "import.json"), JSON.stringify([finding]));
  const run = (...args) => execFileSync(process.execPath, [resolve(directory, "scripts/discovery/review.mjs"), ...args], { cwd: directory, encoding: "utf8" });
  run("import", "--source", "eevee-released", "--file", "import.json");
  const inbox = JSON.parse(await readFile(resolve(directory, "discovery/inbox.json"), "utf8"));
  run("draft", "--id", inbox[0].id, "--out", "draft.json");
  const draft = JSON.parse(await readFile(resolve(directory, "draft.json"), "utf8"));
  assert.equal(draft.game.featured, 0); assert.equal(draft.game.status, "Unbekannt");
  const document = approval(inbox[0]);
  await writeFile(resolve(directory, "draft.json"), JSON.stringify(document));
  run("approve", "--file", "draft.json");
  const reviewed = await readFile(resolve(directory, "games-reviewed.js"), "utf8");
  assert.match(reviewed, /pokemon-beispiel/);
  assert.equal(JSON.parse(await readFile(resolve(directory, "discovery/inbox.json"), "utf8"))[0].status, "adopted");
  assert.equal(await readFile(resolve(directory, "games-data.js"), "utf8"), 'window.PATCHDEX_GAMES = [...window.PATCHDEX_REVIEWED_GAMES];');
  await cp(resolve(root, "generate-pages.mjs"), resolve(directory, "generate-pages.mjs"));
  await writeFile(resolve(directory, "media-data.js"), 'window.PATCHDEX_MEDIA = {};');
  execFileSync(process.execPath, [resolve(directory, "generate-pages.mjs")], { cwd: directory });
  const page = await readFile(resolve(directory, "games/pokemon-beispiel/index.html"), "utf8");
  assert.match(page, /Eingestellt/); assert.match(page, /detail-cover-symbol/); assert.ok(!page.includes("detail-cover-media"));
});
test("real archive stays separate from discovery inbox", async () => {
  const games = await loadGames();
  assert.ok(games.length >= 44);
  for (const game of games) assert.deepEqual(validateGame(game), [], game.slug);
});
