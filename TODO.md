# PatchDex – offene Todos

Stand: 12.09.2026

Dieses Dokument ist die zentrale Arbeitsliste für den Übergang vom statischen MVP zu einem öffentlichen Archiv. Erledigte MVP-Funktionen sind unten separat festgehalten; neue Aufgaben bitte hier ergänzen.

## 1. Hosting und Launch

- [ ] Vercel, Netlify und Cloudflare Pages/Workers Static Assets anhand von Kosten, Routing, Formular-Endpunkten, Datenschutz und Wartungsaufwand vergleichen und eine Hosting-Entscheidung treffen.
- [ ] Domain auswählen, DNS einrichten und HTTPS/Weiterleitungen prüfen.
- [ ] Produktionskanal für Entfernungsmeldungen konfigurieren: `removalEmail` oder `removalEndpoint` in `site-config.js`.
- [ ] Formular-Endpunkt gegen Spam und Missbrauch absichern (Rate-Limit, CAPTCHA/Turnstile, Größenlimits, Moderation).
- [ ] Deployment-Preview und reproduzierbaren Veröffentlichungsablauf dokumentieren.
- [ ] Security-Header für den gewählten Host prüfen und um CSP, Referrer-Policy und gegebenenfalls Permissions-Policy ergänzen.

## 2. Umfassende redaktionelle Suche

- [x] Eine erste umfassende Suche nach bekannten Pokémon-ROM-Hacks, GBA/GBC/NDS-Projekten und Fan-Games aus RPG Maker, Pokémon Essentials und Browser-Engines durchführen.
- [x] Quellen systematisch durchsuchen: Entwicklerseiten, Repositories, originale Release-Threads, Communities und etablierte Projektarchive.
- [x] Neue Einträge deduplizieren und Quellen nach Primärquelle priorisieren.
- [x] Pro neuem Spiel Name, Slug, Typ, Engine, Basis, Sprache, Status, Version, Tags, Kurzbeschreibung und Projekt-Link redaktionell prüfen.
- [x] Aktualisierungsdatum pro Datensatz pflegen, Quellenampel automatisch altern lassen und überfällige Prüfungen im Datencheck melden.
- [x] Deutsche und mehrsprachige Projekte über ein eigenes Sprachfeld und eigene Filter erfassen.
- [ ] Tag-Vokabular vollständig vereinheitlichen; erste interaktive Sammlungen für Story, QoL und neue Regionen sind umgesetzt.
- [x] Suchindex um normalisierte Schreibweisen, Slugs, Aliasnamen, Regionen, Entwickler, Quellentyp und Engine erweitern.

## 3. Bilder, Credits und Rechte

- [x] Für jedes Motiv Nutzungsstatus erfassen: angefragt, freigegeben, Creative-Commons-Lizenz, unklar oder entfernt.
- [ ] Entwicklerteams gezielt um Freigabe für Logo/Screenshot und gewünschte Namensnennung bitten.
- [ ] Nicht freigegebene Fallback-Motive nach Abstimmung durch freigegebenes Material oder neutrale eigene Cover ersetzen.
- [x] Medienmanifest mit Quelle, Abrufdatum, Urheber, Lizenz, lokaler Datei, Medien-ID und Änderungsverlauf führen.
- [ ] Entfernungskanal mit echter Zustellung, Eingangsbestätigung und internem Bearbeitungsstatus verbinden.
- [x] Verfahren für sofortiges Deaktivieren, Ersetzen und Wiederherstellen einzelner Bilder dokumentieren.

## 4. Barrierefreiheit

- [ ] Vollständige Prüfung mit Lighthouse, axe oder WAVE durchführen.
- [ ] Alle Funktionen ausschließlich per Tastatur testen: Navigation, Suche, Filter, Raster/Listenschalter, Dialoge, Teilen und Entfernungsmeldung.
- [x] Sichtbare Fokuszustände und Rückgabe des Fokus bei `<dialog>` implementieren; die native Fokusfalle bleibt Teil des manuellen Browsertests.
- [ ] Screenreader-Texte, Überschriftenhierarchie, Landmarken, Formularlabels, Fehlermeldungen und Statusmeldungen prüfen.
- [ ] Farbkontraste für Hell-/Dunkelmodus, Quellenampeln, Badges und Links nach WCAG testen.
- [ ] Zoom bis 200 Prozent, Textvergrößerung und reduzierte Bewegung prüfen.
- [x] Aussagekräftige Alt-Texte prüfen und neutrale Fallbacks bei deaktivierten Medien ergänzen.

## 5. Responsive Design und Geräteprüfung

- [ ] Layout und Interaktionen bei 320, 375, 768, 1024 und 1440+ Pixeln testen.
- [ ] Lange Titel, viele Tags, fehlende Bilder, unterschiedliche Logo-Seitenverhältnisse und sehr lange Quellenlabels testen.
- [ ] Raster-, Listen-, Filter-, Detail- und Entfernungsseiten auf kleinen Displays prüfen.
- [ ] Touch-Ziele, Scrollverhalten, sticky Elemente und Dialoge auf iOS Safari und Android Chrome testen.
- [ ] Desktop-Browser (Chrome, Firefox, Safari, Edge) und wichtige mobile Browser prüfen.
- [ ] Keine horizontale Überbreite, abgeschnittenen Buttons oder nicht erreichbaren Formulareingaben zulassen.

## 6. Qualität, Performance und SEO

- [x] Automatisierten Link-, Status-, Bild- und Detailseiten-Check in den Veröffentlichungsablauf aufnehmen.
- [x] Statische Seitengenerierung und Prüfung auf fehlende Medien-IDs im Build zusammenführen.
- [ ] Bildgrößen und Formate optimieren, ohne Logos/Screenshots sichtbar zu verschlechtern.
- [x] Auf Systemfonts umstellen und externe Font-Requests entfernen.
- [ ] `robots.txt`, `sitemap.xml`, Canonical-URLs und absolute Open-Graph-Bild-URLs für die spätere Domain ergänzen.
- [ ] Meta-Titel, Beschreibungen, strukturierte Daten und Social-Share-Vorschauen mit realen URLs testen.
- [ ] Core Web Vitals und Ladeverhalten auf langsamen Mobilverbindungen messen.

## 7. Betrieb und Pflege

- [x] Redaktionsworkflow für manuelle und optional KI-gestützte Pflege definieren: Recherche, Gegenprüfung, Freigabe, Veröffentlichung.
- [x] Änderungsprotokoll für Einträge, Bilder, Quellen und Entfernungsmeldungen anlegen.
- [x] Regelmäßige Linkprüfung und Warnungen für veraltete Quellen dokumentieren und skriptbar machen.
- [x] Backup-/Rollback-Strategie für Daten, Medien und generierte Detailseiten dokumentieren.
- [ ] Datenschutztext, Kontaktweg und Marken-/Haftungshinweise vor Veröffentlichung juristisch prüfen lassen; das Impressum bleibt bis zu einer bewussten Neubewertung aus der Oberfläche entfernt.

## Bereits im MVP erledigt

- 44 kuratierte Spieleinträge mit statischen, teilbaren Detailseiten.
- Suche, Filter, Sortierung, Merkliste, Dark Mode und ähnliche Spiele.
- „Sicher starten“-Hinweise und alternde Quellenampel.
- 44 lokale Motive für alle Spiele mit Quellenangabe, Medien-ID und einzelnem Deaktivierungsschalter.
- Entfernungspfad für Bild, Spieleintrag und Korrektur inklusive `enabled: false`-Schalter.
