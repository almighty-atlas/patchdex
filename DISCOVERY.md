# Spiele entdecken und übernehmen

Patchdex trennt **Entdeckung**, **Prüfung** und **Veröffentlichung**. Ein Fund ist kein veröffentlichtes Spiel.
Die Website lädt nur `games-data.js` und die geprüften Ergänzungen/Korrekturen in `games-reviewed.js`.
Der Sammler lädt keine ROMs, Spieledateien oder Bilder und führt keine Quelleninhalte aus.

## Archivumfang

Ziel ist ein möglichst vollständiges Metadatenverzeichnis, kein Downloadarchiv. Auch Demos,
unveröffentlichte und eingestellte Projekte gehören hinein. Fehlende Bilder erhalten neutrale Cover.
Unbekannte Metadaten bleiben `Unbekannt`; ein toter Link beweist keine eingestellte Entwicklung.
Archivaufnahme und Empfehlung sind getrennt: Entwürfe starten mit `featured: 0`.

Übersetzungen, Forks, Remakes und Nachfolger können eigene Einträge mit `relations` erhalten.
Umbenennungen desselben Projekts gehören in `aliases`; Slug und ID bleiben bei Korrekturen erhalten.
Ein Release ist normalerweise ein Update, kein zusätzliches Spiel.

Globale Vollständigkeit lässt sich nicht nachweisen. Ein beendeter Katalogdurchlauf umfasst nur
die betreffende Quelle zum Abrufzeitpunkt. Einträge können währenddessen zwischen Seiten wandern;
wiederholte Durchläufe und Communitymeldungen bleiben notwendig.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `discovery/sources.json` | Adapter, Intervalle, Zugangshinweise und historischer Umfang |
| `discovery/inbox.json` | Kandidaten-IDs, Belege, Fingerprints, Zuordnungsvorschläge und Entscheidungen |
| `discovery/state.json` | Letzte Versuche/Erfolge, Fehlerzähler und historischer Import-Cursor |
| `discovery/REPORT.md` | Lesbare Eingangsliste und Quellenzustand |
| `games-reviewed.js` | Ausschließlich freigegebene Ergänzungen und Korrekturen |

## Quellen und Grenzen

- **PokéCommunity:** RSS des ROM Hacks Showcase, am 13.09.2026 erfolgreich getestet. Der Feed ist
  kein vollständiger Bestand. Die historische Forenliste lieferte HTTP 403 und bleibt manuell.
  Geänderte Titel/Auszüge lösen Prüfhinweise aus, veränderte Zeitstempel allein nicht.
- **Whack a Hack:** Öffentlicher Katalog mit fortsetzbarem Seitenimport. Kataloglinks sind zunächst
  Entdeckungsbelege; bei der Freigabe den ursprünglichen Projektbeleg prüfen. Täglich wird die erste
  Seite geprüft und der historische Import um bis zu drei Seiten fortgesetzt. Ältere Seiten werden
  nach Abschluss nicht automatisch erneut durchlaufen.
- **GitHub:** Release-API für Repositories, die bereits als `sourceUrl` im geprüften Archiv stehen.
  Bis zu 100 jüngste Releases pro Projekt, kein vollständiges historisches Versionsarchiv.
  Der erste Lauf findet auch alte Releases. Keine allgemeine GitHub-Projektsuche.
- **Eevee Expo:** Drei manuelle Bereiche für veröffentlichte, fertige und entwickelte Projekte.
  robots.txt verbietet allgemeinen Bots den Abruf. Automatisierung benötigt eine Betreiberfreigabe
  und angepasste Zugangsregeln; kein Identitätswechsel auf einen erlaubten fremden Bot.
- **Reddit:** Manuell, bis geeigneter API-Zugang und Nutzungsbedingungen geklärt sind.
- **Community:** Das GitHub-Issue-Formular im Website-Footer erzeugt öffentliche `[Spiel]`-Issues.
  Diese werden als Kandidaten eingelesen. Höchstens zehn API-Seiten je Lauf; ein erreichtes Limit
  ist ein Fehler, kein Vollständigkeitsnachweis. Eingereichte Projekt-URLs werden nicht automatisch
  abgerufen. Autorenprofile und Kommentare werden nicht gespeichert.

Website-Abrufe prüfen robots.txt; mindestens 1,5 Sekunden Abstand pro Domain, Crawl-delay bis zehn
Sekunden (sonst sichtbarer Abbruch), 20 Sekunden Timeout, 3 MB Antwortlimit. Weiterleitungen und
403/429/5xx werden gemeldet, nicht umgangen. GitHub nutzt die offizielle API. Zugangshinweise ersetzen
keine Lizenzprüfung. Bei neuen Quellen Bedingungen gesondert prüfen.

## Sammeln und historischen Bestand erfassen

Node.js 22 oder neuer:

```bash
npm ci --ignore-scripts
npm run discovery:scan
npm run discovery:review -- list
npm run discovery:report
npm run discovery:scan -- --source pokecommunity
npm run discovery:scan -- --source whackahack --backfill --max-pages 3
```

Der historische Lauf setzt bei `state.whackahack.backfill.nextUrl` fort. Fehler verschieben den Cursor
nicht. Für einen erneuten Durchlauf nach Abschluss den `backfill`-Zustand bewusst auf
`{"nextUrl":"https://whackahack.com/juegos/","pages":0,"complete":false}` setzen; Git bewahrt den alten
Stand. Bekannte URLs werden erneut verglichen, nicht doppelt aufgenommen.

Sammler und Redaktion dürfen nicht gleichzeitig schreiben. `.discovery-tmp/lock` schützt davor.
Nach hartem Abbruch zuerst sicherstellen, dass kein Lauf aktiv ist; erst dann das leere Verzeichnis
mit `rmdir .discovery-tmp/lock` entfernen. Nicht parallel in verschiedenen Worktrees am Eingang arbeiten.

