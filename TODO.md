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

- [ ] Eine umfassende Suche nach bekannten Pokémon-ROM-Hacks, GBA/GBC/NDS-Projekten und Fan-Games aus RPG Maker, Pokémon Essentials, Unity, Godot, Browser- und anderen Engines durchführen.
- [ ] Quellen systematisch durchsuchen: Entwicklerseiten, Repositories, originale Release-Threads, Communities und etablierte Projektarchive.
- [ ] Einträge deduplizieren, tote Projekte markieren und Quellen nach Primärquelle priorisieren.
- [ ] Pro Spiel Name, Slug, Typ, Engine, Basis, Sprache, Status, Version, Tags, Kurzbeschreibung und Projekt-Link redaktionell prüfen.
- [ ] Aktualisierungsdatum und Quellenampel regelmäßig erneuern; veraltete Versionen und tote Links kennzeichnen.
- [ ] Deutsche Übersetzungen und mehrsprachige Projekte separat erfassen.
- [ ] Tag-System vereinheitlichen und weitere kuratierte Sammlungen erstellen (Story, Schwierigkeit, neue Region, Fakemon, QoL, Multiplayer usw.).
- [ ] Suchindex erweitern: alternative Schreibweisen, Abkürzungen, Aliasnamen, Regionen, Entwickler und Engine durchsuchen.

## 3. Bilder, Credits und Rechte

- [ ] Für jedes Motiv Nutzungsstatus erfassen: angefragt, freigegeben, Creative-Commons-Lizenz, unklar oder entfernt.
- [ ] Entwicklerteams gezielt um Freigabe für Logo/Screenshot und gewünschte Namensnennung bitten.
- [ ] Nicht freigegebene Fallback-Motive durch freigegebenes Material oder neutrale eigene Cover ersetzen.
- [ ] Medienmanifest mit Quelle, Abrufdatum, Urheber, Lizenz, lokaler Datei, Medien-ID und Änderungsverlauf führen.
- [ ] Entfernungskanal mit echter Zustellung, Eingangsbestätigung und internem Bearbeitungsstatus verbinden.
- [ ] Verfahren für sofortiges Deaktivieren, Ersetzen und Wiederherstellen einzelner Bilder dokumentieren.

## 4. Barrierefreiheit

- [ ] Vollständige Prüfung mit Lighthouse, axe oder WAVE durchführen.
- [ ] Alle Funktionen ausschließlich per Tastatur testen: Navigation, Suche, Filter, Raster/Listenschalter, Dialoge, Teilen und Entfernungsmeldung.
- [ ] Fokuszustände, Fokusfalle und Rückgabe des Fokus bei `<dialog>` prüfen.
- [ ] Screenreader-Texte, Überschriftenhierarchie, Landmarken, Formularlabels, Fehlermeldungen und Statusmeldungen prüfen.
- [ ] Farbkontraste für Hell-/Dunkelmodus, Quellenampeln, Badges und Links nach WCAG testen.
- [ ] Zoom bis 200 Prozent, Textvergrößerung und reduzierte Bewegung prüfen.
- [ ] Aussagekräftige Alt-Texte für alle Screenshots/Logos und sinnvolle Fallbacks bei deaktivierten Medien ergänzen.

## 5. Responsive Design und Geräteprüfung

- [ ] Layout und Interaktionen bei 320, 375, 768, 1024 und 1440+ Pixeln testen.
- [ ] Lange Titel, viele Tags, fehlende Bilder, unterschiedliche Logo-Seitenverhältnisse und sehr lange Quellenlabels testen.
- [ ] Raster-, Listen-, Filter-, Detail- und Entfernungsseiten auf kleinen Displays prüfen.
- [ ] Touch-Ziele, Scrollverhalten, sticky Elemente und Dialoge auf iOS Safari und Android Chrome testen.
- [ ] Desktop-Browser (Chrome, Firefox, Safari, Edge) und wichtige mobile Browser prüfen.
- [ ] Keine horizontale Überbreite, abgeschnittenen Buttons oder nicht erreichbaren Formulareingaben zulassen.

## 6. Qualität, Performance und SEO

- [ ] Automatisierten Link-, Status-, Bild- und Detailseiten-Check in den Veröffentlichungsablauf aufnehmen.
- [ ] Statische Seitengenerierung nach jedem Datenupdate automatisieren und auf fehlende Medien-IDs prüfen.
- [ ] Bildgrößen und Formate optimieren, ohne Logos/Screenshots sichtbar zu verschlechtern.
- [ ] Fonts lokal ausliefern oder auf Systemfonts umstellen; externe Requests vor dem Launch minimieren.
- [ ] `robots.txt`, `sitemap.xml`, Canonical-URLs und absolute Open-Graph-Bild-URLs für die spätere Domain ergänzen.
- [ ] Meta-Titel, Beschreibungen, strukturierte Daten und Social-Share-Vorschauen mit realen URLs testen.
- [ ] Core Web Vitals und Ladeverhalten auf langsamen Mobilverbindungen messen.

## 7. Betrieb und Pflege

- [ ] Redaktionsworkflow für manuelle und optional KI-gestützte Pflege definieren: Recherche, Gegenprüfung, Freigabe, Veröffentlichung.
- [ ] Änderungsprotokoll für Einträge, Bilder, Quellen und Entfernungsmeldungen führen.
- [ ] Regelmäßige Linkprüfung und Erinnerungen für veraltete Quellen einrichten.
- [ ] Backup-/Rollback-Strategie für Daten, Medien und generierte Detailseiten dokumentieren.
- [ ] Datenschutztext, Kontaktweg und Marken-/Haftungshinweise vor Veröffentlichung juristisch prüfen lassen; das Impressum bleibt bis zu einer bewussten Neubewertung aus der Oberfläche entfernt.

## Bereits im MVP erledigt

- 27 kuratierte Spieleinträge mit statischen, teilbaren Detailseiten.
- Suche, Filter, Sortierung, Merkliste, Dark Mode und ähnliche Spiele.
- „Sicher starten“-Hinweise und alternde Quellenampel.
- Ein lokales Motiv pro Spiel mit sichtbarer Quellenangabe und Medien-ID.
- Entfernungspfad für Bild, Spieleintrag und Korrektur inklusive `enabled: false`-Schalter.
