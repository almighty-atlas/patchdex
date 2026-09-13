const games = (Array.isArray(window.PATCHDEX_GAMES) ? window.PATCHDEX_GAMES : [])
  .map(game => {
    const media = window.PATCHDEX_MEDIA?.[game.slug];
    return {
      reviewedAt: "2026-09-12",
      ...game,
      ...(media?.enabled === false ? {} : media || {})
    };
  });
const gameGrid = document.querySelector("#gameGrid");
// New archive categories must stay filterable without manually changing HTML.
for (const key of ["type", "status", "language", "engine"]) {
  const inputs = [...document.querySelectorAll(`#filters input[name="${key}"]`)];
  const fieldset = inputs[0]?.closest("fieldset");
  for (const value of new Set(games.map(game => game[key]))) {
    if (!fieldset || inputs.some(input => input.value === value)) continue;
    const label = document.createElement("label");
    const input = document.createElement("input"); input.type = "checkbox"; input.name = key; input.value = value;
    const span = document.createElement("span"); span.textContent = value;
    const small = document.createElement("small"); small.dataset.count = `${key}:${value}`; small.textContent = "0";
    label.append(input, span, small); fieldset.append(label);
  }
}
const resultCount = document.querySelector("#resultCount");
const activeFilters = document.querySelector("#activeFilters");
const emptyState = document.querySelector("#emptyState");
const heroSearch = document.querySelector("#heroSearch");
const sideSearch = document.querySelector("#sideSearch");
const sortSelect = document.querySelector("#sortSelect");
const dialog = document.querySelector("#gameDialog");
const dialogContent = document.querySelector("#dialogContent");
const toast = document.querySelector("#toast");

let query = "";
let toastTimer;
let savedGames = new Set(readStorage("patchdex-saved", []));
let dialogTrigger = null;

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be blocked in private mode. */ }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function normalizeSearch(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("de");
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function getChecked(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function freshnessFor(game) {
  const ageInDays = Math.floor((Date.now() - new Date(`${game.reviewedAt}T00:00:00Z`).getTime()) / 86400000);
  if (ageInDays <= 90) return { level: "green", label: "Kürzlich geprüft" };
  if (ageInDays <= 270) return { level: "yellow", label: "Prüfung empfohlen" };
  return { level: "red", label: "Möglicherweise veraltet" };
}

function similarGames(game, limit = 3) {
  return games
    .filter(candidate => candidate.id !== game.id)
    .map(candidate => {
      const sharedTags = candidate.tags.filter(tag => game.tags.includes(tag)).length;
      const score = sharedTags * 4 + (candidate.type === game.type ? 2 : 0) + (candidate.engine === game.engine ? 1 : 0);
      return { ...candidate, similarity: score };
    })
    .filter(candidate => candidate.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity || b.featured - a.featured)
    .slice(0, limit);
}

function safeStartFor(game) {
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

function filteredGames() {
  const filterKeys = ["type", "status", "language", "engine"];
  const normalizedQuery = normalizeSearch(query);
  const result = games.filter(game => {
    const searchable = normalizeSearch([game.name, game.slug, game.description, game.base, game.engine, game.language,
      game.sourceKind, game.developer, game.region, ...(game.aliases || []), ...game.tags].join(" "));
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
    return filterKeys.every(key => {
      const selected = getChecked(key);
      return !selected.length || selected.includes(game[key]);
    });
  });

  const sort = sortSelect.value;
  result.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "de");
    if (sort === "source") return a.sourceKind.localeCompare(b.sourceKind, "de");
    return b.featured - a.featured;
  });
  return result;
}

