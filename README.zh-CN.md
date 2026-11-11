# Local Tags

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

Local Tags 为 Obsidian 添加仅在当前文件中有效的 `##tags`。你可以在不同笔记中使用相同的标签名，而不会混合补全建议或标签列表。

通过 **Settings → Community plugins → Browse** 安装 **Local Tags**，或前往 [Releases](https://github.com/mstksb/obsidian-local-tags/releases) 查看已发布的安装包。

## 功能

- 使用 `##project` 这样的标签，以及 `##people/Alex` 这样的层级标签。
- 根据当前 Markdown 文件中的标签补全名称。
- 在补全建议旁，以及笔记和标签面板的工具提示中，显示当前笔记的标签描述。
- 选择子串匹配或前缀匹配，并可设置补全是否区分大小写。
- 在 Source mode（源码模式）、Live Preview（实时预览）和 Reading View（阅读视图）中显示标签。
- 在层级面板中浏览当前文件的标签，并按名称或描述即时筛选。
- 点击面板中的标签，在当前文件中搜索其文本。
- 按住 Shift 点击标签，循环跳转到各次出现的位置，并通过行高亮和匹配标签的轮廓标出当前位置。
- 在插件设置中调整共用的文字颜色、背景颜色、强调样式和垂直内边距。
- 在 `local-tags-config` 中保存当前笔记的文字、背景、边框颜色，以及粗体、下划线和斜体设置，并支持从父标签向子标签继承。
- 通过标签面板补充缺少的设置、移除空设置、生成鲜明的互补色、排序定义，以及展开配置中的标签标题。
- 在 Source mode 和 Live Preview 中通过行内色块编辑配置颜色，并在面板中查看配置错误。
- 可在 Reading View 中，以及 Live Preview 中未处于编辑状态的标签上隐藏 `##`。

## 功能演示

补全、层级标签列表和点击搜索延续了常见的标签交互方式。Local Tags 还为每篇笔记提供独立的标签词汇、笔记级随机装饰，以及按住 Shift 点击进行跳转的功能。

### 输入时即时筛选标签列表

在 **Search tags** 中输入内容，即可立即缩小当前笔记的标签列表范围。通过 **Tag name** 和 **Summary** 复选框，选择搜索名称、描述或两者。匹配不区分大小写，并保留匹配标签的祖先标签。清空搜索即可恢复完整列表。详情参见[标签面板搜索](docs/usage.zh-CN.md#tag-panel-search)。

![在标签面板中输入搜索内容，并切换标签名称和描述筛选条件](assets/demos/tag-panel-search.gif)

### 输入时补全标签

输入 `##`，缩小建议范围，然后按 Enter 插入标签。建议来自当前 Markdown 文件。使用子串匹配时，`##rev` 可以找到 `##launch/review`。

![输入部分标签、选择补全建议并插入完整标签](assets/demos/completion.gif)

### 让每篇笔记拥有独立的标签

在 Launch plan 和 Garden plan 之间切换，可以看到补全建议和标签面板都会跟随当前笔记变化。标准 `#tags` 会在整个仓库中建立索引，而本地 `##tags` 为每个文件保留独立的标签词汇。

![切换笔记后，本地标签列表和补全建议随之变化](assets/demos/file-local-tags.gif)

### 随时查看标签含义

在 `local-tags-config` 下的标签声明行中，紧接标签添加简短描述。描述会显示在补全建议旁，也会在鼠标悬停于笔记或标签面板中的标签时显示。按 Enter 只插入标签。格式参见[标签描述](docs/usage.zh-CN.md#tag-descriptions)。

![标签描述显示在补全建议中，以及笔记和标签面板的悬停提示中](assets/demos/tag-summaries.gif)

### 一键添加颜色

选择 **Random decoration**，为当前笔记的标签生成鲜明的互补色。演示使用 Live Preview。装饰设置保存在笔记的 `local-tags-config` 区域中。

![Random decoration 更改笔记和标签面板中的标签颜色](assets/demos/random-decoration.gif)

### 按住 Shift 点击，在出现位置之间跳转

按住 Shift 并点击面板中的标签，即可依次跳转到该标签在当前笔记中出现的位置。行高亮和匹配标签的轮廓会标出当前位置。

![按住 Shift 点击标签，循环跳转到三个高亮显示的位置](assets/demos/shift-click-navigation.gif)

### 点击打开 Obsidian Search

点击面板中的标签，即可打开 Obsidian 的标准 Search 面板，并自动填入当前文件和标签文本。搜索结果限定在该笔记内。

![点击标签后，标准 Search 面板显示当前笔记中的搜索结果](assets/demos/click-search.gif)

## 运行要求

桌面版 Obsidian `1.14.4` 或更高版本。Local Tags 仅支持桌面端。

## 安装

如需安装本地构建的副本，请将 `dist/local-tags/` 中的 `main.js`、`manifest.json`、`styles.css`、`LICENSE` 和 `THIRD-PARTY-NOTICES.txt` 放入 `<vault>/.obsidian/plugins/local-tags/`，并在 Obsidian 的社区插件设置中启用 **Local Tags**。

替换已安装的构建后，请先禁用再重新启用插件。如果新安装的插件未出现在插件列表中，请重新打开仓库。

<a id="quick-start"></a>

## 快速开始

1. 在 Markdown 笔记中添加 `##project` 或 `##people/Alex`。
2. 输入 `##` 和已有标签名的一部分，选择建议并按 Enter 接受；按 Esc 取消。
3. 运行 **Open tag panel** 命令，打开标签面板。
4. 点击面板中的标签以搜索当前文件，或按住 Shift 点击，在笔记中的匹配标签之间循环跳转。
5. 打开 **Settings → Local Tags**，调整标签外观。
6. 如需设置当前笔记的装饰，展开面板中的 **Settings, actions and messages**，然后选择 **Add missing settings**。填写生成的值，或选择 **Random decoration** 生成颜色。

本地标签使用 `##`，与 Obsidian 的标准 `#tags` 相互独立。

有关输入规则、识别限制、共用外观设置、笔记级装饰、标签描述、面板操作、笔记内跳转和搜索注意事项，请参见[使用指南](docs/usage.zh-CN.md)。

## 限制

预计英文和日文文本的基本使用可以正常工作，但尚未经过全面验证。其他语言的行为仍未经验证。

README 和使用指南提供七种语言版本。文档翻译不会改变插件的界面语言支持范围，也不表示已验证这些语言的标签识别或输入法行为。

## 构建与测试

使用 Node.js 24 和 npm：

```sh
npm ci --ignore-scripts
npm run check
```

生产构建输出到 `dist/local-tags/`。各项检查和发布流程请参见[开发指南](docs/development.md)。

## 项目方针

本项目不接受拉取请求。欢迎通过 GitHub Issues 提交错误报告，维护者会尽力处理。也可以提交功能请求，但其优先级很低。不保证持续维护、支持或提供新功能。

## 许可证

Copyright (C) 2026 mstksb.

本项目的原创代码采用 GNU General Public License 第 3 版（仅限此版本，`GPL-3.0-only`）许可。完整条款参见 [LICENSE](LICENSE)。完整的许可证文本也嵌入构建后的 `main.js` 中，以便 Obsidian 仅安装运行所需文件时仍能保留该文本。

第三方组件保留各自的许可证。其声明根据生产构建包生成，并包含在 `THIRD-PARTY-NOTICES.txt` 和构建后的 `main.js` 中。

## 文档与更新

| 文件                                                                                                                                                                                                            | 用途与更新条件                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                                                                                                                                                                                          | 项目概述、安装、基本操作、项目方针和文档索引的英文原文；这些内容变化时，同步更新原文和译文。                                           |
| README 译文：[日本語](README.ja.md)、[简体中文](README.zh-CN.md)、[繁體中文](README.zh-TW.md)、[Español](README.es.md)、[Português (Brasil)](README.pt-BR.md)、[Deutsch](README.de.md)                          | 本 README 的译文；与英文原文同步更新。                                                                                                 |
| [AGENTS.md](AGENTS.md)                                                                                                                                                                                          | 项目专用的编辑指引；仓库工作规则或引用变化时更新。                                                                                     |
| [docs/usage.md](docs/usage.md)                                                                                                                                                                                  | 输入规则、识别限制、共用与笔记级外观设置、标签描述、面板操作、笔记内跳转和搜索注意事项的英文原文；这些内容变化时，同步更新原文和译文。 |
| 使用指南译文：[日本語](docs/usage.ja.md)、[简体中文](docs/usage.zh-CN.md)、[繁體中文](docs/usage.zh-TW.md)、[Español](docs/usage.es.md)、[Português (Brasil)](docs/usage.pt-BR.md)、[Deutsch](docs/usage.de.md) | 使用指南的译文；与英文原文同步更新。                                                                                                   |
| [docs/development.md](docs/development.md)                                                                                                                                                                      | 构建、测试、手动检查、版本准备和发布流程；相关命令或流程变化时更新。                                                                   |
| [CHANGELOG.md](CHANGELOG.md)                                                                                                                                                                                    | 各次发布中用户可见的变更；准备发布前更新。                                                                                             |
| [LICENSE](LICENSE)                                                                                                                                                                                              | 项目原创代码的许可条款；许可声明应与此文件保持一致。                                                                                   |
