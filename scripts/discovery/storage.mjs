import { readFile, writeFile, rename, mkdir, rmdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const readJson = async path => JSON.parse(await readFile(resolve(root, path), "utf8"));
export async function acquireLock() {
  await mkdir(resolve(root, ".discovery-tmp"), { recursive: true });
  const lock = resolve(root, ".discovery-tmp/lock");
  try { await mkdir(lock); } catch (error) {
    if (error.code === "EEXIST") throw new Error("Ein anderer Discovery-Schreibvorgang läuft. Nach einem Abbruch ggf. das leere Verzeichnis .discovery-tmp/lock entfernen.");
    throw error;
  }
  return () => rmdir(lock);
}
export async function writeJson(path, data) {
  const target = resolve(root, path);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { flag: "wx" });
  await rename(temporary, target);
}
export async function loadGames() {
  globalThis.window = {};
  await import(`../../games-reviewed.js?load=${Date.now()}`);
  await import(`../../games-data.js?load=${Date.now()}`);
  return window.PATCHDEX_GAMES;
}
