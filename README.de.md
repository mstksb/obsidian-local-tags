# Local Tags

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

Local Tags ergänzt Obsidian um dateilokale `##tags`. So können Sie denselben Tag-Namen in verschiedenen Notizen verwenden, ohne deren Vervollständigungsvorschläge oder Tag-Listen zu vermischen.

Veröffentlichte Pakete finden Sie unter [Releases](https://github.com/mstksb/obsidian-local-tags/releases). Sie können **Local Tags** auch über **Settings → Community plugins → Browse** in Obsidian installieren.

## Funktionen

- Schreiben Sie Tags wie `##project` und hierarchische Tags wie `##people/Alex`.
- Vervollständigen Sie Tag-Namen aus der aktuellen Markdown-Datei.
- Zeigen Sie notizbezogene Tag-Beschreibungen neben Vervollständigungsvorschlägen und in Tooltips in der Notiz und im Tag-Panel an.
- Wählen Sie zwischen Teilzeichenfolgen- und Präfixsuche für die Vervollständigung, auf Wunsch mit Beachtung der Groß- und Kleinschreibung.
- Zeigen Sie Tags in Source mode, Live Preview und Reading View an.
- Durchsuchen Sie die Tags der aktuellen Datei in einem hierarchischen Panel und filtern Sie die Liste sofort nach Namen oder Beschreibung.
- Klicken Sie auf einen Tag im Panel, um seinen Text innerhalb der aktuellen Datei zu suchen.
- Klicken Sie bei gedrückter Umschalttaste auf einen Tag, um seine Vorkommen nacheinander aufzurufen; eine Zeilenhervorhebung und ein Rahmen um den passenden Tag markieren die Position.
- Passen Sie gemeinsame Text- und Hintergrundfarben, Hervorhebungen und vertikale Innenabstände in den Plugin-Einstellungen an.
- Speichern Sie Text-, Hintergrund- und Rahmenfarben sowie Fett-, Unterstreichungs- und Kursivformatierung pro Notiz unter `local-tags-config`, mit Vererbung von übergeordneten an untergeordnete Tags.
- Ergänzen Sie fehlende Einstellungen, entfernen Sie leere Einstellungen, erzeugen Sie kräftige Komplementärfarben, sortieren Sie Definitionen und klappen Sie die Konfiguration über das Tag-Panel bis zu den Tag-Überschriften auf.
- Bearbeiten Sie Konfigurationsfarben über eingebettete Farbfelder in Source mode und Live Preview und prüfen Sie Konfigurationsfehler im Panel.
- Blenden Sie `##` bei Bedarf in Reading View und bei inaktiven Tags in Live Preview aus.

## Beispiele in Aktion

Vervollständigung, hierarchische Tag-Listen und die Suche per Klick folgen den vertrauten Interaktionen mit Tags. Local Tags ergänzt einen eigenen Tag-Bestand pro Notiz, zufällige Formatierungen pro Notiz und die Navigation per Umschaltklick.

### Tag-Liste während der Eingabe filtern

Geben Sie Text in **Search tags** ein, um die Tag-Liste der aktuellen Notiz sofort einzugrenzen. Über die Kontrollkästchen **Tag name** und **Summary** suchen Sie nach Namen, Beschreibungen oder beidem. Die Suche ignoriert die Groß- und Kleinschreibung und lässt übergeordnete Tags passender Einträge sichtbar. Leeren Sie die Suche, um die vollständige Liste wiederherzustellen. Einzelheiten finden Sie unter [Suche im Tag-Panel](docs/usage.de.md#tag-panel-search).

![Suchtexteingabe und Wechsel zwischen Tag-Namen- und Beschreibungsfiltern im Tag-Panel](assets/demos/tag-panel-search.gif)

### Tags während der Eingabe vervollständigen

Geben Sie `##` ein, grenzen Sie die Vorschläge ein und drücken Sie Enter, um einen Tag einzufügen. Die Vorschläge stammen aus der aktuellen Markdown-Datei. Bei der Teilzeichenfolgensuche findet `##rev` den Tag `##launch/review`.

![Eingabe eines Teilnamens, Auswahl eines Vervollständigungsvorschlags und Einfügen des vollständigen Tags](assets/demos/completion.gif)

### Tags auf die jeweilige Notiz beschränken

Wechseln Sie von „Launch plan“ zu „Garden plan“: Sowohl die Vervollständigungsvorschläge als auch das Tag-Panel folgen der aktiven Notiz. Standardmäßige `#tags` werden im gesamten Vault indexiert. Lokale `##tags` bilden in jeder Datei einen eigenen Tag-Bestand.

![Beim Wechsel der Notiz ändern sich die lokale Tag-Liste und die Vervollständigungsvorschläge](assets/demos/file-local-tags.gif)

### Tag-Bedeutungen griffbereit halten

Ergänzen Sie unter `local-tags-config` eine kurze Beschreibung auf derselben Zeile nach einer Tag-Deklaration. Die Beschreibungen erscheinen neben Vervollständigungsvorschlägen und beim Zeigen auf einen Tag in der Notiz oder im Tag-Panel. Mit Enter fügen Sie nur den Tag ein. Das Format ist unter [Tag-Beschreibungen](docs/usage.de.md#tag-descriptions) beschrieben.

![Tag-Beschreibungen in Vervollständigungsvorschlägen und beim Zeigen auf Tags in der Notiz und im Tag-Panel](assets/demos/tag-summaries.gif)

### Farben mit einem Klick hinzufügen

Wählen Sie **Random decoration**, um kräftige Komplementärfarben für die Tags der aktuellen Notiz zu erzeugen. Die Demo zeigt Live Preview. Die Formatierungseinstellungen werden im Abschnitt `local-tags-config` der Notiz gespeichert.

![Random decoration ändert die Farben der Tags in der Notiz und im Tag-Panel](assets/demos/random-decoration.gif)

### Mit Umschaltklick zwischen Vorkommen wechseln

Halten Sie die Umschalttaste gedrückt und klicken Sie auf einen Tag im Panel, um seine Vorkommen in der aktuellen Notiz aufzurufen. Eine Zeilenhervorhebung und ein Rahmen um den passenden Tag zeigen die aktuelle Position an.

![Umschaltklicks auf einen Tag durchlaufen drei hervorgehobene Vorkommen](assets/demos/shift-click-navigation.gif)

### Obsidian Search per Klick öffnen

Klicken Sie auf einen Tag im Panel, um den standardmäßigen Search-Bereich von Obsidian zu öffnen; aktuelle Datei und Tag-Text sind bereits eingetragen. Die Suchergebnisse bleiben auf diese Notiz beschränkt.

![Ein Klick auf einen Tag öffnet den standardmäßigen Search-Bereich mit Ergebnissen aus der aktuellen Notiz](assets/demos/click-search.gif)

## Voraussetzungen

Obsidian `1.14.4` oder neuer für Desktop. Local Tags ist ausschließlich für die Desktop-Version vorgesehen.

## Installation

Für eine lokal erstellte Version kopieren Sie `main.js`, `manifest.json`, `styles.css`, `LICENSE` und `THIRD-PARTY-NOTICES.txt` aus `dist/local-tags/` nach `<vault>/.obsidian/plugins/local-tags/` und aktivieren **Local Tags** in Obsidians Einstellungen für Community-Plugins.

Deaktivieren und aktivieren Sie das Plugin nach dem Ersetzen einer installierten Version erneut. Wenn eine neue Installation nicht in der Plugin-Liste erscheint, öffnen Sie den Vault erneut.

<a id="quick-start"></a>

## Schnellstart

1. Fügen Sie `##project` oder `##people/Alex` in eine Markdown-Notiz ein.
2. Geben Sie `##` und einen Teil eines vorhandenen Tag-Namens ein, wählen Sie einen Vorschlag und bestätigen Sie mit Enter; mit Esc brechen Sie ab.
3. Führen Sie den Befehl **Open tag panel** aus, um das Tag-Panel zu öffnen.
4. Klicken Sie auf einen Tag im Panel, um die aktuelle Datei zu durchsuchen, oder klicken Sie bei gedrückter Umschalttaste, um passende Tags in der Notiz nacheinander aufzurufen.
5. Öffnen Sie **Settings → Local Tags**, um das Aussehen der Tags anzupassen.
6. Für notizbezogene Formatierungen klappen Sie **Settings, actions and messages** im Panel auf und wählen **Add missing settings**. Tragen Sie die erzeugten Werte ein oder wählen Sie **Random decoration**, um Farben zu erzeugen.

Lokale Tags verwenden `##` und sind von Obsidians standardmäßigen `#tags` getrennt.

Die [Nutzungsanleitung](docs/usage.de.md) erläutert Eingaberegeln, Erkennungsgrenzen, gemeinsame Darstellungseinstellungen, notizbezogene Formatierungen, Tag-Beschreibungen, Panel-Aktionen, die Navigation innerhalb der Notiz und Einschränkungen der Suche.

## Einschränkungen

Grundlegende Funktionen mit englischem und japanischem Text sollten funktionieren, wurden jedoch nicht umfassend überprüft. Das Verhalten mit anderen Sprachen ist weiterhin nicht überprüft.

Das README und die Nutzungsanleitung sind in sieben Sprachfassungen verfügbar. Die Übersetzungen der Dokumentation ändern weder die von der Plugin-Oberfläche unterstützten Sprachen noch belegen sie, dass die Tag-Erkennung und das Verhalten von Eingabemethoden in diesen Sprachen überprüft wurden.

## Build und Tests

Verwenden Sie Node.js 24 und npm:

```sh
npm ci --ignore-scripts
npm run check
```

Der Produktionsbuild wird nach `dist/local-tags/` geschrieben. Einzelne Prüfungen und der Release-Ablauf sind unter [Entwicklung](docs/development.md) beschrieben.

## Projektrichtlinien

Dieses Projekt nimmt keine Pull Requests an. Fehlermeldungen über GitHub Issues sind willkommen und werden im Rahmen der verfügbaren Möglichkeiten bearbeitet. Funktionswünsche können ebenfalls eingereicht werden, haben jedoch eine sehr niedrige Priorität. Fortlaufende Wartung, Unterstützung und neue Funktionen werden nicht garantiert.

## Lizenz

Copyright (C) 2026 mstksb.

Der eigene Code des Projekts steht unter der GNU General Public License, ausschließlich Version 3 (`GPL-3.0-only`). Die vollständigen Bedingungen finden Sie in [LICENSE](LICENSE). Der vollständige Lizenztext ist außerdem in die erzeugte Datei `main.js` eingebettet, damit er erhalten bleibt, wenn Obsidian nur die zur Ausführung benötigten Dateien installiert.

Komponenten von Drittanbietern behalten ihre jeweiligen Lizenzen. Ihre Lizenzhinweise werden aus dem Produktionsbundle erzeugt und in `THIRD-PARTY-NOTICES.txt` sowie in der erzeugten Datei `main.js` aufgenommen.

## Dokumentation und Aktualisierungen

| Datei                                                                                                                                                                                                                                  | Zweck und Anlass für Aktualisierungen                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                                                                                                                                                                                                                 | Englische Ausgangsfassung für Projektübersicht, Installation, grundlegende Bedienung, Projektrichtlinien und Dokumentenverzeichnis; sie und ihre Übersetzungen bei entsprechenden Änderungen aktualisieren.                                                                                       |
| README-Übersetzungen: [日本語](README.ja.md), [简体中文](README.zh-CN.md), [繁體中文](README.zh-TW.md), [Español](README.es.md), [Português (Brasil)](README.pt-BR.md), [Deutsch](README.de.md)                                        | Übersetzungen dieses README; zusammen mit der englischen Ausgangsfassung aktualisieren.                                                                                                                                                                                                           |
| [AGENTS.md](AGENTS.md)                                                                                                                                                                                                                 | Projektspezifische Bearbeitungsanweisungen; bei Änderungen der Arbeitsregeln oder Verweise aktualisieren.                                                                                                                                                                                         |
| [docs/usage.md](docs/usage.md)                                                                                                                                                                                                         | Englische Ausgangsfassung für Eingaberegeln, Erkennungsgrenzen, gemeinsame und notizbezogene Darstellungseinstellungen, Tag-Beschreibungen, Panel-Aktionen, Navigation innerhalb der Notiz und Einschränkungen der Suche; sie und ihre Übersetzungen bei entsprechenden Änderungen aktualisieren. |
| Übersetzungen der Nutzungsanleitung: [日本語](docs/usage.ja.md), [简体中文](docs/usage.zh-CN.md), [繁體中文](docs/usage.zh-TW.md), [Español](docs/usage.es.md), [Português (Brasil)](docs/usage.pt-BR.md), [Deutsch](docs/usage.de.md) | Übersetzungen der Nutzungsanleitung; zusammen mit der englischen Ausgangsfassung aktualisieren.                                                                                                                                                                                                   |
| [docs/development.md](docs/development.md)                                                                                                                                                                                             | Build, Tests, manuelle Prüfungen, Versionsvorbereitung und Release-Verfahren; bei Änderungen der Befehle oder Abläufe aktualisieren.                                                                                                                                                              |
| [CHANGELOG.md](CHANGELOG.md)                                                                                                                                                                                                           | Für Nutzer sichtbare Änderungen je Release; vor der Vorbereitung eines Releases aktualisieren.                                                                                                                                                                                                    |
| [LICENSE](LICENSE)                                                                                                                                                                                                                     | Lizenzbedingungen für den eigenen Code des Projekts; Lizenzangaben konsistent mit dieser Datei halten.                                                                                                                                                                                            |
