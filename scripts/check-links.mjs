globalThis.window = {};
await import("../games-data.js");

const timeoutMs = 12000;
const results = [];
for (const game of window.PATCHDEX_GAMES) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(game.sourceUrl, { method: "HEAD", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "PatchDex-Linkcheck/1.0" } });
    if ([403, 405].includes(response.status)) response = await fetch(game.sourceUrl, { method: "GET", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "PatchDex-Linkcheck/1.0" } });
    results.push({ slug: game.slug, status: response.status, ok: response.ok || response.status === 403, finalUrl: response.url });
  } catch (error) {
    results.push({ slug: game.slug, status: 0, ok: false, error: error.name });
  } finally {
    clearTimeout(timer);
  }
}

for (const result of results) console.log(`${result.ok ? "OK" : "FEHLER"} ${result.status} ${result.slug}${result.finalUrl ? ` → ${result.finalUrl}` : ""}`);
if (results.some(result => !result.ok)) process.exitCode = 1;
