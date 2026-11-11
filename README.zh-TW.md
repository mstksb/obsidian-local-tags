# Local Tags

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

Local Tags 為 Obsidian 加入僅在目前檔案中有效的 `##tags`。不同筆記可以使用相同的標籤名稱，而不會混合自動完成建議或標籤清單。

已發布的套件請參閱 [Releases](https://github.com/mstksb/obsidian-local-tags/releases)。也可以在 Obsidian 的 **Settings → Community plugins → Browse** 中搜尋並安裝 **Local Tags**。

## 功能

- 使用 `##project` 這類標籤，以及 `##people/Alex` 這類階層式標籤。
- 依據目前的 Markdown 檔案，自動完成標籤名稱。
- 在自動完成建議旁，以及筆記與標籤面板的工具提示中，顯示每篇筆記各自定義的標籤說明。
- 選擇子字串比對或前綴比對，並可設定是否區分大小寫。
- 在原始碼模式（Source mode）、即時預覽（Live Preview）和閱讀檢視（Reading View）中顯示標籤。
- 以階層式面板瀏覽目前檔案的標籤，並立即依名稱或說明篩選。
- 按一下面板中的標籤，在目前檔案中搜尋其文字。
- 按住 Shift 再按一下標籤，依序跳至各個出現位置，並以行醒目提示和標籤外框標示相符項目。
- 在外掛設定中調整共用的文字色彩、背景色彩、文字強調樣式及垂直內距。
- 在 `local-tags-config` 中儲存每篇筆記的文字、背景、框線色彩，以及粗體、底線和斜體設定，並讓子標籤繼承父標籤的設定。
- 從標籤面板補上缺少的設定、移除空白設定、產生鮮明的互補色、排序定義，以及將設定展開至標籤標題。
- 在 Source mode 和 Live Preview 中，透過行內色塊編輯設定色彩，並在面板中查看設定錯誤。
- 可選擇在 Reading View 和 Live Preview 中未啟用編輯的標籤上隱藏 `##`。

## 操作示範

自動完成、階層式標籤清單及按一下搜尋的操作，沿用熟悉的標籤互動方式。Local Tags 另外為每篇筆記提供獨立的標籤集合、隨機樣式，以及 Shift+按一下的跳轉功能。

### 輸入時篩選標籤清單

在 **Search tags** 中輸入文字，即可立即縮小目前筆記的標籤清單。使用 **Tag name** 和 **Summary** 核取方塊，選擇搜尋名稱、說明或兩者。比對不區分大小寫，且會保留相符標籤的祖先標籤。清除搜尋文字即可恢復完整清單。詳細說明請參閱[標籤面板搜尋](docs/usage.zh-TW.md#tag-panel-search)。

![在標籤面板中輸入搜尋文字，並切換標籤名稱和說明的篩選條件](assets/demos/tag-panel-search.gif)

### 輸入時自動完成標籤

輸入 `##`，縮小建議清單，再按 Enter 插入標籤。建議來自目前的 Markdown 檔案。使用子字串比對時，`##rev` 可以找到 `##launch/review`。

![輸入部分標籤名稱、選取自動完成建議，並插入完整標籤](assets/demos/completion.gif)

### 讓標籤各自保留在所屬筆記中

從 Launch plan 切換至 Garden plan，可以看到自動完成建議和標籤面板都會隨目前筆記改變。標準 `#tags` 的索引範圍是整個儲存庫；檔案內的 `##tags` 則在每個檔案中各自形成獨立的標籤集合。

![切換筆記時，檔案內的標籤清單和自動完成建議也隨之改變](assets/demos/file-local-tags.gif)

### 隨時查看標籤的含意

在 `local-tags-config` 區段中，於標籤宣告後的同一行加入簡短說明。說明會出現在自動完成建議旁，以及游標停留在筆記或標籤面板中的標籤上時顯示的工具提示中。按 Enter 時只會插入標籤。格式請參閱[標籤說明](docs/usage.zh-TW.md#tag-descriptions)。

![標籤說明出現在自動完成建議旁，以及筆記和標籤面板的工具提示中](assets/demos/tag-summaries.gif)

### 按一下即可配色

選擇 **Random decoration**，即可為目前筆記的標籤產生鮮明的互補色。示範使用 Live Preview。樣式設定儲存在筆記的 `local-tags-config` 區段中。

![隨機樣式功能改變筆記和標籤面板中的標籤色彩](assets/demos/random-decoration.gif)

### 按住 Shift 再按一下，在出現位置之間跳轉

按住 Shift，再按一下面板中的標籤，即可跳至該標籤在目前筆記中的各個出現位置。相符行的醒目提示與標籤外框會標示目前位置。

![按住 Shift 再按一下標籤，依序跳至三個醒目提示的出現位置](assets/demos/shift-click-navigation.gif)

### 按一下以開啟 Obsidian 搜尋

按一下面板中的標籤，即可開啟 Obsidian 標準的 Search 窗格，並填入目前檔案與標籤文字。搜尋結果會限定在該篇筆記中。

![按一下標籤，開啟標準 Search 窗格並顯示目前筆記中的搜尋結果](assets/demos/click-search.gif)

## 系統需求

桌面版 Obsidian `1.14.4` 或更新版本。Local Tags 僅支援桌面版。

## 安裝

如使用自行建置的版本，請將 `dist/local-tags/` 中的 `main.js`、`manifest.json`、`styles.css`、`LICENSE` 和 `THIRD-PARTY-NOTICES.txt` 放入 `<vault>/.obsidian/plugins/local-tags/`，再於 Obsidian 的社群外掛設定中啟用 **Local Tags**。

替換已安裝版本的檔案後，請先停用再重新啟用外掛。如果新安裝的外掛未出現在清單中，請重新開啟儲存庫。

<a id="quick-start"></a>

## 快速開始

1. 在 Markdown 筆記中加入 `##project` 或 `##people/Alex`。
2. 輸入 `##` 與現有標籤名稱的一部分，選取建議後按 Enter 確認；按 Esc 取消。
3. 執行 **Open tag panel** 指令，開啟標籤面板。
4. 按一下面板中的標籤以搜尋目前檔案，或按住 Shift 再按一下，依序跳至筆記中的相符標籤。
5. 開啟 **Settings → Local Tags**，調整標籤外觀。
6. 若要設定個別筆記的樣式，請在面板中展開 **Settings, actions and messages**，再選擇 **Add missing settings**。填入產生的設定值，或選擇 **Random decoration** 產生色彩。

檔案內標籤使用 `##`，與 Obsidian 標準的 `#tags` 相互獨立。

輸入規則、辨識限制、共用外觀設定、個別筆記樣式、標籤說明、面板操作、筆記內跳轉及搜尋注意事項，請參閱[使用說明](docs/usage.zh-TW.md)。

## 限制

預期可在英文與日文文字中進行基本操作，但尚未完成全面驗證。其他語言的行為仍未經驗證。

README 與使用指南提供七種語言版本。文件翻譯不會改變外掛 UI 的語言支援範圍，也不代表已驗證這些語言的標籤辨識與輸入法行為。

## 建置與測試

使用 Node.js 24 與 npm：

```sh
npm ci --ignore-scripts
npm run check
```

正式建置的輸出位於 `dist/local-tags/`。個別檢查項目與發布流程，請參閱[開發說明](docs/development.md)。

## 專案方針

本專案不接受 Pull Request。歡迎透過 GitHub Issues 回報錯誤，我們會盡力處理。也可以提出功能需求，但其優先順序非常低。不保證持續維護、支援或新增功能。

## 授權

Copyright (C) 2026 mstksb.

本專案的原創程式碼採用 GNU General Public License 第 3 版授權，且僅限該版本（`GPL-3.0-only`）。完整條款請參閱 [LICENSE](LICENSE)。建置的 `main.js` 中也內嵌完整授權文字，因此即使 Obsidian 只安裝執行時所需檔案，仍會保留授權內容。

第三方元件保留各自的授權。其授權告知從正式建置的套件產生，並包含在 `THIRD-PARTY-NOTICES.txt` 與建置的 `main.js` 中。

## 文件與更新

| 檔案                                                                                                                                                                                                            | 用途與更新時機                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [README.md](README.md)                                                                                                                                                                                          | 專案概要、安裝方式、基本操作、專案方針與文件索引的英文原文；相關內容變更時，同步更新原文與翻譯。                                           |
| README 翻譯：[日本語](README.ja.md)、[简体中文](README.zh-CN.md)、[繁體中文](README.zh-TW.md)、[Español](README.es.md)、[Português (Brasil)](README.pt-BR.md)、[Deutsch](README.de.md)                          | 本 README 的翻譯；與英文原文同步更新。                                                                                                     |
| [AGENTS.md](AGENTS.md)                                                                                                                                                                                          | 本專案的編輯指示；儲存庫的作業規則或參考資料變更時更新。                                                                                   |
| [docs/usage.md](docs/usage.md)                                                                                                                                                                                  | 輸入規則、辨識限制、共用及個別筆記的外觀設定、標籤說明、面板操作、筆記內跳轉與搜尋注意事項的英文原文；相關內容變更時，同步更新原文與翻譯。 |
| 使用指南翻譯：[日本語](docs/usage.ja.md)、[简体中文](docs/usage.zh-CN.md)、[繁體中文](docs/usage.zh-TW.md)、[Español](docs/usage.es.md)、[Português (Brasil)](docs/usage.pt-BR.md)、[Deutsch](docs/usage.de.md) | 使用指南的翻譯；與英文原文同步更新。                                                                                                       |
| [docs/development.md](docs/development.md)                                                                                                                                                                      | 建置、測試、手動檢查、版本準備與發布流程；相關指令或流程變更時更新。                                                                       |
| [CHANGELOG.md](CHANGELOG.md)                                                                                                                                                                                    | 每次發布中使用者可見的變更；準備發布前更新。                                                                                               |
| [LICENSE](LICENSE)                                                                                                                                                                                              | 本專案原創程式碼的授權條款；授權聲明須與此檔案一致。                                                                                       |
