const freshness = document.querySelector("[data-freshness]");
if (freshness) {
  const reviewedAt = document.querySelector("time[datetime]")?.dateTime;
  const ageInDays = Math.floor((Date.now() - new Date(`${reviewedAt}T00:00:00Z`).getTime()) / 86400000);
  const level = ageInDays <= 90 ? "green" : ageInDays <= 270 ? "yellow" : "red";
  const label = level === "green" ? "Kürzlich geprüft" : level === "yellow" ? "Prüfung empfohlen" : "Möglicherweise veraltet";
  freshness.className = `freshness ${level}`;
  freshness.querySelector("b").textContent = label;
}

document.querySelector("[data-share]")?.addEventListener("click", async event => {
  const title = event.currentTarget.dataset.title;
  const toast = document.querySelector("#toast");
  try {
    if (navigator.share) {
      await navigator.share({ title: `${title} – PatchDex`, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    toast.textContent = "Link kopiert";
  } catch (error) {
    if (error.name === "AbortError") return;
    toast.textContent = "Link konnte nicht kopiert werden";
  }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
});