function cardTemplate(game) {
  const statusClass = game.status === "Komplett" ? "" : game.status === "Demo" ? "demo" : "dev";
  const savedClass = savedGames.has(game.slug) ? " saved" : "";
  const shortName = game.name.replace("Pokémon ", "");
  const freshness = freshnessFor(game);
  const hasMedia = Boolean(game.image);
  return `
    <article class="game-card" data-id="${game.id}" tabindex="0" aria-label="Details zu ${escapeHtml(game.name)}">
      <div class="card-cover${hasMedia ? " has-media" : ""} cover-variant-${game.id % 4}" style="--card-color:${game.color}" data-symbol="${escapeHtml(game.symbol)}">
        ${hasMedia ? `<img class="cover-media fit-${game.imageFit}" src="${game.image}" alt="${escapeHtml(game.imageAlt)}" loading="lazy" decoding="async">` : ""}
        <span class="status-badge ${statusClass}">${game.status}</span>
        <button class="save-button${savedClass}" aria-label="${escapeHtml(game.name)} merken" title="Merken">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
        </button>
        ${hasMedia ? `<a class="media-credit" href="${game.imageSourceUrl}" target="_blank" rel="noopener noreferrer nofollow" title="Herkunft des Bildes öffnen">${escapeHtml(game.imageKind)} · Quelle ↗</a>` : `<div class="cover-wordmark"><small>${escapeHtml(game.base)} · ${game.engine}</small><strong>${escapeHtml(shortName)}</strong></div>`}
      </div>
      <div class="card-body">
        <div class="card-meta"><span>${game.type} · ${game.engine}</span><span class="freshness ${freshness.level}" title="Quelle geprüft am ${game.reviewedAt.split("-").reverse().join(".")}"><i></i>${freshness.label}</span></div>
        <h3>${escapeHtml(shortName)}</h3>
        <p>${escapeHtml(game.description)}</p>
        <div class="tags">${game.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    </article>`;
}

function render() {
  const result = filteredGames();
  gameGrid.innerHTML = result.map(cardTemplate).join("");
  resultCount.textContent = `${result.length} ${result.length === 1 ? "Ergebnis" : "Ergebnisse"}`;
  emptyState.hidden = result.length !== 0;
  gameGrid.hidden = result.length === 0;
  renderFilterPills();
}

function applyCollection(queryValue) {
  resetFilters();
  query = queryValue;
  heroSearch.value = queryValue;
  sideSearch.value = queryValue;
  render();
  document.querySelector("#catalog").scrollIntoView();
}

function renderFilterPills() {
  const checked = [...document.querySelectorAll("#filters input:checked")];
  const pills = [];
  if (query) pills.push(`<button data-query-pill>„${escapeHtml(query)}“ <b>×</b></button>`);
  pills.push(...checked.map(input => `<button data-filter-name="${input.name}" data-filter-value="${input.value}">${input.value} <b>×</b></button>`));
  activeFilters.innerHTML = pills.length ? pills.join("") : '<span class="all-pill">Alle Spiele</span>';
}

function updateOverview() {
  document.querySelector("#statTotal").textContent = games.length;
  document.querySelector("#statComplete").textContent = games.filter(game => game.status === "Komplett").length;
  document.querySelector("#statGerman").textContent = games.filter(game => game.language === "Deutsch").length;
  document.querySelector("#statSources").textContent = games.length;
  document.querySelectorAll("[data-count]").forEach(element => {
    const separator = element.dataset.count.indexOf(":");
    const key = element.dataset.count.slice(0, separator);
    const value = element.dataset.count.slice(separator + 1);
    element.textContent = games.filter(game => game[key] === value).length;
  });
  const tagValues = document.querySelectorAll(".float-tag span");
  tagValues[0].textContent = games.length;
  tagValues[1].textContent = new Set(games.map(game => game.sourceKind)).size;
  document.querySelector(".tag-two").lastChild.textContent = " Quellentypen geprüft";
}

function setGameInUrl(slug = "") {
  try {
    const url = new URL(window.location.href);
    slug ? url.searchParams.set("game", slug) : url.searchParams.delete("game");
    history.replaceState({}, "", url);
  } catch { /* Direct file previews may not expose History API. */ }
}

