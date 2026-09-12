# Qualitäts- und Geräteprüfung

Stand: 12.09.2026

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
