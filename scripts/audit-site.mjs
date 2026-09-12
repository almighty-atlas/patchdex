import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const errors = [];
const rootHtml = await readFile("index.html", "utf8");
const removalHtml = await readFile("remove/index.html", "utf8");
const directories = await readdir("games", { withFileTypes: true });
const pages = [
  ["index.html", rootHtml],
  ["remove/index.html", removalHtml],
  ...(await Promise.all(directories.filter(item => item.isDirectory()).map(async item => {
    const path = resolve("games", item.name, "index.html");
    return [path, await readFile(path, "utf8")];
  })))
];

for (const [path, html] of pages) {
  for (const marker of ["<title>", "name=\"description\"", "name=\"viewport\""]) if (!html.includes(marker)) errors.push(`${path}: ${marker} fehlt`);
  if (!html.includes("<main")) errors.push(`${path}: main-Landmarke fehlt`);
  if (/<img(?![^>]*\balt=)[^>]*>/i.test(html)) errors.push(`${path}: Bild ohne alt-Attribut`);
  if (/<a[^>]*target=\"_blank\"(?![^>]*rel=)[^>]*>/i.test(html)) errors.push(`${path}: externer Link ohne rel`);
}

if (!rootHtml.includes('aria-live="polite"')) errors.push("index.html: Ergebnisstatus ist keine Live-Region");
if (!removalHtml.includes('aria-live="polite"')) errors.push("remove/index.html: Formularstatus ist keine Live-Region");

if (errors.length) {
  errors.forEach(error => console.error(`FEHLER: ${error}`));
  process.exit(1);
}
console.log(`${pages.length} HTML-Seiten strukturell geprüft.`);
