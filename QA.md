# Qualitäts- und Geräteprüfung

Stand: 13.09.2026

## Discovery-Prüfung am 13.09.2026

- `npm test`: 21 Tests für RSS/Atom/HTML, URL-Sicherheit, robots.txt, Dubletten, Teilfehler, Wiederholungen, historische Fortsetzung, Issue-Einreichungen und Freigabe.
- End-to-End in einem temporären Repository: Import → Entwurf → Freigabe → bildlose statische Detailseite. Keine Testspiele im echten Katalog.
- Live-Abrufe: PokéCommunity-RSS, Whack-a-Hack-Katalog und GitHub-APIs erfolgreich. Drei historische Katalogseiten erfasst; 163 Funde insgesamt, einschließlich alter Release-Hinweise und möglicher Dubletten.
- Lokaler Chrome-Headless-Test: weiterhin 44 öffentliche Spiele/44 Bilder und Einreichungslink. Isolierter Testeintrag mit neutralem Cover, neuen Filtern, Verfügbarkeit im Dialog und Auswahl im Entfernungsformular erfolgreich.
- `npm run build`, YAML-Syntaxprüfung und `git diff --check` erfolgreich. Remote-Actions/PR-Erstellung erst nach Push und Freigabe der Repository-Berechtigungen prüfbar.

## Automatisiert geprüft

- Datenfelder, Wertebereiche, eindeutige IDs und Slugs
- Existenz aller 44 Detailseiten und lokalen Medienarchive
- Warnung für aktive Medien mit ungeklärtem Nutzungsstatus
- Grundlegende HTML-Landmarken, Meta-Beschreibungen, Viewports, Alt-Texte und sichere externe Links
- Fokusmarkierungen, Skip-Link, Live-Regionen und Zustände der Ansichtsumschaltung
- Reduced-Motion-Regel und responsive Breakpoints bei 1000, 780/760, 520/500 und 430 Pixeln
- Keine Google-Font-Anfragen; Systemschriften werden lokal verwendet

## Manuelle Testmatrix vor Veröffentlichung

| Bereich | 320 | 375 | 768 | 1024 | 1440 | Tastatur | Screenreader |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Startseite/Suche | offen | offen | offen | offen | offen | offen | offen |
| Filter/Raster/Liste | offen | offen | offen | offen | offen | offen | offen |
| Detaildialog | offen | offen | offen | offen | offen | offen | offen |
| Statische Detailseite | offen | offen | offen | offen | offen | offen | offen |
| Entfernungsformular | offen | offen | offen | offen | offen | offen | offen |

Zusätzlich bei 200 Prozent Zoom, mit reduzierter Bewegung, iOS Safari, Android Chrome sowie aktuellen Versionen von Chrome, Firefox, Safari und Edge testen. Dabei horizontale Überbreite, abgeschnittene Texte, Touch-Ziele, Sticky-Elemente, Dialogfokus und Fehlermeldungen kontrollieren.

Lighthouse, axe/WAVE und Core Web Vitals benötigen einen realen Browser und eine veröffentlichungsnahe URL. Diese Messungen bleiben deshalb bis zur Preview offen; Ergebnisse werden hier mit Browser-, Geräte- und Datumsangabe ergänzt.
