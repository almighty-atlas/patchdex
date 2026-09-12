# Medienkonzept für PatchDex

## Ziel

Screenshots und Projektlogos sollen die Einträge wiedererkennbar machen, ohne den Eindruck einer offiziellen Pokémon-Plattform zu erzeugen. Im aktuellen MVP wird pro Spiel genau ein vorläufiges Motiv lokal gespeichert.

Für die aktuelle Auswahl wurden noch keine individuellen Nutzungserlaubnisse eingeholt. Die sichtbare Quellenangabe ist keine Lizenz. Jedes Motiv bleibt deshalb einzeln identifizierbar und muss auf Wunsch kurzfristig austausch- oder entfernbar sein.

## Bevorzugte Quellen

1. Projektseite, Repository oder Galerie des jeweiligen Entwicklerteams
2. ursprünglicher Release-Thread mit vom Team veröffentlichtem Material
3. klar benannte Galerie-/Archivseite als vorläufiger Fallback
4. nach Möglichkeit ein Medienpaket oder eine individuelle Freigabe des Teams

Die Oberfläche darf nie behaupten, ein Bild sei freigegeben, wenn nur seine Herkunft dokumentiert ist. Hotlinking wird vermieden; die Herkunftsseite oder direkte Originaldatei bleibt am Bild verlinkt. Suchergebnisse selbst gelten nicht als Bildquelle.

## Benötigte Metadaten

Für jedes Bild sollten zusammen mit der Datei festgehalten werden:

- Projekttitel
- Dateiname und lokaler Pfad
- Art: Logo, Screenshot oder Artwork
- Urheber beziehungsweise Entwicklerteam
- ursprüngliche Quell-URL
- Freigabestatus und gegebenenfalls Datum der Freigabe
- erlaubter Nutzungsumfang
- gewünschte Namensnennung
- optional Lizenz und Ablaufdatum

Fehlende Freigaben werden intern als „nicht angefragt“ behandelt. `mediaId` erlaubt die Entfernung des einzelnen Motivs, ohne den Spieleintrag zu löschen.

## Vorschlag für eine Freigabeanfrage

> Hi! I’m building PatchDex, a non-commercial editorial directory for Pokémon ROM hacks and fan games. PatchDex does not host ROMs or game files and links visitors to each project’s original page. May I use your project logo and up to three screenshots on its PatchDex entry? The images would be stored locally, credited to your team, and removed at any time on request. Please let me know which files and credit line you prefer.

Die Antwort sollte zusammen mit Datum und Quell-URL archiviert werden.

## Technische Aufbereitung

- Bilder lokal speichern, nicht von fremden Servern hotlinken
- Screenshots als AVIF und WebP erzeugen, Originaldatei intern behalten
- einheitliches Seitenverhältnis von 16:9 für Galerien
- Logos als freigestellte PNG/WebP oder freigegebenes SVG
- aussagekräftige Alternativtexte statt wiederholter Projekttitel
- Credit und Link unmittelbar an der Galerie anzeigen
- Medien pro Eintrag jederzeit über einen einzelnen Schalter deaktivierbar halten

## Entfernung und Korrektur

Jede Karte, Detailansicht und statische Detailseite verweist auf `/remove/`. Das Formular unterscheidet zwischen:

- nur Screenshot oder Logo entfernen
- vollständigen Spieleintrag entfernen
- Quelle oder Angaben korrigieren

Übergeben werden Spiel-Slug, konkrete Seiten-URL und bei Bildanfragen die eindeutige Medien-ID. Im Mockup wird der Antrag nur lokal gespeichert. Vor der Veröffentlichung muss in `site-config.js` eine erreichbare E-Mail-Adresse oder ein serverseitiger Formular-Endpunkt konfiguriert werden.

## Redaktioneller Einsatz

Ein Screenshot sollte eine im Text erklärte Besonderheit zeigen, etwa eine neue Region, ein Kampfsystem oder ein Interface. Bilder nur als Dekoration einzusetzen ist rechtlich und redaktionell schwächer als eine nachvollziehbare inhaltliche Einordnung.
