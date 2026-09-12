# Redaktioneller Workflow

## 1. Recherchieren

Nur Entwicklerseiten, Entwickler-Repositories und ursprüngliche Release-Threads verwenden. ROM-Spiegel, Reuploads, vorgepatchte ROMs und Quellen ohne erkennbare Projektzuordnung ausschließen. Kandidaten anhand von Name, Entwicklerteam und Basis deduplizieren.

## 2. Gegenprüfen

Name, Typ, Engine, Basis, Sprache, Status und Version direkt an der Primärquelle prüfen. `reviewedAt` auf das tatsächliche Prüfdatum setzen. Unsichere Werte als „Laufend“ oder „In Entwicklung“ formulieren, nicht erraten. Tags aus dem bestehenden Vokabular wiederverwenden.

## 3. Medien freigeben

Neue Medien zunächst mit `rightsStatus: "unklar"` und `enabled: false` erfassen. Erlaubte Statuswerte sind `unklar`, `angefragt`, `freigegeben`, `creative-commons` und `entfernt`. Erst nach archivierter Zustimmung oder nachgewiesener kompatibler Lizenz darf `enabled: true` gesetzt werden. Urheber, Quelle, Abrufdatum, Lizenz und jede Statusänderung in `history` dokumentieren.

Freigabeanfragen verwenden den Text aus `MEDIA_POLICY.md`. Antworten werden außerhalb des öffentlichen Repositorys datenschutzgerecht archiviert; im Manifest steht nur der sachliche Freigabestatus.

## 4. Prüfen und veröffentlichen

```bash
npm run build
npm run check:links
```

Der Build erzeugt alle Detailseiten neu und prüft Pflichtfelder, eindeutige IDs/Slugs, Medienrechte, lokale Dateien, HTML-Grundstruktur und Quellenalter. Linkfehler müssen einzeln geprüft werden, da manche Communityseiten automatisierte Zugriffe blockieren.

## Medien deaktivieren, ersetzen und wiederherstellen

- Sofort deaktivieren: `enabled: false`, `rightsStatus: "entfernt"` und einen datierten `history`-Eintrag setzen; danach `npm run build`.
- Ersetzen: neue Datei und Quelle eintragen, `mediaId` erhöhen, Rechte erneut prüfen und die Änderung protokollieren.
- Wiederherstellen: nur mit dokumentierter Berechtigung `rightsStatus` auf `freigegeben` oder `creative-commons` und `enabled` auf `true` setzen.
- Die alte Datei nicht löschen, solange eine Anfrage oder ein Änderungsfall nachvollzogen werden muss. Sie bleibt deaktiviert und wird nicht ausgeliefert, sobald der spätere Produktions-Build Medienarchive ausschließt.

## Korrekturen und Entfernungsmeldungen

Lokale Entwürfe aus dem Browser sind kein Ticketsystem. Nach Konfiguration eines Empfangskanals erhält jede Meldung intern Eingangsdatum, Status (`neu`, `in-pruefung`, `erledigt`, `abgelehnt`), verantwortliche Person und Abschlussnotiz. Personenbezogene Inhalte gehören nicht ins Git-Repository.
