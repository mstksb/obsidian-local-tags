# 使用指南

[English](usage.md) | [日本語](usage.ja.md) | [简体中文](usage.zh-CN.md) | [繁體中文](usage.zh-TW.md) | [Español](usage.es.md) | [Português (Brasil)](usage.pt-BR.md) | [Deutsch](usage.de.md)

标签输入、补全、标签面板和搜索的基本操作，请先阅读 [README 快速开始](../README.zh-CN.md#quick-start)。本指南介绍输入规则、识别限制、共用与笔记级外观设置、标签描述、面板操作、笔记内跳转和搜索注意事项。

<a id="input-rules"></a>

## 输入规则

- 使用 `##topic` 表示本地标签，使用 `/` 表示层级，例如 `##people/Alex/work`；`## Heading` 仍是 Markdown 标题。
- 名称区分大小写，并支持 `##people/Zoë` 这样的 Unicode 名称。
- 空格、换行或其他标签终止字符会结束标签。单独的 `##` 会启动补全，但不构成完整标签。
- 仅由数字，或数字和 `/` 组成的名称视为普通文本。开头、结尾或连续出现的 `/` 会产生无效的空层级。

<a id="recognition-limits"></a>

## 识别限制

- 行内代码、代码块、YAML frontmatter、链接、图片、URL、HTML，以及 `\##example` 这样的转义写法中的标签不参与识别。
- Callout（标注块）的标题和正文，以及表格单元格支持本地标签，并遵循相同的排除规则。
- Obsidian `%% comments %%` 中的标签会纳入补全和标签面板，但不会显示在 Reading View 中。

<a id="completion-settings"></a>

## 补全设置

打开 **Settings → Local Tags**，选择 **Completion matching**。**Substring match** 查找包含输入内容的名称，是默认设置。**Prefix match** 查找以输入内容开头的名称，包括层级名称的开头。

**Case-sensitive completion** 默认关闭，现有安装也如此。启用后会分别比较大小写字母。补全建议在显示和插入时会保留原有拼写，标签名本身仍区分大小写。

补全建议按完全匹配、前缀匹配、其他子串匹配的顺序排列，最多显示当前文件中的十个建议。

<a id="appearance-settings"></a>

## 外观设置

打开 **Settings → Local Tags**。这些共用设置适用于 Source mode（源码模式）、Live Preview（实时预览）和 Reading View（阅读视图）。

| 设置名称                   | 含义                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| Local tag text color       | 设置有效本地标签的文字颜色。                                               |
| Local tag background color | 设置标签背景颜色。                                                         |
| Local tag bold             | 使用默认样式、启用粗体或禁用粗体。                                         |
| Local tag underline        | 使用默认样式、启用下划线或禁用下划线。                                     |
| Local tag italic           | 使用默认样式、启用斜体或禁用斜体。                                         |
| Local tag vertical padding | 以 0.25 px 为步长，在 −5 至 +5 px 范围内调整垂直内边距；0 恢复默认内边距。 |

**Reset to theme** 清除颜色覆盖设置。对于粗体、下划线和斜体，可选择 **Follow default**、**Enabled** 或 **Disabled**。

**Hide local tag prefix when not editing** 默认关闭。启用后，有效标签在 Reading View 中，以及在 Live Preview 中未处于编辑状态时，会隐藏 `##`。将光标移入标签或选中标签时会显示前缀。Source mode 始终显示 `##`，Markdown 源码保持不变。

<a id="per-note-decoration"></a>

## 笔记级装饰

<a id="configuration-format"></a>

### 配置格式

添加一个顶层 Markdown 标题，标题文本必须为 `local-tags-config`，其后使用一个无序列表定义标签。标题可以使用任意级别。配置区域在下一个同级或更高级别的标题处结束；如果没有，则延续到笔记末尾。

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

每个标签有六个可选设置。下表顺序也用于 **Add missing settings** 和 **Remove empty settings**。

| 设置               | 可接受的值                         |
| ------------------ | ---------------------------------- |
| `text-color`       | 六位十六进制颜色，例如 `#ffffff`。 |
| `background-color` | 六位十六进制颜色，例如 `#174266`。 |
| `border-color`     | 六位十六进制颜色，例如 `#5da9e9`。 |
| `bold`             | `on` 或 `off`。                    |
| `underline`        | `on` 或 `off`。                    |
| `italic`           | `on` 或 `off`。                    |

颜色值支持 `#RRGGBB` 和 `\#RRGGBB` 两种形式。颜色控件会写入转义形式，以免颜色值被识别为标准 Obsidian 标签。强调样式设置使用小写的 `on` 和 `off`。

也支持现有的 `local-tags` 区域，以及嵌套在 `style` 列表项下的设置。请只保留一个配置区域，每个标签只定义一次。在同一个定义中，应选择直接属性或 `style` 分组中的一种写法。

<a id="inheritance-and-errors"></a>

### 继承与错误

每个设置分别计算最终装饰：先采用共用外观设置和主题默认值，再应用已配置的祖先标签设置，最后应用标签自身的值。结果在当前笔记的 Source mode、Live Preview、Reading View 和标签面板中生效。

缺少设置、值为空（例如 `italic:`）或没有属性的标签定义，会继承父标签的值；根标签则继承共用设置。空值是有效的。显式设置的 `off` 会覆盖继承的 `on`。

上例中，`##project/review` 从 `##project` 继承文字颜色、边框颜色和粗体设置，并使用自身的背景颜色和下划线设置。斜体设置遵循共用设置或主题。

非空的无效值（例如 `text-color: red` 或 `bold: yes`）会在面板中显示为错误。标签仍然有效，有效设置仍会应用，无效设置则继承父标签或共用设置。在使用会写入配置的操作（包括颜色编辑）之前，请先修正错误。

结构错误也会阻止配置写入，包括重复定义、重复属性、重复配置标题，或将定义拆分到多个独立的顶层列表中。修正这些错误期间，先前有效的装饰可能继续保留。未知项会产生警告，并保留其源码文本。

编辑笔记或从外部修改笔记后，配置变更会随之反映。

<a id="tag-panel-actions"></a>

### 标签面板操作

运行 **Open tag panel**。点击和按住 Shift 点击的操作说明显示在标签列表上方。展开 **Settings, actions and messages**。其摘要会显示 **Errors** 和当前错误数量；报告新错误时，该区域会自动展开。消息会尽可能指出受影响的行和标签。

如果编辑器光标位于某个标签的配置块内，**Target** 会显示该标签。在其他位置则显示 **All tags**。在 Reading View 中，目标始终为 **All tags**。该目标决定 **Random decoration** 的作用范围。

在编辑模式中运行 **Random decoration** 时，请只使用一个光标。存在多个光标时，即使目标显示为 **All tags**，操作也会被拒绝。

| 按钮                       | 效果                                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add missing settings**   | 为尚未定义的已识别本地标签添加定义，然后为所有定义补充缺少的属性，值留空。必要时创建配置区域。保留已有值，并按上表顺序排列属性。                          |
| **Remove empty settings**  | 移除值为空的已知属性，并按上表顺序排列剩余属性。保留标签定义，包括移除属性后为空的定义，同时保留非空值及附属内容。                                        |
| **Random decoration**      | 在编辑模式中，为包含唯一光标的配置块所对应的标签随机配色。当目标为 **All tags** 时，为根标签生成颜色，供子孙标签继承。Reading View 使用这种整篇笔记操作。 |
| **Sort settings**          | 按区分大小写的标签名排序标签定义，并将每个定义的内容保持在一起。                                                                                          |
| **Expand to tag headings** | 在 Source mode 或 Live Preview 中显示配置中的标签项，并折叠属性列表。此操作会更改编辑器的折叠状态。                                                       |

例如，**Remove empty settings** 会更改以下配置。

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

更改后的定义会保留两个标签。

```md
- ##tag1
  - bold: on
- ##tag2
```

随机装饰为文字、背景和边框颜色使用一组固定的鲜明互补色。现有颜色可能被替换。粗体、下划线和斜体保留当前值。在属性名前添加 `.` 可以在随机装饰时保留该属性，例如 `.text-color: \#ffffff`。`.style` 分组会将其所有属性排除在随机装饰之外，同时保留这些属性的装饰效果。

<a id="color-swatches"></a>

### 色块

在 Source mode 或 Live Preview 中，点击配置中有效颜色旁的色块。输入六位十六进制颜色，或调整色相、饱和度和亮度滑块，然后选择 **Apply**。选择 **Cancel** 或按 Esc 可关闭颜色选择器。如果笔记在颜色选择器打开期间发生更改，更新会被取消，以保护已编辑的文本。

<a id="tag-descriptions"></a>

## 标签描述

在笔记的 `local-tags-config` 区域中，将描述写在完整标签名之后，且与标签声明位于同一行。

```md
## local-tags-config

- ##project Work owned by this project
- ##project/review Review tasks for this project
```

描述属于当前笔记中名称完全相同、区分大小写的标签。请为每个子标签单独添加描述。只有声明行上的文本会被包含。Obsidian 注释和 HTML 注释会被移除，前后空白会被裁剪。剩余描述中的 Markdown 和 HTML 会以纯文本显示。

描述会显示在每个匹配的补全建议旁。按 Enter 会插入标签名和一个尾随空格。在 Source mode、Live Preview、Reading View 或标签面板中，将鼠标悬停在标签上，短暂延迟后即可显示描述。使用键盘聚焦面板中的标签时，会立即显示描述。按 Esc 或移开焦点可关闭描述。

笔记更改时，描述会刷新。装饰值无效时可能报告错误，但描述仍可使用。重复定义会使受影响标签的描述不再显示。存在多个配置标题，或定义分散在多个独立列表中时，所有描述都会停止显示，直到结构得到修正。

<a id="tag-panel-search"></a>

## 标签面板搜索

运行 **Open tag panel**，并在 **Search tags** 中输入内容，即可立即筛选当前笔记的标签列表。搜索对完整的层级标签名，以及附属于具体标签的[描述](#tag-descriptions)使用子串匹配。英文匹配不区分大小写，也支持日文文本。标签的区分规则和补全设置保持不变。

使用 **Tag name** 和 **Summary** 复选框选择搜索对象。两者初始均启用，任一对象匹配即符合条件。输入搜索内容时，若同时关闭两者，则不会显示匹配结果。清空搜索或只输入空白可恢复完整列表。搜索内容前后的空白会被忽略。

祖先标签会保留显示，以呈现通向匹配子标签的路径。父标签的描述匹配时，不会因此纳入无关的子标签。描述属于其对应的具体标签，不会通过继承参与搜索。

列表更新时，输入框和复选框保持原位。切换笔记时会保留当前搜索内容和搜索对象选择，每篇笔记使用自身的标签和描述。这些临时选择在重新打开面板时重置。描述编辑会更新结果。没有匹配项时显示 **No matching tags**。

当 Obsidian 的语言设为日语时，搜索控件和无结果消息使用日语；其他情况下使用英语。点击筛选后保留的标签仍会打开 Obsidian Search，按住 Shift 点击仍会在笔记内跳转。筛选面板不会更改笔记或 Obsidian 的搜索查询。

<a id="in-note-navigation"></a>

## 笔记内跳转

按住 Shift 并用鼠标左键点击面板中的标签，同时不要按 Ctrl、Command 或 Alt，即可滚动到该标签在当前笔记中第一次出现的位置。重复此操作会按源码顺序跳转到下一处，到达最后一处后返回第一处。父标签也会匹配其子孙标签，因此 `##people` 包括 `##people/Alex`。

Source mode、Live Preview 和 Reading View 会高亮匹配行，并为标签显示轮廓。Source mode 和 Live Preview 会保留编辑器光标和选区。启用前缀隐藏时，跳转也会保留 Live Preview 中未处于编辑状态标签的隐藏 `##` 前缀。折叠区域会展开以显示匹配项。

在 Reading View 中，嵌套列表会高亮匹配的显示行。在 Reading View 和已渲染的 Live Preview 表格中，行高亮仅限匹配的单元格。Reading View 会跳过隐藏在 `%% comments %%` 中的标签。如果没有可见的出现位置，会显示提示，建议在编辑模式中查看笔记。

编辑笔记，或更改目标文件、Markdown 窗格或显示模式，会清除高亮并重置循环。选择其他标签会从该标签的第一次出现位置开始。禁用插件会清除高亮。

<a id="search-caveats"></a>

## 搜索注意事项

点击面板中的标签，会将 Obsidian 当前的搜索查询替换为针对当前文件和标签的文本搜索。结果可能包含代码块等不参与标签识别位置中的文本。
