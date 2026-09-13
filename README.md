# PatchDex

Ein responsiver, statischer MVP für ein redaktionelles Verzeichnis von Pokémon-ROM-Hacks und Fan-Games. PatchDex hostet keine ROMs oder Spieldateien, sondern verlinkt zu Projektseiten, Entwickler-Repositories und ursprünglichen Community-Threads.

## Lokal ausprobieren

Die `index.html` kann direkt im Browser geöffnet werden. Für das vollständige Verhalten inklusive teilbarer Detail-URLs empfiehlt sich ein lokaler Server:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## Stand des MVP

- 44 kuratierte Einträge in `games-data.js`
- Suche über Titel, Beschreibung, Basis, Sprache und Tags
- Facettenfilter mit automatisch berechneten Zählern
- redaktionelle Sortierung und A–Z-Sortierung
- Detailansicht mit Quellentyp, Version und Prüfdatum
- 44 lokal gespeicherte Vorschaubilder mit Herkunftsseite, eigener Medien-ID und dokumentiertem Rechtestatus
- automatisch alternde Quellenampel und „Sicher starten“-Hinweise
- tagbasierte Empfehlungen für ähnliche Spiele
- 44 statisch erzeugte, teilbare Detailseiten mit strukturierten Daten
- echte externe Links mit `nofollow`, `noopener` und `noreferrer`
- persistente Merkliste und Dark Mode via Local Storage
- Raster- und Listenansicht mit allen passenden Treffern
- responsive Oberfläche und Reduced-Motion-Unterstützung
- grundlegende Security-Header für das Deployment
- vorbereiteter Entfernungsworkflow für einzelne Bilder, vollständige Spieleinträge und Korrekturen

## Daten pflegen

Neue Funde werden zunächst in `discovery/inbox.json` gesammelt. Nach Prüfung übernimmt `discovery:review approve` sie nach `games-reviewed.js`; `games-data.js` bleibt der Ausgangsbestand. Jeder Datensatz benötigt eine eindeutige `id` und `slug`. Für `sourceUrl` sind nur folgende Ziele vorgesehen:

1. Seite des Entwicklerteams
2. Repository des Entwicklerteams
3. ursprünglicher Release-/Community-Thread

ROM-Spiegel, vorgepatchte ROMs, Reuploads und SEO-Downloadseiten werden nicht aufgenommen. Version, Status und Link sollten bei jeder Änderung erneut geprüft werden. Erfundenen Community-Bewertungen werden bewusst nicht angezeigt.

Nach Änderungen am Datenbestand werden die Detailseiten neu erzeugt:

```bash
node generate-pages.mjs
```

Der reproduzierbare Gesamtcheck läuft mit `npm run build`; externe Projektlinks lassen sich separat mit `npm run check:links` prüfen. Redaktion, Medienrechte, Qualität und Betrieb sind in [EDITORIAL_WORKFLOW.md](EDITORIAL_WORKFLOW.md), [QA.md](QA.md) und [OPERATIONS.md](OPERATIONS.md) dokumentiert. Änderungen werden in [CHANGELOG.md](CHANGELOG.md) festgehalten.

Bilddatei, Herkunft, Medien-ID und Darstellungsart werden getrennt in `media-data.js` gepflegt. `enabled: false` im Medienobjekt deaktiviert ein Motiv sofort; nach `node generate-pages.mjs` nutzen auch die statischen Seiten wieder das neutrale Cover. Für Screenshots, Logos, Freigaben und Credits gilt das dokumentierte [Medienkonzept](MEDIA_POLICY.md).

Der Entfernungsworkflow unter `/remove/` speichert im Mockup lokale Entwürfe. Vor dem Launch wird in `site-config.js` entweder `removalEmail` oder `removalEndpoint` gesetzt.

## Automatische Entdeckung

Quellenregister, Eingangsliste, historische Importe, Dublettenprüfung und Freigabe sind in [DISCOVERY.md](DISCOVERY.md) beschrieben. Der aktuelle Eingang steht in [discovery/REPORT.md](discovery/REPORT.md). Neue Funde werden niemals ungeprüft veröffentlicht. Der vorbereitete GitHub-Workflow sammelt täglich und erstellt einen Vorschlags-PR; Aktivierung und nötige Repository-Rechte siehe Anleitung.

Für die Entwicklungswerkzeuge Node.js 22+ und einmalig `npm ci --ignore-scripts` verwenden. `npm test` prüft Sammler, Zugriffsschutz und den Übernahmeweg; `npm run build` prüft auch das Quellenregister und den Eingang.

## Cloudflare deployen

Die enthaltene `wrangler.jsonc` konfiguriert Cloudflare Workers Static Assets. Nach Installation beziehungsweise Anmeldung bei Wrangler:

```bash
npx wrangler deploy
```

Für Git-basiertes Deployment kann das Repository alternativ im Cloudflare-Dashboard importiert werden. Es ist kein Build-Befehl erforderlich; das Projektverzeichnis ist das Asset-Verzeichnis.

## Nächste Produktionsschritte

Die vollständige, nach Launch-, Recherche-, Medien-, Barrierefreiheits-, Responsive-, Qualitäts- und Betriebsaufgaben sortierte Arbeitsliste steht in [TODO.md](TODO.md).

Die Beschreibungen sind redaktionelle Kurzfassungen. Pokémon und zugehörige Marken gehören ihren jeweiligen Rechteinhabern; PatchDex ist nicht mit Nintendo, Game Freak, Creatures oder The Pokémon Company verbunden.