function openGame(game, updateUrl = true) {
  if (!game) return;
  if (!dialog.open) dialogTrigger = document.activeElement;
  const hasMedia = Boolean(game.image);
  const freshness = freshnessFor(game);
  const safeSteps = safeStartFor(game);
  const related = similarGames(game);
  dialogContent.innerHTML = `
    <div class="dialog-hero${hasMedia ? " has-media" : ""} cover-variant-${game.id % 4}" style="--card-color:${game.color}">
      ${hasMedia ? `<img class="dialog-media fit-${game.imageFit}" src="${game.image}" alt="${escapeHtml(game.imageAlt)}"><a class="dialog-media-credit" href="${game.imageSourceUrl}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(game.imageKind)} von ${escapeHtml(game.imageSourceLabel)} ↗</a>` : `<span>${escapeHtml(game.symbol)}</span><div class="dialog-wordmark"><small>PATCHDEX ARCHIVE</small><strong>${escapeHtml(game.name.replace("Pokémon ", ""))}</strong></div>`}
    </div>
    <div class="dialog-body">
      <div class="eyebrow"><span></span>${game.type} · ${game.engine}</div>
      <h2>${escapeHtml(game.name)}</h2>
      <p>${escapeHtml(game.description)}</p>
      <div class="dialog-info">
        <div><small>Status</small><strong>${game.status}</strong></div>
        <div><small>Version</small><strong>${escapeHtml(game.version)}</strong></div>
        <div><small>Basis</small><strong>${escapeHtml(game.base)}</strong></div>
        <div><small>Sprache</small><strong>${game.language}</strong></div>
        ${game.availability ? `<div><small>Verfügbarkeit</small><strong>${escapeHtml(game.availability)}</strong></div>` : ""}
      </div>
      <section class="safe-start">
        <div class="safe-start-title"><span>✓</span><div><small>SICHER STARTEN</small><strong>${game.type === "ROM-Hack" ? "Patch statt fertiger ROM" : game.engine === "Browser" ? "Direkt im Browser" : "Quelle vor Download prüfen"}</strong></div></div>
        <ol>${safeSteps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      </section>
      <div class="source-health"><span class="freshness ${freshness.level}"><i></i>${freshness.label}</span><small>Quelle geprüft am ${game.reviewedAt.split("-").reverse().join(".")}</small></div>
      <a class="external-link" href="${game.sourceUrl}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(game.sourceKind)} öffnen <span>↗</span></a>
      <a class="permalink" href="games/${game.slug}/">Statische Detailseite & Teilen <span>→</span></a>
      ${hasMedia ? `<div class="media-provenance"><span><b>Bildherkunft</b>${escapeHtml(game.imageSourceLabel)} · Medien-ID ${escapeHtml(game.mediaId)}</span><a href="${game.imageSourceUrl}" target="_blank" rel="noopener noreferrer nofollow">Bildquelle ↗</a></div>` : ""}
      <p class="dialog-note"><b>Quelle geprüft am 12.09.2026.</b> Externer Link · PatchDex hostet weder ROMs noch Spieldateien. Für ROM-Hacks wird üblicherweise eine legal erworbene Basisversion benötigt.</p>
      <a class="removal-link" href="remove/?game=${game.slug}&target=${hasMedia ? `image&media=${game.mediaId}` : "game"}">${hasMedia ? "Bild oder Spieleintrag" : "Spieleintrag"} entfernen lassen →</a>
      <section class="similar-section"><small>PASSEND DAZU</small><h3>Ähnliche Spiele</h3><div class="similar-grid">${related.map(candidate => `<button data-similar="${candidate.slug}"><i style="--similar-color:${candidate.color}">${escapeHtml(candidate.symbol)}</i><span><strong>${escapeHtml(candidate.name.replace("Pokémon ", ""))}</strong><small>${escapeHtml(candidate.tags.filter(tag => game.tags.includes(tag)).join(" · ") || candidate.type)}</small></span><b>→</b></button>`).join("")}</div></section>
    </div>`;
  if (!dialog.open) dialog.showModal();
  if (updateUrl) setGameInUrl(game.slug);
}

function closeDialog() {
  dialog.close();
  setGameInUrl();
  if (dialogTrigger?.isConnected) dialogTrigger.focus();
  dialogTrigger = null;
}

function openPolicy() {
  if (!dialog.open) dialogTrigger = document.activeElement;
  dialogContent.innerHTML = `
    <div class="submit-dialog-head info-dialog">
      <div class="eyebrow"><span></span>So arbeitet PatchDex</div>
      <h2>Redaktionsprinzipien</h2>
      <p>Wir erfassen Fanprojekte als unabhängiges, redaktionelles Verzeichnis. Ein Link ist keine Empfehlung zum Bezug urheberrechtlich geschützter Spieldateien.</p>
      <ul>
        <li>Wir hosten keine ROMs, vorgepatchten Spiele oder Emulator-Bundles.</li>
        <li>Wir bevorzugen Entwicklerseiten, Repositories und ursprüngliche Release-Threads.</li>
        <li>Versions- und Statusangaben erhalten ein sichtbares Prüfdatum.</li>
        <li>Reuploads und irreführende „offizielle“ Downloadseiten werden nicht aufgenommen.</li>
        <li>Rechteinhaber und Projektteams können Einträge prüfen oder melden.</li>
      </ul>
    </div>`;
  if (!dialog.open) dialog.showModal();
  setGameInUrl();
}

function openLegalDialog(kind) {
  if (!dialog.open) dialogTrigger = document.activeElement;
  dialogContent.innerHTML = `
    <div class="submit-dialog-head info-dialog">
      <div class="eyebrow"><span></span>Datenschutz im MVP</div>
      <h2>Datenschutz</h2>
      <p>PatchDex verwendet keine Analytics. Theme, Merkliste und lokale Entwürfe verbleiben im Local Storage des Browsers; die Website verwendet Systemschriften. „Spiel fehlt?“ führt zu GitHub: Dort eingereichte Vorschläge sind öffentlich und unterliegen den Datenschutzbedingungen von GitHub. Bitte dort keine privaten Kontaktdaten oder Freigabedokumente posten.</p>
    </div>`;
  if (!dialog.open) dialog.showModal();
  setGameInUrl();
}

function resetFilters() {
  document.querySelectorAll("#filters input:checked").forEach(input => input.checked = false);
  query = "";
  heroSearch.value = "";
  sideSearch.value = "";
  render();
}

document.querySelectorAll("#filters input").forEach(input => input.addEventListener("change", render));
sortSelect.addEventListener("change", render);
document.querySelector("#resetFilters").addEventListener("click", resetFilters);
document.querySelector("#emptyReset").addEventListener("click", resetFilters);

[heroSearch, sideSearch].forEach(input => input.addEventListener("input", event => {
  query = event.target.value.trim();
  const other = event.target === heroSearch ? sideSearch : heroSearch;
  other.value = event.target.value;
  render();
}));

document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    heroSearch.focus();
  }
});

document.querySelectorAll("[data-quick]").forEach(button => button.addEventListener("click", () => {
  const action = button.dataset.quick;
  resetFilters();
  if (action === "complete") document.querySelector('input[value="Komplett"]').checked = true;
  if (action === "german") document.querySelector('input[value="Deutsch"]').checked = true;
  if (action === "fakemon") { query = "Fakemon"; heroSearch.value = query; sideSearch.value = query; }
  render();
  document.querySelector("#catalog").scrollIntoView();
}));

gameGrid.addEventListener("click", event => {
  const saveButton = event.target.closest(".save-button");
  if (event.target.closest(".media-credit")) return;
  const card = event.target.closest(".game-card");
  if (!card) return;
  const game = games.find(entry => entry.id === Number(card.dataset.id));
  if (saveButton) {
    event.stopPropagation();
    savedGames.has(game.slug) ? savedGames.delete(game.slug) : savedGames.add(game.slug);
    writeStorage("patchdex-saved", [...savedGames]);
    saveButton.classList.toggle("saved", savedGames.has(game.slug));
    showToast(savedGames.has(game.slug) ? "Zur Merkliste hinzugefügt" : "Aus der Merkliste entfernt");
    return;
  }
  openGame(game);
});

gameGrid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("game-card")) {
    event.preventDefault();
    openGame(games.find(game => game.id === Number(event.target.dataset.id)));
  }
});

activeFilters.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-query-pill")) {
    query = ""; heroSearch.value = ""; sideSearch.value = "";
  } else {
    const input = document.querySelector(`input[name="${button.dataset.filterName}"][value="${button.dataset.filterValue}"]`);
    if (input) input.checked = false;
  }
  render();
});

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-view]").forEach(candidate => candidate.classList.toggle("active", candidate === button));
  document.querySelectorAll("[data-view]").forEach(candidate => candidate.setAttribute("aria-pressed", String(candidate === button)));
  gameGrid.classList.toggle("list-view", button.dataset.view === "list");
}));

document.querySelectorAll("[data-collection]").forEach(button => button.addEventListener("click", () => applyCollection(button.dataset.collection)));

document.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener("cancel", event => { event.preventDefault(); closeDialog(); });
dialogContent.addEventListener("click", event => {
  const similarButton = event.target.closest("[data-similar]");
  if (similarButton) openGame(games.find(game => game.slug === similarButton.dataset.similar));
});

const storedTheme = readStorage("patchdex-theme", "light");
document.body.classList.toggle("dark", storedTheme === "dark");
document.querySelector("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.querySelector("#themeButton").setAttribute("aria-pressed", String(document.body.classList.contains("dark")));
  writeStorage("patchdex-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

document.querySelector("[data-policy]").addEventListener("click", openPolicy);
document.querySelectorAll("[data-legal]").forEach(button => button.addEventListener("click", () => openLegalDialog(button.dataset.legal)));

updateOverview();
document.querySelector("#themeButton").setAttribute("aria-pressed", String(document.body.classList.contains("dark")));
render();

const requestedSlug = new URLSearchParams(window.location.search).get("game");
if (requestedSlug) openGame(games.find(game => game.slug === requestedSlug), false);
