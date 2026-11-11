# Guia de uso

[English](usage.md) | [日本語](usage.ja.md) | [简体中文](usage.zh-CN.md) | [繁體中文](usage.zh-TW.md) | [Español](usage.es.md) | [Português (Brasil)](usage.pt-BR.md) | [Deutsch](usage.de.md)

Comece pelo [Início rápido do README](../README.pt-BR.md#quick-start) para inserir tags, usar o preenchimento automático, abrir o painel de tags e pesquisar. Este guia aborda regras de entrada, limites de reconhecimento, configurações compartilhadas e por nota de aparência, descrições de tags, ações do painel, navegação na nota e ressalvas da pesquisa.

<a id="input-rules"></a>

## Regras de entrada

- Use `##topic` para uma tag local e `/` para a hierarquia, como em `##people/Alex/work`; `## Heading` é um título Markdown.
- Os nomes distinguem maiúsculas de minúsculas, e nomes Unicode como `##people/Zoë` são aceitos.
- Um espaço, uma quebra de linha ou outro caractere de término de tag encerra a tag. Apenas `##` inicia o preenchimento automático, mas não constitui uma tag completa.
- Nomes compostos apenas de dígitos, ou de dígitos e `/`, são texto comum. Uma `/` no início, no fim ou repetida cria um nível vazio inválido na hierarquia.

<a id="recognition-limits"></a>

## Limites de reconhecimento

- Tags em trechos e blocos de código, metadados YAML (frontmatter), links e imagens, URLs, HTML e notações escapadas como `\##example` são excluídas.
- Títulos e corpos de callouts e células de tabelas aceitam tags locais com as mesmas exclusões.
- Tags em `%% comments %%` do Obsidian são incluídas no preenchimento automático e no painel de tags, mas não são exibidas em Reading View.

<a id="completion-settings"></a>

## Configurações de preenchimento automático

Abra **Settings → Local Tags** para escolher **Completion matching**. **Substring match** encontra nomes que contêm o texto digitado e é a opção padrão. **Prefix match** encontra nomes que começam com o texto digitado, incluindo o início de um nome hierárquico.

**Case-sensitive completion** fica desativado por padrão, inclusive em instalações existentes. Ative-o para distinguir maiúsculas de minúsculas. As sugestões mantêm a grafia original ao serem exibidas e inseridas, e a identidade das tags continua distinguindo maiúsculas de minúsculas.

O preenchimento automático prioriza correspondências exatas, depois correspondências por prefixo e, por fim, outras correspondências por trecho, com até dez sugestões do arquivo atual.

<a id="appearance-settings"></a>

## Configurações de aparência

Abra **Settings → Local Tags**. Essas configurações compartilhadas se aplicam em Source mode, Live Preview e Reading View.

| Rótulo da configuração     | Significado                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Local tag text color       | Define a cor do texto das tags locais válidas.                                                           |
| Local tag background color | Define a cor de fundo das tags.                                                                          |
| Local tag bold             | Segue o estilo padrão, ativa ou desativa o negrito.                                                      |
| Local tag underline        | Segue o estilo padrão, ativa ou desativa o sublinhado.                                                   |
| Local tag italic           | Segue o estilo padrão, ativa ou desativa o itálico.                                                      |
| Local tag vertical padding | Ajusta o espaçamento vertical de −5 a +5 px, em incrementos de 0,25 px; 0 restaura o espaçamento padrão. |

**Reset to theme** remove uma substituição de cor. Para negrito, sublinhado e itálico, escolha **Follow default**, **Enabled** ou **Disabled**.

**Hide local tag prefix when not editing** fica desativado por padrão. Quando ativado, as tags válidas ocultam `##` em Reading View e enquanto estão inativas em Live Preview. Posicionar o cursor dentro de uma tag ou selecioná-la exibe o prefixo. Source mode sempre exibe `##`, e o código Markdown permanece inalterado.

<a id="per-note-decoration"></a>

## Decoração por nota

<a id="configuration-format"></a>

### Formato da configuração

Adicione um título Markdown fora de listas, citações e outros contêineres, com o texto exatamente igual a `local-tags-config`, seguido de uma única lista não ordenada de definições de tags. Qualquer nível de título é aceito. A seção termina no próximo título de mesmo nível ou de nível superior, ou no fim da nota.

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

Cada tag tem seis configurações opcionais, exibidas abaixo na ordem usada por **Add missing settings** e **Remove empty settings**.

| Configuração       | Valores aceitos                                      |
| ------------------ | ---------------------------------------------------- |
| `text-color`       | Uma cor hexadecimal de seis dígitos, como `#ffffff`. |
| `background-color` | Uma cor hexadecimal de seis dígitos, como `#174266`. |
| `border-color`     | Uma cor hexadecimal de seis dígitos, como `#5da9e9`. |
| `bold`             | `on` ou `off`.                                       |
| `underline`        | `on` ou `off`.                                       |
| `italic`           | `on` ou `off`.                                       |

Os valores de cor aceitam tanto `#RRGGBB` quanto `\#RRGGBB`. Os controles de cor gravam a forma escapada para impedir que o valor da cor se torne uma tag padrão do Obsidian. Use `on` e `off` em minúsculas nas configurações de ênfase.

Seções existentes chamadas `local-tags` e configurações aninhadas em um item de lista `style` também são aceitas. Mantenha uma única seção de configuração e uma única definição por tag. Em cada definição, use atributos diretos ou um grupo `style`.

<a id="inheritance-and-errors"></a>

### Herança e erros

A decoração é calculada separadamente para cada configuração: começa nas configurações compartilhadas de aparência e nos padrões do tema, aplica cada ancestral configurado e, por fim, os valores da própria tag. O resultado se aplica em Source mode, Live Preview, Reading View e no painel de tags, dentro da nota atual.

Uma configuração ausente, um valor vazio como `italic:` ou uma definição de tag sem atributos herda o valor da tag-pai ou, no caso de uma tag raiz, das configurações compartilhadas. Valores vazios são válidos. Um `off` explícito substitui um `on` herdado.

No exemplo, `##project/review` herda a cor do texto, a cor da borda e o negrito de `##project` e fornece seus próprios valores de cor de fundo e sublinhado. Sua configuração de itálico segue as configurações compartilhadas ou o tema.

Um valor não vazio e inválido, como `text-color: red` ou `bold: yes`, aparece como erro no painel. A tag continua válida, suas outras configurações válidas continuam sendo aplicadas e a configuração inválida herda o valor da tag-pai ou das configurações compartilhadas. Corrija os erros antes de usar ações que gravam a configuração, incluindo a edição de cores.

Erros de estrutura, incluindo definições duplicadas, atributos duplicados, títulos de configuração duplicados ou definições distribuídas por listas separadas no nível superior, também impedem a gravação da configuração. A decoração anteriormente válida pode permanecer enquanto esses erros são corrigidos. Itens desconhecidos geram avisos e mantêm seu texto original.

As alterações de configuração são refletidas conforme a nota é editada ou alterada externamente.

<a id="tag-panel-actions"></a>

### Ações do painel de tags

Execute **Open tag panel**. As instruções de clique e Shift+clique aparecem acima da lista de tags. Expanda **Settings, actions and messages**. O resumo mostra **Errors** com a quantidade atual de erros, e a área é aberta quando um novo erro é relatado. As mensagens identificam a linha e a tag afetadas, quando disponíveis.

O campo **Target** mostra a tag cujo bloco de configuração contém o cursor de edição. Em qualquer outro lugar, ele mostra **All tags**. Em Reading View, o alvo é **All tags**. Esse alvo controla **Random decoration**.

Use um único cursor ao executar **Random decoration** no modo de edição. Vários cursores fazem a ação ser rejeitada, inclusive quando o alvo mostra **All tags**.

| Botão                      | Efeito                                                                                                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add missing settings**   | Adiciona definições para tags locais reconhecidas que ainda não têm uma e depois adiciona os atributos ausentes, com valores vazios, a todas as definições. Cria a seção de configuração, se necessário. Preserva os valores existentes e organiza os atributos na ordem mostrada acima. |
| **Remove empty settings**  | Remove atributos conhecidos vazios e organiza os restantes na ordem mostrada acima. Preserva as definições de tags, incluindo as que ficam sem atributos, e mantém os valores não vazios e o conteúdo associado.                                                                         |
| **Random decoration**      | No modo de edição, altera aleatoriamente a decoração da tag cujo bloco de configuração contém o único cursor. Com **All tags**, gera cores para as tags raiz para que suas descendentes as herdem. Reading View usa essa operação para toda a nota.                                      |
| **Sort settings**          | Ordena as definições de tags pelos nomes, distinguindo maiúsculas de minúsculas, e mantém junto o conteúdo de cada definição.                                                                                                                                                            |
| **Expand to tag headings** | Exibe as entradas de tags da configuração e recolhe suas listas de atributos em Source mode ou Live Preview. Isso altera os trechos recolhidos no editor.                                                                                                                                |

Por exemplo, **Remove empty settings** altera a configuração a seguir.

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

As definições resultantes mantêm as duas tags.

```md
- ##tag1
  - bold: on
- ##tag2
```

A decoração aleatória usa uma paleta fixa de cores complementares vívidas para texto, fundo e bordas. As cores existentes podem ser substituídas. Negrito, sublinhado e itálico mantêm seus valores atuais. Acrescente `.` antes de um atributo para preservá-lo durante a decoração aleatória, como em `.text-color: \#ffffff`. Um grupo `.style` exclui todos os seus atributos da decoração aleatória e mantém a decoração deles ativa.

<a id="color-swatches"></a>

### Amostras de cor

Em Source mode ou Live Preview, clique na amostra ao lado de uma cor válida na configuração. Insira uma cor hexadecimal de seis dígitos ou ajuste os controles deslizantes de matiz, saturação e luminosidade e escolha **Apply**. **Cancel** ou Esc fecha o seletor. Se a nota mudar enquanto o seletor estiver aberto, a atualização será cancelada para proteger o texto editado.

<a id="tag-descriptions"></a>

## Descrições de tags

Coloque uma descrição após o nome completo da tag, na mesma linha da declaração, na seção `local-tags-config` da nota.

```md
## local-tags-config

- ##project Work owned by this project
- ##project/review Review tasks for this project
```

A descrição pertence exatamente àquele nome de tag, distinguindo maiúsculas de minúsculas, na nota atual. Adicione uma descrição separada para cada tag-filha. Apenas o texto da linha da declaração é incluído. Comentários do Obsidian e HTML são removidos, assim como os espaços em branco no início e no fim. O Markdown e o HTML no restante da descrição são exibidos como texto simples.

As descrições aparecem ao lado de cada sugestão de preenchimento automático correspondente. Pressione Enter para inserir o nome da tag seguido de um espaço. Passe o ponteiro sobre uma tag em Source mode, Live Preview, Reading View ou no painel de tags para exibir a descrição após um pequeno intervalo. Dar foco a uma tag do painel com o teclado mostra a descrição imediatamente. Pressione Esc ou afaste o ponteiro para ocultá-la.

As descrições são atualizadas quando a nota muda. Valores inválidos de decoração podem gerar erros enquanto a descrição permanece disponível. Definições duplicadas impedem a exibição da descrição da tag afetada. Vários títulos de configuração ou listas de definições separadas impedem a exibição de todas as descrições até que a estrutura seja corrigida.

<a id="tag-panel-search"></a>

## Pesquisa no painel de tags

Execute **Open tag panel** e digite em **Search tags** para filtrar imediatamente a lista de tags da nota atual. A pesquisa faz correspondência por trecho nos nomes hierárquicos completos e nas [descrições](#tag-descriptions) associadas às tags exatas. A correspondência em inglês ignora maiúsculas e minúsculas; texto em japonês também é aceito. A identidade das tags e as configurações de preenchimento automático permanecem inalteradas.

Use as caixas de seleção **Tag name** e **Summary** para escolher os alvos da pesquisa. Ambas começam ativadas, e uma correspondência em qualquer uma delas é suficiente. Desativar ambas não mostra correspondências enquanto houver uma pesquisa digitada. Limpe a pesquisa ou insira apenas espaços em branco para restaurar a lista completa. Espaços em branco no início e no fim são ignorados.

As tags ancestrais permanecem visíveis para mostrar o caminho até uma tag-filha correspondente. A descrição de uma tag-pai correspondente não inclui tags-filhas sem relação com o resultado. As descrições pertencem exatamente às suas tags e não são herdadas para fins de pesquisa.

O campo de entrada e as caixas de seleção permanecem no lugar enquanto a lista é atualizada. A pesquisa e os alvos escolhidos são mantidos ao alternar entre notas, e cada nota usa suas próprias tags e descrições. Essas escolhas temporárias são redefinidas quando o painel é reaberto. Alterações nas descrições atualizam os resultados. Se não houver correspondência, aparece **No matching tags**.

Os controles de pesquisa e a mensagem de ausência de resultados usam japonês quando o idioma do Obsidian é japonês e inglês nos demais casos. Clicar em uma tag que permaneça na lista continua abrindo a pesquisa do Obsidian; Shift+clique continua navegando dentro da nota. Filtrar o painel não altera a nota nem a consulta de pesquisa do Obsidian.

<a id="in-note-navigation"></a>

## Navegação na nota

Use Shift+clique com o botão esquerdo em uma tag no painel, sem Ctrl, Command ou Alt, para rolar até sua primeira ocorrência na nota atual. Repita para visitar a próxima ocorrência na ordem do texto-fonte, voltando à primeira após a última. Uma tag-pai também corresponde às suas descendentes, de modo que `##people` inclui `##people/Alex`.

Source mode, Live Preview e Reading View destacam a linha correspondente e contornam a tag. Source mode e Live Preview preservam o cursor e a seleção do editor. A navegação também mantém o prefixo `##` oculto nas tags inativas de Live Preview quando a ocultação do prefixo está ativada. Seções recolhidas são expandidas para revelar a correspondência.

Em Reading View, uma lista aninhada destaca a linha exibida correspondente. Em Reading View e em tabelas renderizadas de Live Preview, o destaque de linha fica restrito à célula correspondente. Tags ocultas em `%% comments %%` são ignoradas em Reading View. Se não houver uma ocorrência visível disponível, um aviso sugere verificar a nota no modo de edição.

Editar a nota ou mudar o arquivo de destino, o painel Markdown ou o modo de exibição remove o destaque e reinicia o percurso. Escolher outra tag inicia o percurso na primeira ocorrência dessa tag. Desativar o plugin remove o destaque.

<a id="search-caveats"></a>

## Ressalvas da pesquisa

Clicar em uma tag no painel substitui a consulta de pesquisa existente no Obsidian por uma pesquisa de texto no arquivo atual e na tag. Os resultados podem incluir texto em locais excluídos do reconhecimento de tags, como blocos de código.
