# Betrieb, Backup und Rollback

## Regelmäßige Pflege

- Discovery-PR und Quellenfehler bei Eingang prüfen; Betrieb und GitHub-Aktivierung siehe [DISCOVERY.md](DISCOVERY.md).
- Historische Import-Cursor und manuelle Quellen regelmäßig prüfen. Nach beendeten Katalogdurchläufen Wiederholungen einplanen.
- Ausgebliebene Actions-Läufe kontrollieren; ein abgeschalteter Zeitplan erzeugt selbst keine Fehlermeldung.

- Monatlich `npm run check:links` ausführen und echte 404/410-Antworten sofort prüfen.
- Vierteljährlich alle gelben Quellen, spätestens nach 270 Tagen alle roten Quellen manuell prüfen und `reviewedAt` aktualisieren.
- Vor jeder Veröffentlichung `npm run build` ausführen und die Änderungen der generierten Seiten mitprüfen.
- Änderungen in `CHANGELOG.md` mit Datum, betroffenen Slugs und Grund festhalten.

## Backup

Git ist die primäre Versionshistorie für Daten, Code und generierte Seiten. Vor größeren Daten- oder Medienänderungen einen eigenen Commit beziehungsweise einen Release-Tag erstellen. Private Freigaben und Entfernungsmeldungen getrennt, zugriffsbeschränkt und entsprechend einer noch festzulegenden Löschfrist sichern; niemals ins öffentliche Repository committen.

## Rollback

1. Den letzten bekannten guten Commit oder Release-Tag ermitteln.
2. Betroffene Daten gezielt aus diesem Stand wiederherstellen; keine fremden Arbeitsstände verwerfen.
3. `npm run build` ausführen.
4. Daten, Seiten und Links prüfen.
5. Rollback-Grund und betroffene Einträge in `CHANGELOG.md` dokumentieren.

Bei Rechteanfragen Medien nicht auf einen älteren, möglicherweise ebenfalls ungeklärten Stand zurückrollen. Stattdessen das neutrale Cover beibehalten.
