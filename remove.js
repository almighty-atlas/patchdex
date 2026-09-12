const config = window.PATCHDEX_CONFIG || {};
const media = window.PATCHDEX_MEDIA || {};
const games = (window.PATCHDEX_GAMES || []).map(game => ({
  ...game,
  ...(media[game.slug]?.enabled === false ? {} : media[game.slug] || {})
}));
const form = document.querySelector("#removalForm");
const gameSelect = document.querySelector("#game");
const targetSelect = document.querySelector("#target");
const mediaInput = document.querySelector("#media");
const pageInput = document.querySelector("#page");
const success = document.querySelector("#removalSuccess");
const successText = document.querySelector("#successText");
let lastRequest = null;

function readDrafts() {
  try { return JSON.parse(localStorage.getItem("patchdex-removal-drafts")) || []; }
  catch { return []; }
}

function storeDraft(request) {
  try { localStorage.setItem("patchdex-removal-drafts", JSON.stringify([...readDrafts(), request])); }
  catch { /* Local storage may be disabled. */ }
}

function selectedGame() {
  return games.find(game => game.slug === gameSelect.value);
}

function syncReference() {
  const game = selectedGame();
  const isImage = targetSelect.value === "image";
  mediaInput.value = isImage && game ? game.mediaId : "";
  mediaInput.closest("label").hidden = !isImage;
  pageInput.value = game ? new URL(`../games/${game.slug}/`, window.location.href).href : "";
}

function requestText(request) {
  return [
    `PatchDex-Antrag: ${request.target}`,
    `Spiel: ${request.game}`,
    `Medien-ID: ${request.media || "–"}`,
    `Seite: ${request.page}`,
    `Name: ${request.name}`,
    `E-Mail: ${request.email}`,
    `Rolle: ${request.role}`,
    "",
    request.details,
    "",
    `Erstellt: ${request.submittedAt}`
  ].join("\n");
}

gameSelect.innerHTML += games
  .sort((a, b) => a.name.localeCompare(b.name, "de"))
  .map(game => `<option value="${game.slug}">${game.name}</option>`)
  .join("");

const params = new URLSearchParams(window.location.search);
if (["image", "game", "correction"].includes(params.get("target"))) targetSelect.value = params.get("target");
if (games.some(game => game.slug === params.get("game"))) gameSelect.value = params.get("game");
syncReference();

gameSelect.addEventListener("change", syncReference);
targetSelect.addEventListener("change", syncReference);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  lastRequest = { ...values, submittedAt: new Date().toISOString() };
  storeDraft(lastRequest);

  let sent = false;
  if (config.removalEndpoint) {
    try {
      const response = await fetch(config.removalEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastRequest)
      });
      sent = response.ok;
    } catch { sent = false; }
  } else if (config.removalEmail) {
    const subject = encodeURIComponent(`PatchDex: ${values.target} – ${values.game}`);
    const body = encodeURIComponent(requestText(lastRequest));
    window.location.href = `mailto:${config.removalEmail}?subject=${subject}&body=${body}`;
    sent = true;
  }

  form.hidden = true;
  success.hidden = false;
  successText.textContent = sent
    ? "Der konfigurierte Kontaktkanal wurde geöffnet beziehungsweise der Antrag wurde übermittelt. Eine lokale Kopie bleibt in diesem Browser gespeichert."
    : "Im Mockup wurde der Antrag als lokaler Entwurf gespeichert. Vor dem Launch muss noch ein Empfangskanal in site-config.js hinterlegt werden.";
});

document.querySelector("#copyRequest").addEventListener("click", async () => {
  if (!lastRequest) return;
  const toast = document.querySelector("#toast");
  try {
    await navigator.clipboard.writeText(requestText(lastRequest));
    toast.textContent = "Antrag kopiert";
  } catch {
    toast.textContent = "Kopieren nicht möglich";
  }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
});

const privacyDialog = document.querySelector("#privacyDialog");
document.querySelector("[data-privacy]").addEventListener("click", () => privacyDialog.showModal());
privacyDialog.querySelector(".dialog-close").addEventListener("click", () => privacyDialog.close());
privacyDialog.addEventListener("click", event => { if (event.target === privacyDialog) privacyDialog.close(); });
