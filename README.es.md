# Local Tags

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

Local Tags añade etiquetas `##tags` locales a cada archivo de Obsidian. Usa el mismo nombre de etiqueta en distintas notas sin mezclar sus sugerencias de autocompletado ni sus listas de etiquetas.

Consulta [Releases](https://github.com/mstksb/obsidian-local-tags/releases) para obtener los paquetes publicados, o instala **Local Tags** desde **Settings → Community plugins → Browse** en Obsidian.

## Funciones

- Escribe etiquetas como `##project` y etiquetas jerárquicas como `##people/Alex`.
- Autocompleta nombres de etiquetas del archivo Markdown actual.
- Muestra las descripciones de etiquetas de cada nota junto a las sugerencias de autocompletado y en información emergente dentro de la nota y del panel de etiquetas.
- Elige entre coincidencias por subcadena o por prefijo, con distinción opcional entre mayúsculas y minúsculas.
- Muestra las etiquetas en Source mode, Live Preview y Reading View.
- Explora las etiquetas del archivo actual en un panel jerárquico y fíltralas al instante por nombre o descripción.
- Haz clic en una etiqueta del panel para buscar su texto dentro del archivo actual.
- Usa Mayús+clic en una etiqueta para recorrer sus apariciones, con la línea resaltada y un contorno alrededor de la etiqueta coincidente.
- Ajusta el color del texto, el color de fondo, el formato y el espaciado vertical compartidos desde los ajustes del complemento.
- Guarda los colores de texto, fondo y borde, así como los ajustes de negrita, subrayado y cursiva de cada nota, en `local-tags-config`, con herencia de padres a hijos.
- Añade los ajustes que falten, elimina los ajustes vacíos, genera colores complementarios vivos, ordena las definiciones y expande la configuración hasta los encabezados de etiquetas desde el panel.
- Edita los colores de la configuración mediante muestras de color en Source mode y Live Preview, y consulta los errores de configuración en el panel.
- Oculta opcionalmente `##` en Reading View y en las etiquetas inactivas de Live Preview.

## Verlo en acción

El autocompletado, las listas jerárquicas de etiquetas y la búsqueda mediante clic siguen las interacciones habituales con etiquetas. Local Tags añade un vocabulario independiente para cada nota, formato aleatorio por nota y navegación con Mayús+clic.

### Filtrar la lista de etiquetas mientras escribes

Escribe en **Search tags** para filtrar inmediatamente la lista de etiquetas de la nota actual. Usa las casillas **Tag name** y **Summary** para buscar en los nombres, en las descripciones o en ambos. La búsqueda no distingue entre mayúsculas y minúsculas y mantiene visibles los antecesores de las etiquetas coincidentes. Borra la búsqueda para restaurar la lista completa. Consulta [Búsqueda en el panel de etiquetas](docs/usage.es.md#tag-panel-search) para obtener más información.

![Escribir una búsqueda y alternar los filtros de nombre de etiqueta y descripción en el panel](assets/demos/tag-panel-search.gif)

### Autocompletar etiquetas mientras escribes

Escribe `##`, filtra las sugerencias y pulsa Intro para insertar una etiqueta. Las sugerencias proceden del archivo Markdown actual. Con la coincidencia por subcadena, `##rev` encuentra `##launch/review`.

![Escribir parte de una etiqueta, elegir una sugerencia e insertar la etiqueta completa](assets/demos/completion.gif)

### Mantener las etiquetas de cada nota dentro de esa nota

Cambia de Launch plan a Garden plan para ver cómo las sugerencias de autocompletado y el panel de etiquetas siguen la nota activa. Las etiquetas estándar `#tags` se indexan en toda la bóveda. Las etiquetas locales `##tags` mantienen un vocabulario independiente en cada archivo.

![Al cambiar de nota, cambian la lista local de etiquetas y las sugerencias de autocompletado](assets/demos/file-local-tags.gif)

### Tener a mano el significado de las etiquetas

Añade una descripción breve después de la declaración de una etiqueta, en la misma línea, dentro de `local-tags-config`. Las descripciones aparecen junto a las sugerencias de autocompletado y al colocar el puntero sobre una etiqueta en la nota o en el panel. Pulsa Intro para insertar solo la etiqueta. Consulta [Descripciones de etiquetas](docs/usage.es.md#tag-descriptions) para conocer el formato.

![Las descripciones de etiquetas aparecen en las sugerencias y al colocar el puntero sobre ellas en la nota y en el panel](assets/demos/tag-summaries.gif)

### Añadir color con un clic

Elige **Random decoration** para generar colores complementarios vivos para las etiquetas de la nota actual. La demostración usa Live Preview. Los ajustes de formato se guardan en la sección `local-tags-config` de la nota.

![Random decoration cambia los colores de las etiquetas en la nota y en el panel](assets/demos/random-decoration.gif)

### Recorrer las apariciones con Mayús+clic

Mantén pulsada Mayús y haz clic en una etiqueta del panel para recorrer sus apariciones en la nota actual. Una línea resaltada y un contorno alrededor de la etiqueta coincidente indican la posición actual.

![Mayús+clic en una etiqueta recorre tres apariciones resaltadas](assets/demos/shift-click-navigation.gif)

### Abrir la búsqueda de Obsidian con un clic

Haz clic en una etiqueta del panel para abrir el panel estándar de búsqueda de Obsidian con el archivo actual y el texto de la etiqueta ya introducidos. Los resultados se limitan a esa nota.

![Al hacer clic en una etiqueta se abre el panel estándar de búsqueda con resultados de la nota actual](assets/demos/click-search.gif)

## Requisitos

Obsidian de escritorio `1.14.4` o posterior. Local Tags es un complemento exclusivo para escritorio.

## Instalación

Para una copia compilada localmente, coloca `main.js`, `manifest.json`, `styles.css`, `LICENSE` y `THIRD-PARTY-NOTICES.txt` de `dist/local-tags/` en `<vault>/.obsidian/plugins/local-tags/` y activa **Local Tags** en los ajustes de complementos de la comunidad de Obsidian.

Después de sustituir una compilación instalada, desactiva y vuelve a activar el complemento. Si una instalación nueva no aparece en la lista de complementos, vuelve a abrir la bóveda.

<a id="quick-start"></a>

## Inicio rápido

1. Añade `##project` o `##people/Alex` a una nota Markdown.
2. Escribe `##` y parte del nombre de una etiqueta existente, selecciona una sugerencia y pulsa Intro para aceptarla; pulsa Esc para cancelar.
3. Ejecuta el comando **Open tag panel** para abrir el panel de etiquetas.
4. Haz clic en una etiqueta del panel para buscar en el archivo actual, o usa Mayús+clic para recorrer las etiquetas coincidentes de la nota.
5. Abre **Settings → Local Tags** para ajustar el aspecto de las etiquetas.
6. Para aplicar formato por nota, expande **Settings, actions and messages** en el panel y elige **Add missing settings**. Rellena los valores generados o elige **Random decoration** para generar colores.

Las etiquetas locales usan `##` y son independientes de las etiquetas estándar `#tags` de Obsidian.

Consulta la [Guía de uso](docs/usage.es.md) para conocer las reglas de entrada, los límites del reconocimiento, los ajustes de aspecto compartidos, el formato por nota, las descripciones de etiquetas, las acciones del panel, la navegación dentro de la nota y las consideraciones sobre la búsqueda.

## Limitaciones

Se espera que el uso básico con texto en inglés y japonés funcione, pero no se ha verificado de forma exhaustiva. El comportamiento con otros idiomas sigue sin verificarse.

El README y la guía de uso están disponibles en siete versiones lingüísticas. Las traducciones de la documentación no cambian los idiomas de la interfaz del complemento ni demuestran que se hayan verificado el reconocimiento de etiquetas y el comportamiento de los métodos de entrada en esos idiomas.

## Compilación y pruebas

Usa Node.js 24 y npm:

```sh
npm ci --ignore-scripts
npm run check
```

La compilación de producción se genera en `dist/local-tags/`. Consulta [Development](docs/development.md) para conocer las comprobaciones individuales y el proceso de publicación.

## Política del proyecto

Este proyecto no acepta solicitudes de incorporación de cambios (pull requests). Se aceptan informes de errores mediante GitHub Issues y se atienden en la medida de lo posible. También pueden enviarse solicitudes de funciones, pero tienen una prioridad muy baja. No se garantizan el mantenimiento continuo, el soporte ni nuevas funciones.

## Licencia

Copyright (C) 2026 mstksb.

El código original del proyecto está disponible bajo la Licencia Pública General de GNU, versión 3 únicamente (`GPL-3.0-only`). Consulta [LICENSE](LICENSE) para ver las condiciones completas. El texto completo de la licencia también se incluye en el archivo `main.js` compilado para conservarlo cuando Obsidian instala solo los archivos de ejecución.

Los componentes de terceros conservan sus respectivas licencias. Sus avisos se generan a partir del paquete de producción y se incluyen en `THIRD-PARTY-NOTICES.txt` y en el archivo `main.js` compilado.

## Documentación y actualizaciones

| Archivo                                                                                                                                                                                                                           | Finalidad y condiciones de actualización                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                                                                                                                                                                                                            | Original en inglés de la descripción del proyecto, instalación, operaciones básicas, política del proyecto e índice de documentación; actualizarlo junto con sus traducciones cuando cambien.                                                                                                 |
| Traducciones del README: [日本語](README.ja.md), [简体中文](README.zh-CN.md), [繁體中文](README.zh-TW.md), [Español](README.es.md), [Português (Brasil)](README.pt-BR.md), [Deutsch](README.de.md)                                | Traducciones de este README; actualizar junto con el original en inglés.                                                                                                                                                                                                                      |
| [AGENTS.md](AGENTS.md)                                                                                                                                                                                                            | Instrucciones de edición específicas del proyecto; actualizar cuando cambien las reglas de trabajo o las referencias del repositorio.                                                                                                                                                         |
| [docs/usage.md](docs/usage.md)                                                                                                                                                                                                    | Original en inglés de las reglas de entrada, límites del reconocimiento, ajustes de aspecto compartidos y por nota, descripciones de etiquetas, acciones del panel, navegación dentro de la nota y consideraciones sobre la búsqueda; actualizarlo junto con sus traducciones cuando cambien. |
| Traducciones de la guía de uso: [日本語](docs/usage.ja.md), [简体中文](docs/usage.zh-CN.md), [繁體中文](docs/usage.zh-TW.md), [Español](docs/usage.es.md), [Português (Brasil)](docs/usage.pt-BR.md), [Deutsch](docs/usage.de.md) | Traducciones de la guía de uso; actualizar junto con el original en inglés.                                                                                                                                                                                                                   |
| [docs/development.md](docs/development.md)                                                                                                                                                                                        | Compilación, pruebas, comprobaciones manuales, preparación de versiones y procedimiento de publicación; actualizar cuando cambien los comandos o los procesos.                                                                                                                                |
| [CHANGELOG.md](CHANGELOG.md)                                                                                                                                                                                                      | Cambios visibles para el usuario en cada versión; actualizar antes de preparar una versión.                                                                                                                                                                                                   |
| [LICENSE](LICENSE)                                                                                                                                                                                                                | Condiciones de licencia del código original del proyecto; mantener coherentes las declaraciones sobre licencias.                                                                                                                                                                              |
