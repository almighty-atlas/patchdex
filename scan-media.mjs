globalThis.window = {};
await import("./games-data.js");

function matches(html, expression) {
  return [...html.matchAll(expression)].map(match => match[1].replaceAll("&amp;", "&"));
}

for (const game of window.PATCHDEX_GAMES) {
  try {
    const response = await fetch(game.sourceUrl, { headers: { "User-Agent": "Mozilla/5.0 PatchDexMediaResearch/1.0" }, redirect: "follow" });
    const html = await response.text();
    const candidates = [
      ...matches(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi),
      ...matches(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi),
      ...matches(html, /<img[^>]+(?:data-src|src)=["']([^"']+)/gi)
    ].filter(value => !value.startsWith("data:")).slice(0, 8).map(value => {
      try { return new URL(value, response.url).href; } catch { return value; }
    });
    console.log(JSON.stringify({ slug: game.slug, status: response.status, page: response.url, candidates }));
  } catch (error) {
    console.log(JSON.stringify({ slug: game.slug, status: 0, page: game.sourceUrl, error: error.message, candidates: [] }));
  }
}