## Manuelle Funde

JSON-Liste mit höchstens 1000 Funden vorbereiten. `title` und echte öffentliche HTTPS-`url` sind
Pflicht; `excerpt` (kurzer sachlicher Hinweis), `aliases`, `developer` und `base` optional.
Teilen mehrere Spiele dieselbe Entwickler-Landingpage, pro Spiel einen eigenen stabilen `projectKey`
(z. B. `pokemon-anil`) mitgeben. So führt die gemeinsame URL nicht zu einer falschen Zusammenlegung.
Keine vollständigen Projektbeschreibungen oder privaten Kontaktdaten übernehmen.

```bash
npm run discovery:review -- import --source eevee-released --file /pfad/funde.json
```

Gleiche normalisierte URLs werden zusammengeführt. Namen, Aliasnamen, Titelähnlichkeiten, Release-Links
und Entwickler/Basis liefern nur Zuordnungsvorschläge. Übersetzungen nicht als Dubletten verwerfen.

## Freigabe

Die echte Kandidaten-ID aus der Eingangsliste verwenden; Entwurfsdateien werden nicht überschrieben:

```bash
npm run discovery:review -- draft --id candidate-ID --out .discovery-tmp/spiel.json
```

Bei einem Update ausdrücklich ein bestehendes Zielspiel angeben:

```bash
npm run discovery:review -- draft --id candidate-ID --target pokemon-unbound --out .discovery-tmp/update.json
```

Im Entwurf:

1. Projektquelle öffnen und Identität, Titel, Status und Version gegenprüfen.
2. `review.reviewer` (öffentliches Redaktionskürzel), tatsächliches `reviewedAt`, Prüfnotiz und
   `evidence` mit überprüften Links ausfüllen. Die veröffentlichte `sourceUrl` muss darin stehen.
3. Slug, Beschreibung und mindestens einen belegten Tag ergänzen; Unbekanntes nicht erraten.
4. Dubletten prüfen. Varianten gegebenenfalls mit `relations` verknüpfen, z. B.
   `{"kind":"translation-of","slug":"pokemon-unbound"}`. Zulässig sind außerdem `fork-of`, `remake-of`,
   `successor-of`. Verfügbarkeit und Entwicklungsstatus getrennt angeben.
5. Bilder separat gemäß `MEDIA_POLICY.md` behandeln. Kein Bild ist kein Aufnahmehindernis.

```bash
npm run discovery:review -- approve --file .discovery-tmp/spiel.json
npm test
npm run build
```

`approve` schreibt lokal nach `games-reviewed.js`, protokolliert die Prüfung und markiert den Fund
als `adopted`. Kein automatischer Commit, Push oder Merge. Ein veränderter Quellen-Fingerprint
macht alte Entwürfe ungültig: neu erstellen und nochmals prüfen. Quellenänderungen öffnen bereits
übernommene Funde erneut, verändern aber niemals selbstständig veröffentlichte Spiele.

Danach geprüfte Daten und generierte Seiten in einem redaktionellen Commit/PR freigeben.
Korrekturen überschreiben den Ausgangsbestand gezielt nach Slug.

Dublette oder Ausschluss begründen:

```bash
npm run discovery:review -- resolve --id candidate-ID --status duplicate --target pokemon-unbound --note "Dasselbe Projekt, anderer Release."
npm run discovery:review -- resolve --id candidate-ID --status excluded --note "Werkzeug, kein eigenständiges Spiel."
```

Weitere Zustände: `new`, `reviewing`. `adopted` ist nur über die Freigabe erreichbar. Ausschlüsse und
Dubletten bleiben bei erneuten Funden erhalten; Änderungen werden dennoch markiert.

## GitHub aktivieren

Nach Push auf `main`:

1. GitHub Actions und Issues aktivieren.
2. Unter **Settings → Actions → General → Workflow permissions** Pull-Request-Erstellung durch
   GitHub Actions erlauben. Der Workflow benötigt `contents: write`, `pull-requests: write` und
   `issues: read`. Organisationseinstellungen können diese Berechtigungen begrenzen.
3. **Actions → Discover games → Run workflow** ausführen und den ersten Lauf prüfen.

Täglicher Termin: 06:23 UTC. Der Workflow testet, sammelt, setzt den historischen Import fort und
aktualisiert einen PR auf `automation/discovery`. Ein offener PR wird weiterverwendet. `main` wird
normal in diesen Branch gemergt; Konflikte stoppen den Lauf. Kein Force-Push, kein automatisches Merge.
Der Discovery-PR veröffentlicht keine Spiele; redaktionelle Freigaben erfolgen separat.

Quellenfehler erscheinen im Report und als Workflow-Warnung; erfolgreiche Teilergebnisse bleiben
im PR erhalten. Der Lauf schlägt nur bei technischen Fehlern außerhalb einzelner Quellen fehl, etwa
bei ungültigen Daten, fehlenden PR-Rechten oder Mergekonflikten. Actions-Mitteilungen
aktivieren und die letzte Laufzeit prüfen: Zeitpläne können sich verzögern oder bei Inaktivität
deaktiviert werden. Ein ganz ausgebliebener Lauf kann sich nicht selbst melden; dafür wäre ein
unabhängiger Watchdog erforderlich. `discovery:report` berechnet veraltete Quellen beim Aufruf neu.

## Referenzen

- [GitHub: Zeitpläne](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub: Release-API](https://docs.github.com/en/rest/releases/releases)
- [GitHub: Issue-Formulare](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Cheerio](https://cheerio.js.org/docs/basics/loading/), [robots-parser](https://github.com/samclarke/robots-parser)
