# 使用說明

[English](usage.md) | [日本語](usage.ja.md) | [简体中文](usage.zh-CN.md) | [繁體中文](usage.zh-TW.md) | [Español](usage.es.md) | [Português (Brasil)](usage.pt-BR.md) | [Deutsch](usage.de.md)

標籤輸入、自動完成、標籤面板及搜尋的基本操作，請先參閱 [README 的快速開始](../README.zh-TW.md#quick-start)。本指南說明輸入規則、辨識限制、共用及個別筆記的外觀設定、標籤說明、面板操作、筆記內跳轉與搜尋注意事項。

<a id="input-rules"></a>

## 輸入規則

- 使用 `##topic` 表示檔案內標籤，使用 `/` 建立階層，例如 `##people/Alex/work`；`## Heading` 則是 Markdown 標題。
- 名稱區分大小寫，並支援 Unicode 名稱，例如 `##people/Zoë`。
- 空格、換行或其他標籤結束字元會結束標籤。單獨的 `##` 會啟動自動完成，但不算完整標籤。
- 僅包含數字，或僅包含數字與 `/` 的名稱會視為一般文字。開頭、結尾或連續出現的 `/` 會產生無效的空白階層。

<a id="recognition-limits"></a>

## 辨識限制

- 行內程式碼、程式碼區塊、YAML frontmatter、連結與圖片、網址、HTML，以及 `\##example` 這類跳脫寫法中的標籤，不會被辨識。
- Callout 的標題與內容，以及表格儲存格，都支援檔案內標籤，但同樣適用上述排除規則。
- Obsidian `%% comments %%` 中的標籤會出現在自動完成建議與標籤面板中，但不會顯示於 Reading View。

<a id="completion-settings"></a>

## 自動完成設定

開啟 **Settings → Local Tags**，設定 **Completion matching**。預設的 **Substring match** 會尋找名稱中包含輸入文字的標籤。**Prefix match** 則尋找名稱開頭符合輸入文字的標籤，包括階層式名稱的起點。

**Case-sensitive completion** 預設為關閉，既有安裝也相同。啟用後，比對會區分大小寫字母。顯示及插入建議時，會保留原本的拼寫；標籤本身的識別仍然區分大小寫。

自動完成建議依序優先顯示完全相符、前綴相符，再顯示其他子字串相符項目，最多顯示目前檔案中的十個建議。

<a id="appearance-settings"></a>

## 外觀設定

開啟 **Settings → Local Tags**。這些共用設定適用於 Source mode、Live Preview 和 Reading View。

| 設定標籤                   | 說明                                                               |
| -------------------------- | ------------------------------------------------------------------ |
| Local tag text color       | 設定有效檔案內標籤的文字色彩。                                     |
| Local tag background color | 設定標籤背景色彩。                                                 |
| Local tag bold             | 沿用預設樣式、啟用粗體或停用粗體。                                 |
| Local tag underline        | 沿用預設樣式、啟用底線或停用底線。                                 |
| Local tag italic           | 沿用預設樣式、啟用斜體或停用斜體。                                 |
| Local tag vertical padding | 以 0.25 px 為單位，調整 −5 至 +5 px 的垂直內距；0 會恢復預設內距。 |

**Reset to theme** 會清除自訂色彩。粗體、底線和斜體則可選擇 **Follow default**、**Enabled** 或 **Disabled**。

**Hide local tag prefix when not editing** 預設為關閉。啟用後，有效標籤會在 Reading View，以及 Live Preview 中未啟用編輯時隱藏 `##`。將游標移入標籤或選取標籤時，前綴會重新顯示。Source mode 始終顯示 `##`，Markdown 原始內容也不會改變。

<a id="per-note-decoration"></a>

## 個別筆記的樣式

<a id="configuration-format"></a>

### 設定格式

加入文字內容完全等於 `local-tags-config` 的最外層 Markdown 標題，後面接一個包含標籤定義的無序清單。標題可以使用任何層級。此區段會在下一個同層級或更高層級的標題之前結束，或延續至筆記結尾。

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

每個標籤都有六個選用設定，以下順序與 **Add missing settings** 及 **Remove empty settings** 使用的順序相同。

| 設定               | 可接受的值                           |
| ------------------ | ------------------------------------ |
| `text-color`       | 六位數十六進位色碼，例如 `#ffffff`。 |
| `background-color` | 六位數十六進位色碼，例如 `#174266`。 |
| `border-color`     | 六位數十六進位色碼，例如 `#5da9e9`。 |
| `bold`             | `on` 或 `off`。                      |
| `underline`        | `on` 或 `off`。                      |
| `italic`           | `on` 或 `off`。                      |

色彩值可以使用 `#RRGGBB` 或 `\#RRGGBB`。色彩控制項會寫入帶有跳脫字元的形式，避免色彩值變成 Obsidian 的標準標籤。文字強調樣式的設定請使用小寫的 `on` 與 `off`。

既有的 `local-tags` 區段名稱，以及巢狀放在 `style` 清單項目中的設定，也都可以使用。請維持單一設定區段，且每個標籤只定義一次。同一個定義可直接列出屬性，或使用 `style` 群組。

<a id="inheritance-and-errors"></a>

### 繼承與錯誤

每個設定都會獨立決定樣式：先採用共用外觀設定與佈景主題預設值，再依序套用各層祖先標籤的設定，最後套用標籤自己的設定。結果會在目前筆記的 Source mode、Live Preview、Reading View 與標籤面板中生效。

缺少的設定、`italic:` 這類空白值，或完全沒有屬性的標籤定義，都會繼承父標籤的值；根標籤則繼承共用設定。空白值是有效的。明確指定 `off` 會覆寫繼承而來的 `on`。

上例中的 `##project/review` 會繼承 `##project` 的文字色彩、框線色彩和粗體設定，並使用自己的背景色彩與底線設定。它的斜體設定則沿用共用設定或佈景主題。

`text-color: red` 或 `bold: yes` 這類非空白的無效值，會在面板中顯示為錯誤。標籤本身仍然有效，其他有效設定仍會套用，而無效設定會繼承父標籤或共用設定的值。使用會寫入設定的操作前，包含編輯色彩，請先修正錯誤。

重複定義、重複屬性、重複設定標題，或將定義分散在不同最外層清單等結構錯誤，也會阻止設定寫入。修正這些錯誤期間，先前有效的樣式可能會保留。無法辨識的項目會產生警告，並保留其原始文字。

編輯筆記或從外部變更筆記時，設定變更都會反映至顯示結果。

<a id="tag-panel-actions"></a>

### 標籤面板操作

執行 **Open tag panel**。標籤清單上方會顯示按一下及 Shift+按一下的操作說明。展開 **Settings, actions and messages**；摘要會顯示 **Errors** 與目前錯誤數量，出現新錯誤時也會自動展開。若資訊可用，訊息會指出受影響的行與標籤。

**Target** 會顯示編輯器插入點所在設定區塊所屬的標籤。在其他位置，則顯示 **All tags**。Reading View 的目標一律為 **All tags**。此目標會決定 **Random decoration** 的操作範圍。

在編輯模式執行 **Random decoration** 時，請只保留一個游標。多游標會使操作遭到拒絕，即使目標顯示為 **All tags** 也相同。

| 按鈕                       | 效果                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add missing settings**   | 為已辨識但尚未定義的檔案內標籤新增定義，再為所有定義補上缺少的屬性並留空其值。必要時建立設定區段。保留既有值，並依上述順序排列屬性。                          |
| **Remove empty settings**  | 移除值為空白的已知屬性，並依上述順序排列剩餘屬性。保留標籤定義，即使已無任何屬性也相同，並保留非空白值及附隨內容。                                            |
| **Random decoration**      | 在編輯模式中，為單一插入點所在設定區塊所屬的標籤產生隨機樣式。目標為 **All tags** 時，為根標籤產生色彩，讓子標籤繼承。Reading View 使用此整篇筆記的操作方式。 |
| **Sort settings**          | 依區分大小寫的標籤名稱排序定義，並保持每個定義的內容完整。                                                                                                    |
| **Expand to tag headings** | 在 Source mode 或 Live Preview 中顯示設定區段的標籤項目，並摺疊其屬性清單。此操作會改變編輯器的摺疊狀態。                                                     |

例如，**Remove empty settings** 會變更以下設定。

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

處理後的定義會保留這兩個標籤。

```md
- ##tag1
  - bold: on
- ##tag2
```

隨機樣式會為文字、背景與框線色彩使用固定的鮮明互補色調色盤。既有色彩可能會被替換。粗體、底線和斜體則會保留目前值。若要在隨機配色時保留某個屬性，請在屬性名稱前加上 `.`，例如 `.text-color: \#ffffff`。使用 `.style` 群組則會讓該群組的所有屬性不參與隨機配色，同時保留其樣式效果。

<a id="color-swatches"></a>

### 色塊

在 Source mode 或 Live Preview 中，按一下設定中有效色彩旁的色塊。輸入六位數十六進位色碼，或調整色相、飽和度與亮度滑桿，再選擇 **Apply**。選擇 **Cancel** 或按 Esc 可關閉選色器。若選色器開啟期間筆記內容發生變更，更新會取消，以保護已編輯的文字。

<a id="tag-descriptions"></a>

## 標籤說明

在筆記的 `local-tags-config` 區段中，於完整標籤名稱後的同一個宣告行加入說明。

```md
## local-tags-config

- ##project Work owned by this project
- ##project/review Review tasks for this project
```

說明僅屬於目前筆記中名稱完全相符且區分大小寫的標籤。每個子標籤都需要個別加入說明。只有宣告行上的文字會被納入。Obsidian 註解與 HTML 註解會被移除，前後空白也會被清除。剩餘說明中的 Markdown 與 HTML 會以純文字顯示。

說明會出現在每個相符的自動完成建議旁。按 Enter 時會插入標籤名稱及其後的一個空格。在 Source mode、Live Preview、Reading View 或標籤面板中，將游標停留在標籤上，稍候便會顯示說明。使用鍵盤將焦點移至面板標籤上，也會立即顯示說明。按 Esc 或移開游標可關閉。

筆記變更時，說明也會更新。即使樣式設定值無效並回報錯誤，說明仍可顯示。重複定義會隱藏受影響標籤的說明。若出現多個設定標題，或定義分散在不同清單中，所有說明都會隱藏，直到結構修正為止。

<a id="tag-panel-search"></a>

## 標籤面板搜尋

執行 **Open tag panel**，並在 **Search tags** 中輸入文字，即可立即篩選目前筆記的標籤清單。搜尋會對完整的階層式標籤名稱，以及各個標籤的[說明](#tag-descriptions)進行子字串比對。英文比對不區分大小寫，也支援日文文字。標籤本身的識別與自動完成設定不受影響。

使用 **Tag name** 和 **Summary** 核取方塊選擇搜尋目標。兩者預設皆為啟用，只要任一目標相符即可。若同時關閉兩者，輸入搜尋文字時就不會顯示相符項目。清除搜尋文字，或只輸入空白字元，即可恢復完整清單。前後空白會被忽略。

祖先標籤會保留顯示，以呈現通往相符子標籤的路徑。父標籤的說明相符時，不會因此納入不相關的子標籤。說明屬於各個名稱完全相符的標籤，搜尋時不會被繼承。

清單更新時，輸入欄位與核取方塊會維持原位。切換筆記時會保留目前的搜尋文字與目標選擇，而每篇筆記仍使用自己的標籤與說明。重新開啟面板時，這些暫時選擇會重設。編輯說明會更新搜尋結果。沒有相符項目時會顯示 **No matching tags**。

Obsidian 的語言設為日文時，搜尋控制項與無相符項目的訊息會使用日文，其他情況則使用英文。按一下剩餘標籤仍會開啟 Obsidian Search；Shift+按一下仍會在筆記內跳轉。篩選面板不會變更筆記內容或 Obsidian 的搜尋查詢。

<a id="in-note-navigation"></a>

## 筆記內跳轉

按住 Shift，再以滑鼠左鍵按一下面板中的標籤，不要同時按 Ctrl、Command 或 Alt，即可捲動至目前筆記中第一次出現的位置。重複操作會依原始內容的順序跳至下一處，最後一處之後會返回第一處。父標籤也會比對子標籤，因此 `##people` 會包含 `##people/Alex`。

Source mode、Live Preview 和 Reading View 都會醒目提示相符行，並為標籤加上外框。Source mode 和 Live Preview 會保留編輯器的游標與選取範圍。啟用前綴隱藏時，跳轉也會讓 Live Preview 中未啟用編輯的標籤維持隱藏 `##`。摺疊區段會展開，以顯示相符位置。

Reading View 的巢狀清單會醒目提示相符的顯示行。在 Reading View 和 Live Preview 中已呈現的表格內，行醒目提示會限定在相符的儲存格中。Reading View 會跳過隱藏在 `%% comments %%` 中的標籤。如果沒有可見的出現位置，通知會建議在編輯模式中檢查筆記。

編輯筆記，或切換目標檔案、Markdown 窗格或顯示模式時，會清除醒目提示並重設跳轉循環。選擇其他標籤時，會從該標籤第一次出現的位置開始。停用外掛會清除醒目提示。

<a id="search-caveats"></a>

## 搜尋注意事項

按一下面板中的標籤，會將目前的 Obsidian 搜尋查詢替換為針對目前檔案與標籤的文字搜尋。結果可能包含標籤辨識原本排除的位置，例如程式碼區塊中的文字。
