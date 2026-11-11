# Nutzung

[English](usage.md) | [日本語](usage.ja.md) | [简体中文](usage.zh-CN.md) | [繁體中文](usage.zh-TW.md) | [Español](usage.es.md) | [Português (Brasil)](usage.pt-BR.md) | [Deutsch](usage.de.md)

Beginnen Sie mit dem [Schnellstart im README](../README.de.md#quick-start), um Tags einzugeben, die Vervollständigung und das Tag-Panel zu verwenden und zu suchen. Diese Anleitung erläutert Eingaberegeln, Erkennungsgrenzen, gemeinsame und notizbezogene Darstellungseinstellungen, Tag-Beschreibungen, Panel-Aktionen, die Navigation innerhalb der Notiz und Einschränkungen der Suche.

<a id="input-rules"></a>

## Eingaberegeln

- Verwenden Sie `##topic` für einen lokalen Tag und `/` für Hierarchien, etwa `##people/Alex/work`; `## Heading` ist eine Markdown-Überschrift.
- Bei Namen wird zwischen Groß- und Kleinschreibung unterschieden; Unicode-Namen wie `##people/Zoë` werden unterstützt.
- Ein Leerzeichen, ein Zeilenumbruch oder ein anderes Tag-beendendes Zeichen beendet einen Tag. Ein alleinstehendes `##` startet die Vervollständigung, ist jedoch kein vollständiger Tag.
- Namen, die nur aus Ziffern oder aus Ziffern und `/` bestehen, gelten als gewöhnlicher Text. Ein führendes, abschließendes oder wiederholtes `/` erzeugt eine ungültige leere Hierarchieebene.

<a id="recognition-limits"></a>

## Erkennungsgrenzen

- Tags in Inline-Code und Codeblöcken, YAML-Frontmatter, Links und Bildern, URLs, HTML und maskierten Schreibweisen wie `\##example` sind ausgeschlossen.
- In Callout-Titeln, Callout-Inhalten und Tabellenzellen werden lokale Tags mit denselben Ausschlüssen unterstützt.
- Tags in Obsidians `%% comments %%` werden in die Vervollständigung und das Tag-Panel aufgenommen, in Reading View jedoch nicht angezeigt.

<a id="completion-settings"></a>

## Einstellungen für die Vervollständigung

Öffnen Sie **Settings → Local Tags**, um **Completion matching** auszuwählen. **Substring match** findet Namen, die die Eingabe enthalten, und ist die Standardeinstellung. **Prefix match** findet Namen, die mit der Eingabe beginnen, einschließlich des Anfangs eines hierarchischen Namens.

**Case-sensitive completion** ist standardmäßig ausgeschaltet, auch bei bestehenden Installationen. Aktivieren Sie diese Option, um Groß- und Kleinbuchstaben getrennt zu vergleichen. Vorschläge behalten beim Anzeigen und Einfügen ihre ursprüngliche Schreibweise; bei der Identität der Tags wird weiterhin zwischen Groß- und Kleinschreibung unterschieden.

Die Vervollständigung ordnet zuerst exakte Treffer, dann Präfixtreffer und anschließend andere Teilzeichenfolgentreffer an; sie zeigt bis zu zehn Vorschläge aus der aktuellen Datei.

<a id="appearance-settings"></a>

## Darstellungseinstellungen

Öffnen Sie **Settings → Local Tags**. Diese gemeinsamen Einstellungen gelten in Source mode, Live Preview und Reading View.

| Bezeichnung der Einstellung | Bedeutung                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Local tag text color        | Legt die Textfarbe gültiger lokaler Tags fest.                                                                           |
| Local tag background color  | Legt die Hintergrundfarbe der Tags fest.                                                                                 |
| Local tag bold              | Übernimmt den Standardstil, aktiviert Fettdruck oder deaktiviert ihn.                                                    |
| Local tag underline         | Übernimmt den Standardstil, aktiviert Unterstreichungen oder deaktiviert sie.                                            |
| Local tag italic            | Übernimmt den Standardstil, aktiviert Kursivschrift oder deaktiviert sie.                                                |
| Local tag vertical padding  | Passt den vertikalen Innenabstand von −5 bis +5 px in Schritten von 0,25 px an; 0 stellt den Standardabstand wieder her. |

**Reset to theme** entfernt eine benutzerdefinierte Farbe. Wählen Sie für Fett-, Unterstreichungs- und Kursivformatierung **Follow default**, **Enabled** oder **Disabled**.

**Hide local tag prefix when not editing** ist standardmäßig ausgeschaltet. Ist die Option aktiviert, wird `##` bei gültigen Tags in Reading View und bei inaktiven Tags in Live Preview ausgeblendet. Bewegen Sie den Cursor in einen Tag oder wählen Sie ihn aus, um das Präfix anzuzeigen. Source mode zeigt `##` immer an; der Markdown-Quelltext bleibt unverändert.

<a id="per-note-decoration"></a>

## Notizbezogene Formatierungen

<a id="configuration-format"></a>

### Konfigurationsformat

Fügen Sie eine Markdown-Überschrift auf oberster Strukturebene hinzu, deren Text genau `local-tags-config` lautet, gefolgt von einer einzigen ungeordneten Liste mit Tag-Definitionen. Jede Überschriftenebene ist zulässig. Der Abschnitt endet an der nächsten Überschrift derselben oder einer höheren Ebene oder am Ende der Notiz.

```md
## local-tags-config

- ##project
  - text-color: \#ffffff
  - background-color: \#174266
  - border-color: \#5da9e9
  - bold: on
  - underline: off
  - italic:
- ##project/review
  - background-color: \#49345c
  - underline: on

## Notes

Discuss ##project and ##project/review here.
```

Jeder Tag besitzt sechs optionale Einstellungen. Die folgende Reihenfolge wird von **Add missing settings** und **Remove empty settings** verwendet.

| Einstellung        | Zulässige Werte                                        |
| ------------------ | ------------------------------------------------------ |
| `text-color`       | Eine sechsstellige hexadezimale Farbe, etwa `#ffffff`. |
| `background-color` | Eine sechsstellige hexadezimale Farbe, etwa `#174266`. |
| `border-color`     | Eine sechsstellige hexadezimale Farbe, etwa `#5da9e9`. |
| `bold`             | `on` oder `off`.                                       |
| `underline`        | `on` oder `off`.                                       |
| `italic`           | `on` oder `off`.                                       |

Farbwerte akzeptieren sowohl `#RRGGBB` als auch `\#RRGGBB`. Die Farbsteuerungen schreiben die maskierte Form, damit der Farbwert nicht zu einem standardmäßigen Obsidian-Tag wird. Verwenden Sie für die Hervorhebungseinstellungen die kleingeschriebenen Werte `on` und `off`.

Bestehende Abschnitte namens `local-tags` sowie Einstellungen, die unter einem Listeneintrag `style` verschachtelt sind, werden ebenfalls akzeptiert. Verwenden Sie genau einen Konfigurationsabschnitt und eine Definition pro Tag. Eine Definition darf entweder direkte Attribute oder eine `style`-Gruppe enthalten.

<a id="inheritance-and-errors"></a>

### Vererbung und Fehler

Die Formatierung wird für jede Einstellung getrennt ermittelt: Zunächst gelten die gemeinsamen Darstellungseinstellungen und die Theme-Standardwerte, darauf folgen die Werte der konfigurierten übergeordneten Tags und schließlich die eigenen Werte des Tags. Das Ergebnis gilt innerhalb der aktuellen Notiz in Source mode, Live Preview, Reading View und im Tag-Panel.

Eine fehlende Einstellung, ein leerer Wert wie `italic:` oder eine Tag-Definition ohne Attribute erbt den Wert des übergeordneten Tags; bei einem Tag auf oberster Ebene wird der Wert aus den gemeinsamen Einstellungen übernommen. Leere Werte sind gültig. Ein ausdrücklich gesetztes `off` überschreibt ein geerbtes `on`.

Im Beispiel erbt `##project/review` Textfarbe, Rahmenfarbe und Fettdruck von `##project` und legt seine eigene Hintergrundfarbe und Unterstreichung fest. Die Kursivformatierung folgt den gemeinsamen Einstellungen oder dem Theme.

Ein nicht leerer, ungültiger Wert wie `text-color: red` oder `bold: yes` erscheint als Fehler im Panel. Der Tag bleibt gültig und seine anderen gültigen Einstellungen werden weiterhin angewendet; die ungültige Einstellung erbt den Wert des übergeordneten Tags oder der gemeinsamen Einstellungen. Beheben Sie Fehler, bevor Sie Aktionen verwenden, die die Konfiguration schreiben, einschließlich der Farbbearbeitung.

Strukturfehler wie doppelte Definitionen, doppelte Attribute, doppelte Konfigurationsüberschriften oder auf mehrere getrennte Listen oberster Ebene verteilte Definitionen verhindern ebenfalls das Schreiben der Konfiguration. Zuvor gültige Formatierungen können erhalten bleiben, während diese Fehler behoben werden. Unbekannte Einträge erzeugen Warnungen und ihr Quelltext bleibt erhalten.

Änderungen der Konfiguration werden beim Bearbeiten der Notiz oder nach externen Änderungen übernommen.

<a id="tag-panel-actions"></a>

### Aktionen im Tag-Panel

Führen Sie **Open tag panel** aus. Hinweise zu Klick und Umschaltklick erscheinen über der Tag-Liste. Klappen Sie **Settings, actions and messages** auf. Die Zusammenfassung zeigt unter **Errors** die aktuelle Fehleranzahl; bei einem neu gemeldeten Fehler öffnet sich der Bereich. Meldungen nennen die betroffene Zeile und den Tag, soweit verfügbar.

Die Anzeige **Target** zeigt den Tag, in dessen Konfigurationsblock sich die Einfügemarke des Editors befindet. An allen anderen Stellen zeigt sie **All tags**. In Reading View lautet das Ziel **All tags**. Dieses Ziel steuert **Random decoration**.

Verwenden Sie im Bearbeitungsmodus bei **Random decoration** nur einen Cursor. Bei mehreren Cursorn wird die Aktion abgewiesen, auch wenn das Ziel **All tags** lautet.

| Schaltfläche               | Wirkung                                                                                                                                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Add missing settings**   | Ergänzt Definitionen für erkannte lokale Tags, denen noch eine Definition fehlt, und fügt anschließend allen Definitionen fehlende Attribute mit leeren Werten hinzu. Erstellt den Konfigurationsabschnitt bei Bedarf. Bewahrt bestehende Werte und ordnet Attribute in der oben angegebenen Reihenfolge an. |
| **Remove empty settings**  | Entfernt leere bekannte Attribute und ordnet die verbleibenden Attribute in der oben angegebenen Reihenfolge an. Bewahrt Tag-Definitionen, auch wenn sie danach keine Attribute mehr besitzen, und erhält nicht leere Werte sowie zugehörige Inhalte.                                                        |
| **Random decoration**      | Im Bearbeitungsmodus wird der Tag, in dessen Konfigurationsblock sich die einzige Einfügemarke befindet, zufällig formatiert. Bei **All tags** werden Farben für die Tags oberster Ebene erzeugt, damit untergeordnete Tags sie erben. Reading View verwendet diese Aktion für die gesamte Notiz.            |
| **Sort settings**          | Sortiert Tag-Definitionen nach ihren Namen unter Beachtung der Groß- und Kleinschreibung und hält die Inhalte jeder Definition zusammen.                                                                                                                                                                     |
| **Expand to tag headings** | Zeigt die Tag-Einträge der Konfiguration und klappt ihre Attributlisten in Source mode oder Live Preview ein. Dabei werden die Einklappzustände im Editor geändert.                                                                                                                                          |

Beispielsweise ändert **Remove empty settings** die folgende Konfiguration.

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

Die resultierenden Definitionen behalten beide Tags bei.

```md
- ##tag1
  - bold: on
- ##tag2
```

Die zufällige Formatierung verwendet eine feste Palette kräftiger Komplementärfarben für Text, Hintergrund und Rahmen. Bestehende Farben können ersetzt werden. Fett-, Unterstreichungs- und Kursivformatierung behalten ihre aktuellen Werte. Stellen Sie einem Attribut einen `.` voran, um es bei der zufälligen Formatierung zu bewahren, etwa `.text-color: \#ffffff`. Eine `.style`-Gruppe schließt alle ihre Attribute von der zufälligen Formatierung aus; ihre Formatierung bleibt dennoch aktiv.

<a id="color-swatches"></a>

### Farbfelder

Klicken Sie in Source mode oder Live Preview auf das Farbfeld neben einer gültigen Farbe in der Konfiguration. Geben Sie eine sechsstellige Hexadezimalfarbe ein oder passen Sie Farbton, Sättigung und Helligkeit über die Schieberegler an und wählen Sie **Apply**. **Cancel** oder Esc schließt den Farbwähler. Wenn sich die Notiz bei geöffnetem Farbwähler ändert, wird die Aktualisierung abgebrochen, um den bearbeiteten Text zu schützen.

<a id="tag-descriptions"></a>

## Tag-Beschreibungen

Schreiben Sie im Abschnitt `local-tags-config` der Notiz eine Beschreibung auf dieselbe Deklarationszeile hinter den vollständigen Tag-Namen.

```md
## local-tags-config

- ##project Work owned by this project
- ##project/review Review tasks for this project
```

Die Beschreibung gehört genau zu diesem Tag-Namen unter Beachtung der Groß- und Kleinschreibung innerhalb der aktuellen Notiz. Fügen Sie für jeden untergeordneten Tag eine eigene Beschreibung hinzu. Nur der Text auf der Deklarationszeile wird berücksichtigt. Obsidian- und HTML-Kommentare werden entfernt und Leerraum am Anfang und Ende wird abgeschnitten. Markdown und HTML in der verbleibenden Beschreibung werden als einfacher Text angezeigt.

Beschreibungen erscheinen neben jedem passenden Vervollständigungsvorschlag. Enter fügt den Tag-Namen und ein nachfolgendes Leerzeichen ein. Zeigen Sie in Source mode, Live Preview, Reading View oder im Tag-Panel auf einen Tag, um seine Beschreibung nach einer kurzen Verzögerung anzuzeigen. Erhält ein Tag im Panel den Tastaturfokus, erscheint die Beschreibung sofort. Mit Esc oder durch Wegbewegen des Zeigers schließen Sie sie.

Beschreibungen werden bei Änderungen der Notiz aktualisiert. Ungültige Formatierungswerte können Fehler melden, während die Beschreibung weiterhin verfügbar bleibt. Doppelte Definitionen unterdrücken die Beschreibung des betroffenen Tags. Mehrere Konfigurationsüberschriften oder getrennte Definitionslisten unterdrücken alle Beschreibungen, bis die Struktur korrigiert ist.

<a id="tag-panel-search"></a>

## Suche im Tag-Panel

Führen Sie **Open tag panel** aus und geben Sie Text in **Search tags** ein, um die Tag-Liste der aktuellen Notiz sofort zu filtern. Die Suche verwendet Teilzeichenfolgenabgleich über die vollständigen hierarchischen Tag-Namen und die den jeweiligen Tags zugeordneten [Beschreibungen](#tag-descriptions). Bei englischem Text wird die Groß- und Kleinschreibung ignoriert; japanischer Text wird ebenfalls unterstützt. Tag-Identität und Vervollständigungseinstellungen bleiben unverändert.

Wählen Sie die Suchziele über die Kontrollkästchen **Tag name** und **Summary**. Beide sind anfangs aktiviert; ein Treffer in einem der beiden Ziele genügt. Sind beide deaktiviert, werden bei einer eingegebenen Suche keine Treffer angezeigt. Leeren Sie die Suche oder geben Sie nur Leerraum ein, um die vollständige Liste wiederherzustellen. Leerraum am Anfang und Ende wird ignoriert.

Übergeordnete Tags bleiben sichtbar, um den Pfad zu einem passenden untergeordneten Tag zu zeigen. Die Beschreibung eines passenden übergeordneten Tags schließt keine unbeteiligten untergeordneten Tags ein. Beschreibungen gehören zum exakten Tag und werden für die Suche nicht vererbt.

Eingabefeld und Kontrollkästchen bleiben an ihrem Platz, während die Liste aktualisiert wird. Der aktuelle Suchtext und die ausgewählten Suchziele bleiben beim Wechsel der Notiz erhalten; jede Notiz verwendet ihre eigenen Tags und Beschreibungen. Diese vorübergehenden Einstellungen werden beim erneuten Öffnen des Panels zurückgesetzt. Änderungen an Beschreibungen aktualisieren die Ergebnisse. Gibt es keinen Treffer, erscheint **No matching tags**.

Die Suchsteuerungen und die Meldung bei fehlenden Ergebnissen werden auf Japanisch angezeigt, wenn Obsidian auf Japanisch eingestellt ist, andernfalls auf Englisch. Ein Klick auf einen verbleibenden Tag öffnet weiterhin Obsidian Search; ein Umschaltklick navigiert weiterhin innerhalb der Notiz. Das Filtern des Panels verändert weder die Notiz noch Obsidians Suchabfrage.

<a id="in-note-navigation"></a>

## Navigation innerhalb der Notiz

Klicken Sie mit der linken Maustaste bei gedrückter Umschalttaste auf einen Tag im Panel, ohne Ctrl, Command oder Alt zu drücken, um zu seinem ersten Vorkommen in der aktuellen Notiz zu scrollen. Wiederholen Sie den Vorgang, um das nächste Vorkommen in Quelltextreihenfolge aufzurufen; nach dem letzten beginnt der Durchlauf wieder beim ersten. Ein übergeordneter Tag erfasst auch seine untergeordneten Tags, sodass `##people` auch `##people/Alex` einschließt.

Source mode, Live Preview und Reading View heben die passende Zeile hervor und umrahmen den Tag. Source mode und Live Preview bewahren Cursorposition und Auswahl im Editor. Bei aktivierter Präfixausblendung bleibt das verborgene `##`-Präfix inaktiver Tags in Live Preview auch bei der Navigation ausgeblendet. Eingeklappte Abschnitte werden aufgeklappt, um den Treffer sichtbar zu machen.

In Reading View wird bei einer verschachtelten Liste die passende angezeigte Zeile hervorgehoben. In Reading View und in gerenderten Tabellen in Live Preview bleibt die Zeilenhervorhebung auf die passende Zelle beschränkt. Tags, die in `%% comments %%` verborgen sind, werden in Reading View übersprungen. Ist kein sichtbares Vorkommen verfügbar, weist eine Meldung darauf hin, die Notiz im Bearbeitungsmodus zu prüfen.

Das Bearbeiten der Notiz oder ein Wechsel der Zieldatei, des Markdown-Bereichs oder des Anzeigemodus entfernt die Hervorhebung und setzt den Durchlauf zurück. Die Auswahl eines anderen Tags beginnt bei dessen erstem Vorkommen. Das Deaktivieren des Plugins entfernt die Hervorhebung.

<a id="search-caveats"></a>

## Einschränkungen der Suche

Ein Klick auf einen Tag im Panel ersetzt die bestehende Obsidian-Suchabfrage durch eine Textsuche für die aktuelle Datei und den Tag. Die Ergebnisse können Text an Stellen enthalten, die von der Tag-Erkennung ausgeschlossen sind, etwa in Codeblöcken.
