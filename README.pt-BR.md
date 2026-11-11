# Local Tags

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

O Local Tags adiciona `##tags` locais a cada arquivo no Obsidian. Use o mesmo nome de tag em notas diferentes sem misturar as sugestões de preenchimento automático ou as listas de tags.

Consulte [Releases](https://github.com/mstksb/obsidian-local-tags/releases) para obter os pacotes publicados ou instale **Local Tags** em **Settings → Community plugins → Browse** no Obsidian.

## Recursos

- Escreva tags como `##project` e tags hierárquicas como `##people/Alex`.
- Complete nomes de tags a partir do arquivo Markdown atual.
- Veja as descrições de tags de cada nota ao lado das sugestões de preenchimento automático e em dicas de ferramenta na nota e no painel de tags.
- Escolha a correspondência por trecho ou por prefixo no preenchimento automático, com distinção opcional entre maiúsculas e minúsculas.
- Exiba tags nos modos Source mode, Live Preview e Reading View.
- Navegue pelas tags do arquivo atual em um painel hierárquico e filtre-as instantaneamente por nome ou descrição.
- Clique em uma tag no painel para pesquisar seu texto no arquivo atual.
- Use Shift+clique em uma tag para percorrer suas ocorrências, com destaque na linha e um contorno ao redor da tag encontrada.
- Ajuste a cor do texto, a cor de fundo, a ênfase e o espaçamento vertical compartilhados nas configurações do plugin.
- Armazene cores de texto, fundo e borda, além de configurações de negrito, sublinhado e itálico, por nota em `local-tags-config`, com herança das tags-pai para as tags-filhas.
- Adicione configurações ausentes, remova configurações vazias, gere cores complementares vívidas, ordene definições e expanda a configuração até os títulos de tags pelo painel de tags.
- Edite as cores da configuração por meio de amostras de cor no próprio texto, em Source mode e Live Preview, e consulte os erros de configuração no painel.

- Oculte opcionalmente `##` em Reading View e nas tags inativas de Live Preview.

## Veja em ação

O preenchimento automático, as listas hierárquicas de tags e a pesquisa por clique seguem interações conhecidas com tags. O Local Tags acrescenta um vocabulário separado para cada nota, decoração aleatória por nota e navegação com Shift+clique.

### Filtre a lista de tags enquanto digita

Digite em **Search tags** para filtrar imediatamente a lista de tags da nota atual. Use as caixas de seleção **Tag name** e **Summary** para pesquisar nomes, descrições ou ambos. A correspondência ignora maiúsculas e minúsculas e mantém visíveis as tags ancestrais dos resultados. Limpe a pesquisa para restaurar a lista completa. Consulte [Pesquisa no painel de tags](docs/usage.pt-BR.md#tag-panel-search) para mais detalhes.

![Digitando uma pesquisa e alternando os filtros de nome de tag e descrição no painel de tags](assets/demos/tag-panel-search.gif)

### Complete tags enquanto digita

Digite `##`, refine as sugestões e pressione Enter para inserir uma tag. As sugestões vêm do arquivo Markdown atual. Com a correspondência por trecho, `##rev` encontra `##launch/review`.

![Digitando parte de uma tag, escolhendo uma sugestão e inserindo a tag completa](assets/demos/completion.gif)

### Mantenha as tags de cada nota separadas

Alterne entre Launch plan e Garden plan para ver as sugestões de preenchimento automático e o painel de tags acompanharem a nota ativa. As `#tags` padrão são indexadas em todo o cofre. As `##tags` locais têm um vocabulário separado em cada arquivo.

![A troca de notas altera a lista de tags locais e as sugestões de preenchimento automático](assets/demos/file-local-tags.gif)

### Tenha o significado das tags sempre à mão

Adicione uma descrição curta após a declaração de uma tag, na mesma linha, em `local-tags-config`. As descrições aparecem ao lado das sugestões de preenchimento automático e ao passar o ponteiro sobre uma tag na nota ou no painel de tags. Pressione Enter para inserir apenas a tag. Consulte [Descrições de tags](docs/usage.pt-BR.md#tag-descriptions) para conhecer o formato.

![Descrições de tags nas sugestões de preenchimento automático e ao passar o ponteiro na nota e no painel de tags](assets/demos/tag-summaries.gif)

### Adicione cores com um clique

Escolha **Random decoration** para gerar cores complementares vívidas para as tags da nota atual. A demonstração usa Live Preview. As configurações de decoração ficam na seção `local-tags-config` da nota.

![Random decoration altera as cores das tags na nota e no painel de tags](assets/demos/random-decoration.gif)

### Use Shift+clique para navegar entre ocorrências

Mantenha Shift pressionado e clique em uma tag no painel para visitar suas ocorrências na nota atual. O destaque de linha e o contorno ao redor da tag encontrada indicam a posição atual.

![Shift+clique em uma tag percorre três ocorrências destacadas](assets/demos/shift-click-navigation.gif)

### Clique para abrir a pesquisa do Obsidian

Clique em uma tag no painel para abrir o painel padrão de pesquisa do Obsidian, com o arquivo atual e o texto da tag já preenchidos. Os resultados da pesquisa ficam restritos a essa nota.

![Clicar em uma tag abre o painel padrão de pesquisa com resultados da nota atual](assets/demos/click-search.gif)

## Requisitos

Obsidian `1.14.4` ou posterior para desktop. O Local Tags é um plugin exclusivo para desktop.

## Instalação

Para uma cópia compilada localmente, coloque `main.js`, `manifest.json`, `styles.css`, `LICENSE` e `THIRD-PARTY-NOTICES.txt` de `dist/local-tags/` em `<vault>/.obsidian/plugins/local-tags/` e ative **Local Tags** nas configurações de plugins da comunidade do Obsidian.

Após substituir uma versão instalada, desative e reative o plugin. Se uma nova instalação não aparecer na lista de plugins, reabra o cofre.

<a id="quick-start"></a>

## Início rápido

1. Adicione `##project` ou `##people/Alex` a uma nota Markdown.
2. Digite `##` e parte do nome de uma tag existente, selecione uma sugestão e pressione Enter para aceitar; pressione Esc para cancelar.
3. Execute o comando **Open tag panel** para abrir o painel de tags.
4. Clique em uma tag no painel para pesquisar no arquivo atual ou use Shift+clique para percorrer as tags correspondentes na nota.
5. Abra **Settings → Local Tags** para ajustar a aparência das tags.
6. Para decorar as tags por nota, expanda **Settings, actions and messages** no painel e escolha **Add missing settings**. Preencha os valores gerados ou escolha **Random decoration** para gerar cores.

As tags locais usam `##` e são separadas das `#tags` padrão do Obsidian.

Consulte o [Guia de uso](docs/usage.pt-BR.md) para conhecer as regras de entrada, os limites de reconhecimento, as configurações compartilhadas de aparência, a decoração por nota, as descrições de tags, as ações do painel, a navegação na nota e as ressalvas da pesquisa.

## Limitações

Espera-se que o uso básico com textos em inglês e japonês funcione, mas ele não foi verificado de forma abrangente. O comportamento com outros idiomas ainda não foi verificado.

O README e o guia de uso estão disponíveis em sete versões de idioma. As traduções da documentação não alteram os idiomas da interface do plugin nem significam que o reconhecimento de tags e o comportamento dos métodos de entrada foram verificados nesses idiomas.

## Compilação e testes

Use Node.js 24 e npm:

```sh
npm ci --ignore-scripts
npm run check
```

A compilação de produção é gravada em `dist/local-tags/`. Consulte [Development](docs/development.md), em inglês, para conhecer as verificações individuais e o processo de lançamento.

## Política do projeto

Este projeto não aceita pull requests. Relatos de bugs são bem-vindos pelo GitHub Issues e são tratados conforme a disponibilidade. Solicitações de recursos também podem ser enviadas, mas têm prioridade muito baixa. Não há garantia de manutenção contínua, suporte ou novos recursos.

## Licença

Copyright (C) 2026 mstksb.

O código original do projeto é licenciado sob a GNU General Public License, somente versão 3 (`GPL-3.0-only`). Consulte [LICENSE](LICENSE) para conhecer os termos completos. O texto integral da licença também está incorporado ao `main.js` compilado, para ser preservado quando o Obsidian instala apenas os arquivos necessários à execução.

Os componentes de terceiros mantêm suas respectivas licenças. Os avisos correspondentes são gerados a partir do pacote de produção e incluídos em `THIRD-PARTY-NOTICES.txt` e no `main.js` compilado.

## Documentação e atualizações

| Arquivo                                                                                                                                                                                                                     | Finalidade e condições de atualização                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                                                                                                                                                                                                      | Original em inglês da visão geral do projeto, instalação, operações básicas, política do projeto e índice de documentos; atualizar o original e suas traduções quando esses itens mudarem.                                                                                   |
| Traduções do README: [日本語](README.ja.md), [简体中文](README.zh-CN.md), [繁體中文](README.zh-TW.md), [Español](README.es.md), [Português (Brasil)](README.pt-BR.md), [Deutsch](README.de.md)                              | Traduções deste README; atualizar junto com o original em inglês.                                                                                                                                                                                                            |
| [AGENTS.md](AGENTS.md)                                                                                                                                                                                                      | Instruções de edição específicas do projeto; atualizar quando as regras de trabalho ou as referências do repositório mudarem.                                                                                                                                                |
| [docs/usage.md](docs/usage.md)                                                                                                                                                                                              | Original em inglês das regras de entrada, limites de reconhecimento, configurações compartilhadas e por nota de aparência, descrições de tags, ações do painel, navegação na nota e ressalvas da pesquisa; atualizar o original e suas traduções quando esses itens mudarem. |
| Traduções do guia de uso: [日本語](docs/usage.ja.md), [简体中文](docs/usage.zh-CN.md), [繁體中文](docs/usage.zh-TW.md), [Español](docs/usage.es.md), [Português (Brasil)](docs/usage.pt-BR.md), [Deutsch](docs/usage.de.md) | Traduções do guia de uso; atualizar junto com o original em inglês.                                                                                                                                                                                                          |
| [docs/development.md](docs/development.md)                                                                                                                                                                                  | Compilação, testes, verificações manuais, preparação de versões e procedimento de lançamento; atualizar quando esses comandos ou processos mudarem.                                                                                                                          |
| [CHANGELOG.md](CHANGELOG.md)                                                                                                                                                                                                | Alterações visíveis para os usuários em cada versão; atualizar antes de preparar uma versão.                                                                                                                                                                                 |
| [LICENSE](LICENSE)                                                                                                                                                                                                          | Termos da licença do código original do projeto; manter as declarações de licença consistentes com esse arquivo.                                                                                                                                                             |
