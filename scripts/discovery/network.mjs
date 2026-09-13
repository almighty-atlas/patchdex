import robotsParser from "robots-parser";
import { publicUrl } from "./core.mjs";

const agent = "PatchdexDiscovery";
const userAgent = `${agent}/1.0 (+https://github.com/almighty-atlas/patchdex)`;

export function createClient({ fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), minDelay = 1500 } = {}) {
  const policies = new Map();
  const lastRequest = new Map();
  async function request(url, origin, delay = minDelay) {
    const u = publicUrl(url);
    if (u.origin !== origin) throw new Error("Abruf außerhalb der konfigurierten Quell-Domain verweigert");
    await sleep(Math.max(0, delay - (Date.now() - (lastRequest.get(origin) || 0))));
    lastRequest.set(origin, Date.now());
    const headers = { "User-Agent": userAgent, Accept: "application/rss+xml, application/atom+xml, application/json, text/html, text/plain" };
    if (origin === "https://api.github.com" && process.env.DISCOVERY_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.DISCOVERY_GITHUB_TOKEN}`;
    const response = await fetchImpl(url, { headers, redirect: "manual", signal: AbortSignal.timeout(20000) });
    if (response.status >= 300 && response.status < 400) throw new Error(`HTTP ${response.status}: Weiterleitung muss im Quellenregister geprüft werden`);
    if (Number(response.headers.get("content-length")) > 3000000) throw new Error("Antwort überschreitet 3 MB");
    let size = 0;
    const chunks = [];
    if (response.body) {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 3000000) throw new Error("Antwort überschreitet 3 MB");
        chunks.push(Buffer.from(chunk));
      }
    }
    return { status: response.status, body: Buffer.concat(chunks).toString("utf8"), type: response.headers.get("content-type") || "" };
  }
  return async function get(url, source) {
    const origin = publicUrl(source.url).origin;
    if (publicUrl(url).origin !== origin) throw new Error("Abruf außerhalb der konfigurierten Quell-Domain verweigert");
    let delay = minDelay;
    // The documented GitHub API is not a website crawler endpoint.
    if (origin !== "https://api.github.com") {
      if (!policies.has(origin)) {
        const robots = await request(`${origin}/robots.txt`, origin);
        if (robots.status !== 200 && robots.status !== 404) throw new Error(`robots.txt nicht prüfbar: HTTP ${robots.status}`);
        if (robots.status === 200 && /<html/i.test(robots.body)) throw new Error("robots.txt liefert HTML statt Regeln");
        policies.set(origin, robotsParser(`${origin}/robots.txt`, robots.status === 404 ? "" : robots.body));
      }
      const policy = policies.get(origin);
      if (policy.isAllowed(url, agent) === false) throw new Error("robots.txt untersagt diesen Abruf");
      delay = Math.max(delay, (policy.getCrawlDelay(agent) || 0) * 1000);
      if (delay > 10000) throw new Error("Crawl-delay über 10 Sekunden: Quelle benötigt gesonderte Zeitplanung");
    }
    const response = await request(url, origin, delay);
    if (response.status !== 200) throw new Error(`HTTP ${response.status}; keine automatische Wiederholung in diesem Lauf`);
    return response;
  };
}
