import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

globalThis.window = {};
await import("./games-reviewed.js");
await import("./games-data.js");
await import("./media-data.js");
const games = window.PATCHDEX_GAMES.map(game => {
  const media = window.PATCHDEX_MEDIA?.[game.slug];
  return {
    ...game,
    ...(media?.enabled === false ? {} : media || {})
  };
});

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[character]);

function relatedGames(game) {
  return games
    .filter(candidate => candidate.id !== game.id)
    .map(candidate => ({
      ...candidate,
      similarity: candidate.tags.filter(tag => game.tags.includes(tag)).length * 4
        + (candidate.type === game.type ? 2 : 0)
        + (candidate.engine === game.engine ? 1 : 0)
    }))
    .filter(candidate => candidate.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity || b.featured - a.featured)
    .slice(0, 3);
}

function safeStart(game) {
  if (game.engine === "Browser") return [
    "Nur die verlinkte Projekt-Domain öffnen.",
    "Es ist kein ROM-Download und kein Emulator erforderlich.",
    "Spielstand- und Datenschutzangaben des Projekts beachten."
  ];
  if (game.type === "ROM-Hack") return [
    `Eine legal erworbene Kopie von ${game.base} selbst bereitstellen.`,
    "Nur Patch und Anleitung aus der verlinkten Projektquelle verwenden.",
    "Basisversion und Prüfsumme mit der Projektanleitung abgleichen."
  ];
  return [
    "Nur über die verlinkte Entwickler- oder Community-Seite beziehen.",
    "Systemanforderungen und Installationsanleitung des Teams prüfen.",
    "Keine inoffiziellen Reuploads oder angeblichen Download-Portale verwenden."
  ];
}

function renderPage(game) {
  const shortName = game.name.replace("Pokémon ", "");
  const hasMedia = Boolean(game.image);
  const related = relatedGames(game);
  const steps = safeStart(game);
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.description,
    gamePlatform: game.engine,
    inLanguage: game.language,
    isBasedOn: game.base,
    sameAs: game.sourceUrl
  }).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(game.description)}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(game.name)} – PatchDex">
    <meta property="og:description" content="${escapeHtml(game.description)}">
    <meta name="theme-color" content="${game.color}">
    <title>${escapeHtml(game.name)} – PatchDex</title>
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../../detail.css">
    <script type="application/ld+json">${schema}</script>
  </head>
  <body class="detail-page">
    <header class="detail-header">
      <a class="brand" href="../../" aria-label="Zur PatchDex Startseite"><span class="brand-mark"><i></i></span><span>PATCH<span>DEX</span></span></a>
      <a class="back-link" href="../../#catalog">← Alle Spiele</a>
    </header>
    <main class="detail-main">
      <figure class="detail-cover${hasMedia ? " has-media" : ""} cover-variant-${game.id % 4}" style="--card-color:${game.color}">
        ${hasMedia ? `<img class="detail-cover-media fit-${game.imageFit}" src="../../${game.image}" alt="${escapeHtml(game.imageAlt)}"><figcaption><span>${escapeHtml(game.imageKind)}</span><a href="${game.imageSourceUrl}" target="_blank" rel="noopener noreferrer nofollow">Quelle: ${escapeHtml(game.imageSourceLabel)} ↗</a></figcaption>` : `<span class="detail-cover-symbol">${escapeHtml(game.symbol)}</span><div><small>PATCHDEX ARCHIVE · ${escapeHtml(game.base)}</small><strong>${escapeHtml(shortName)}</strong></div>`}
      </figure>
      <article class="detail-content">
        <div class="detail-eyebrow">${game.type} · ${game.engine}</div>
        <h1>${escapeHtml(game.name)}</h1>
        <p class="detail-lead">${escapeHtml(game.description)}</p>
        <div class="detail-tags">${game.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <dl class="detail-facts">
          <div><dt>Status</dt><dd>${game.status}</dd></div>
          <div><dt>Version</dt><dd>${escapeHtml(game.version)}</dd></div>
          <div><dt>Basis</dt><dd>${escapeHtml(game.base)}</dd></div>
          <div><dt>Sprache</dt><dd>${game.language}</dd></div>
${game.availability ? `          <div><dt>Verfügbarkeit</dt><dd>${escapeHtml(game.availability)}</dd></div>\n` : ""}${game.developer ? `          <div><dt>Entwicklung</dt><dd>${escapeHtml(game.developer)}</dd></div>\n` : ""}${game.relations?.length ? `          <div><dt>Verwandte Projekte</dt><dd>${game.relations.map(relation => `<a href="../${relation.slug}/">${escapeHtml(relation.kind)}: ${escapeHtml(games.find(item => item.slug === relation.slug)?.name || relation.slug)}</a>`).join(" · ")}</dd></div>\n` : ""}        </dl>
        <section class="detail-safe">
          <div class="detail-safe-heading"><span>✓</span><div><small>SICHER STARTEN</small><h2>${game.type === "ROM-Hack" ? "Patch statt fertiger ROM" : game.engine === "Browser" ? "Direkt im Browser" : "Quelle vor Download prüfen"}</h2></div></div>
          <ol>${steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        </section>
        <div class="detail-source">
          <div><span class="freshness green" data-freshness><i></i><b>Kürzlich geprüft</b></span><small>Quelle geprüft am <time datetime="${game.reviewedAt}">${game.reviewedAt.split("-").reverse().join(".")}</time></small></div>
          <a href="${game.sourceUrl}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(game.sourceKind)} öffnen ↗</a>
        </div>
        <p class="detail-disclaimer">PatchDex hostet weder ROMs noch Spieldateien und ist nicht mit Nintendo, Game Freak, Creatures oder The Pokémon Company verbunden.</p>
        <div class="detail-actions">
          <button class="share-button" data-share data-title="${escapeHtml(game.name)}">Link teilen <span>↗</span></button>
${hasMedia ? `          <a href="../../remove/?game=${game.slug}&target=image&media=${game.mediaId}">Bild entfernen lassen</a>\n` : ""}          <a href="../../remove/?game=${game.slug}&target=game">Spieleintrag entfernen lassen</a>
        </div>
      </article>
      <section class="detail-related">
        <small>PASSEND DAZU</small><h2>Ähnliche Spiele</h2>
        <div>${related.map(candidate => `<a href="../${candidate.slug}/"><i style="--related-color:${candidate.color}">${escapeHtml(candidate.symbol)}</i><span><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(candidate.tags.filter(tag => game.tags.includes(tag)).join(" · ") || candidate.type)}</small></span><b>→</b></a>`).join("")}</div>
      </section>
    </main>
    <footer class="detail-footer"><a href="../../">PatchDex</a><span>Redaktionelles Fanprojekt-Archiv · Keine Spieldateien</span><a href="../../remove/?game=${game.slug}">Inhalt entfernen lassen</a></footer>
    <div class="toast" id="toast" role="status">Link kopiert</div>
    <script src="../../detail.js"></script>
  </body>
</html>`;
}

for (const game of games) {
  const directory = resolve("games", game.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), renderPage(game), "utf8");
}

console.log(`${games.length} statische Detailseiten erzeugt.`);
