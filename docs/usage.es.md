# Guía de uso

[English](usage.md) | [日本語](usage.ja.md) | [简体中文](usage.zh-CN.md) | [繁體中文](usage.zh-TW.md) | [Español](usage.es.md) | [Português (Brasil)](usage.pt-BR.md) | [Deutsch](usage.de.md)

Comienza por el [Inicio rápido del README](../README.es.md#quick-start) para introducir etiquetas, usar el autocompletado, abrir el panel y realizar búsquedas. Esta guía explica las reglas de entrada, los límites del reconocimiento, los ajustes de aspecto compartidos y por nota, las descripciones de etiquetas, las acciones del panel, la navegación dentro de la nota y las consideraciones sobre la búsqueda.

<a id="input-rules"></a>

## Reglas de entrada

- Usa `##topic` para una etiqueta local y `/` para la jerarquía, por ejemplo `##people/Alex/work`; `## Heading` es un encabezado Markdown.
- Los nombres distinguen entre mayúsculas y minúsculas, y se admiten nombres Unicode como `##people/Zoë`.
- Un espacio, un salto de línea u otro carácter de cierre termina una etiqueta. Un `##` aislado inicia el autocompletado, pero no es una etiqueta completa.
- Los nombres formados solo por dígitos, o por dígitos y `/`, son texto normal. Una `/` inicial, final o repetida crea un nivel jerárquico vacío no válido.

<a id="recognition-limits"></a>

## Límites del reconocimiento

- Se excluyen las etiquetas en fragmentos y bloques de código, metadatos YAML iniciales, enlaces e imágenes, URL, HTML y notaciones escapadas como `\##example`.
- Los títulos y el contenido de los bloques de aviso (callouts), así como las celdas de tablas, admiten etiquetas locales con las mismas exclusiones.
- Las etiquetas en `%% comments %%` de Obsidian se incluyen en el autocompletado y en el panel, pero no se muestran en Reading View.

<a id="completion-settings"></a>

## Ajustes de autocompletado

Abre **Settings → Local Tags** para elegir **Completion matching**. **Substring match** busca nombres que contengan el texto introducido y es la opción predeterminada. **Prefix match** busca nombres que comiencen por el texto introducido, incluido el inicio de un nombre jerárquico.

**Case-sensitive completion** está desactivado de forma predeterminada, también en las instalaciones existentes. Actívalo para distinguir entre mayúsculas y minúsculas al comparar. Las sugerencias conservan la escritura original al mostrarse y al insertarse, y la identidad de las etiquetas sigue distinguiendo entre mayúsculas y minúsculas.

El autocompletado muestra primero las coincidencias exactas, después las coincidencias por prefijo y, por último, las demás coincidencias por subcadena, con un máximo de diez sugerencias del archivo actual.

<a id="appearance-settings"></a>

## Ajustes de aspecto

Abre **Settings → Local Tags**. Estos ajustes compartidos se aplican en Source mode, Live Preview y Reading View.

| Etiqueta del ajuste        | Significado                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Local tag text color       | Establece el color del texto de las etiquetas locales válidas.                                                |
| Local tag background color | Establece el color de fondo de las etiquetas.                                                                 |
| Local tag bold             | Usa el estilo predeterminado, activa la negrita o la desactiva.                                               |
| Local tag underline        | Usa el estilo predeterminado, activa el subrayado o lo desactiva.                                             |
| Local tag italic           | Usa el estilo predeterminado, activa la cursiva o la desactiva.                                               |
| Local tag vertical padding | Ajusta el espaciado vertical de −5 a +5 px en incrementos de 0.25 px; 0 restaura el espaciado predeterminado. |

**Reset to theme** elimina un color personalizado. Para negrita, subrayado y cursiva, elige **Follow default**, **Enabled** o **Disabled**.

**Hide local tag prefix when not editing** está desactivado de forma predeterminada. Al activarlo, las etiquetas válidas ocultan `##` en Reading View y mientras están inactivas en Live Preview. Colocar el cursor dentro de una etiqueta o seleccionarla muestra el prefijo. Source mode siempre muestra `##`, y el código Markdown permanece sin cambios.

<a id="per-note-decoration"></a>

## Formato por nota

<a id="configuration-format"></a>

### Formato de la configuración

Añade un encabezado Markdown fuera de listas y otros bloques anidados cuyo texto sea exactamente `local-tags-config`, seguido de una única lista no ordenada de definiciones de etiquetas. Se admite cualquier nivel de encabezado. La sección termina en el siguiente encabezado del mismo nivel o de uno superior, o al final de la nota.

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

Cada etiqueta tiene seis ajustes opcionales, mostrados a continuación en el orden utilizado por **Add missing settings** y **Remove empty settings**.

| Ajuste             | Valores admitidos                                     |
| ------------------ | ----------------------------------------------------- |
| `text-color`       | Un color hexadecimal de seis dígitos, como `#ffffff`. |
| `background-color` | Un color hexadecimal de seis dígitos, como `#174266`. |
| `border-color`     | Un color hexadecimal de seis dígitos, como `#5da9e9`. |
| `bold`             | `on` u `off`.                                         |
| `underline`        | `on` u `off`.                                         |
| `italic`           | `on` u `off`.                                         |

Los valores de color admiten tanto `#RRGGBB` como `\#RRGGBB`. Los controles de color escriben la forma escapada para evitar que el valor del color se convierta en una etiqueta estándar de Obsidian. Usa `on` y `off` en minúsculas para los ajustes de formato.

También se admiten las secciones existentes llamadas `local-tags` y los ajustes anidados en un elemento de lista `style`. Mantén una sola sección de configuración y una definición por etiqueta. Usa atributos directos o un grupo `style` dentro de cada definición.

<a id="inheritance-and-errors"></a>

### Herencia y errores

El formato se resuelve por separado para cada ajuste: se parte de los ajustes de aspecto compartidos y de los valores predeterminados del tema, se aplican los valores de cada antecesor configurado y, por último, los de la propia etiqueta. El resultado se aplica en Source mode, Live Preview, Reading View y el panel de etiquetas, dentro de la nota actual.

Un ajuste ausente, un valor vacío como `italic:` o una definición de etiqueta sin atributos hereda el valor del padre; en una etiqueta raíz, lo hereda de los ajustes compartidos. Los valores vacíos son válidos. Un `off` explícito prevalece sobre un `on` heredado.

En el ejemplo, `##project/review` hereda de `##project` el color del texto, el color del borde y el ajuste de negrita, y aporta su propio color de fondo y ajuste de subrayado. Su ajuste de cursiva sigue los ajustes compartidos o el tema.

Un valor no vacío que no sea válido, como `text-color: red` o `bold: yes`, aparece como error en el panel. La etiqueta sigue siendo válida, sus demás ajustes válidos se siguen aplicando y el ajuste no válido hereda del padre o de los ajustes compartidos. Corrige los errores antes de usar acciones que escriban en la configuración, incluida la edición de colores.

Los errores estructurales, incluidas las definiciones duplicadas, los atributos duplicados, los encabezados de configuración duplicados o las definiciones repartidas en distintas listas de nivel superior, también impiden escribir en la configuración. El formato válido anterior puede mantenerse mientras se corrigen estos errores. Los elementos desconocidos generan advertencias y conservan su texto original.

Los cambios en la configuración se reflejan al editar la nota o al modificarla externamente.

<a id="tag-panel-actions"></a>

### Acciones del panel de etiquetas

Ejecuta **Open tag panel**. Encima de la lista aparecen instrucciones para hacer clic y Mayús+clic. Expande **Settings, actions and messages**. Su resumen muestra **Errors** con el número actual de errores, y el área se abre cuando se informa de un nuevo error. Los mensajes identifican la línea y la etiqueta afectadas cuando se dispone de esa información.

El indicador **Target** muestra la etiqueta cuyo bloque de configuración contiene el cursor del editor. En cualquier otra posición, muestra **All tags**. En Reading View, el destino es **All tags**. Este destino controla **Random decoration**.

Usa un solo cursor al ejecutar **Random decoration** en modo de edición. Si hay varios cursores, se rechaza la acción, incluso cuando el destino muestra **All tags**.

| Botón                      | Efecto                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add missing settings**   | Añade definiciones para las etiquetas locales reconocidas que no tengan una y, después, añade los atributos que falten con valores vacíos a todas las definiciones. Crea la sección de configuración si es necesario. Conserva los valores existentes y coloca los atributos en el orden mostrado anteriormente. |
| **Remove empty settings**  | Elimina los atributos conocidos vacíos y coloca los restantes en el orden mostrado anteriormente. Conserva las definiciones de etiquetas, incluidas las que queden sin atributos, así como los valores no vacíos y el contenido asociado.                                                                        |
| **Random decoration**      | En modo de edición, aplica formato aleatorio a la etiqueta cuyo bloque de configuración contiene el único cursor. Con **All tags**, genera colores para las etiquetas raíz, de modo que sus descendientes los hereden. Reading View utiliza esta operación para toda la nota.                                    |
| **Sort settings**          | Ordena las definiciones por el nombre de etiqueta, distinguiendo entre mayúsculas y minúsculas y manteniendo unido el contenido de cada definición.                                                                                                                                                              |
| **Expand to tag headings** | Muestra las entradas de etiquetas de la configuración y pliega sus listas de atributos en Source mode o Live Preview. Esta acción cambia los pliegues del editor.                                                                                                                                                |

Por ejemplo, **Remove empty settings** modifica la siguiente configuración.

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

Las definiciones resultantes conservan ambas etiquetas.

```md
- ##tag1
  - bold: on
- ##tag2
```

El formato aleatorio usa una paleta fija de colores complementarios vivos para el texto, el fondo y el borde. Puede sustituir los colores existentes. La negrita, el subrayado y la cursiva conservan sus valores actuales. Añade `.` delante de un atributo para conservarlo al aplicar formato aleatorio, por ejemplo `.text-color: \#ffffff`. Un grupo `.style` excluye todos sus atributos del formato aleatorio, pero mantiene activo el formato que definen.

<a id="color-swatches"></a>

### Muestras de color

En Source mode o Live Preview, haz clic en la muestra situada junto a un color válido de la configuración. Introduce un color hexadecimal de seis dígitos o ajusta los controles de tono, saturación y luminosidad y, después, elige **Apply**. **Cancel** o Esc cierra el selector. Si la nota cambia mientras el selector está abierto, la actualización se cancela para proteger el texto editado.

<a id="tag-descriptions"></a>

## Descripciones de etiquetas

Escribe una descripción después del nombre completo de la etiqueta, en la misma línea de declaración, dentro de la sección `local-tags-config` de la nota.

```md
## local-tags-config

- ##project Work owned by this project
- ##project/review Review tasks for this project
```

La descripción pertenece al nombre exacto de esa etiqueta en el archivo actual y distingue entre mayúsculas y minúsculas. Añade una descripción independiente para cada etiqueta hija. Solo se incluye el texto de la línea de declaración. Se eliminan los comentarios de Obsidian y HTML y los espacios en blanco de los extremos. El Markdown y el HTML que queden en la descripción se muestran como texto sin formato.

Las descripciones aparecen junto a cada sugerencia de autocompletado coincidente. Pulsa Intro para insertar el nombre de la etiqueta y un espacio al final. Coloca el puntero sobre una etiqueta en Source mode, Live Preview, Reading View o el panel para mostrar su descripción tras una breve espera. Al enfocar una etiqueta del panel con el teclado, la descripción aparece de inmediato. Pulsa Esc o aparta el puntero para ocultarla.

Las descripciones se actualizan cuando cambia la nota. Los valores de formato no válidos pueden generar errores mientras la descripción sigue disponible. Las definiciones duplicadas impiden que se muestre la descripción de la etiqueta afectada. Si hay varios encabezados de configuración o listas de definiciones separadas, no se muestra ninguna descripción hasta corregir la estructura.

<a id="tag-panel-search"></a>

## Búsqueda en el panel de etiquetas

Ejecuta **Open tag panel** y escribe en **Search tags** para filtrar inmediatamente la lista de etiquetas de la nota actual. La búsqueda usa coincidencias por subcadena en los nombres jerárquicos completos y en las [descripciones](#tag-descriptions) asociadas a las etiquetas exactas. La búsqueda de texto en inglés no distingue entre mayúsculas y minúsculas; también se admite texto en japonés. La identidad de las etiquetas y los ajustes de autocompletado no cambian.

Usa las casillas **Tag name** y **Summary** para elegir dónde buscar. Ambas están activadas al principio y basta con una coincidencia en cualquiera de ellas. Si desactivas ambas mientras hay una búsqueda introducida, no se muestran coincidencias. Borra la búsqueda, o introduce solo espacios en blanco, para restaurar la lista completa. Se ignoran los espacios en blanco de los extremos.

Los antecesores permanecen visibles para mostrar la ruta hasta una etiqueta hija coincidente. La descripción de una etiqueta padre coincidente no incluye a las etiquetas hijas que no tengan relación con la coincidencia. Las descripciones pertenecen a sus etiquetas exactas y no se heredan para la búsqueda.

El campo de entrada y las casillas permanecen en su sitio mientras se actualiza la lista. La búsqueda y las opciones elegidas se conservan al cambiar de nota, y cada nota usa sus propias etiquetas y descripciones. Estas opciones temporales se restablecen al volver a abrir el panel. Los cambios en las descripciones actualizan los resultados. Cuando no hay coincidencias, aparece **No matching tags**.

Los controles de búsqueda y el mensaje sin resultados aparecen en japonés cuando el idioma de Obsidian es japonés y en inglés en los demás casos. Hacer clic en una etiqueta que siga visible abre la búsqueda de Obsidian; Mayús+clic sigue permitiendo navegar dentro de la nota. Filtrar el panel no cambia la nota ni la consulta de búsqueda de Obsidian.

<a id="in-note-navigation"></a>

## Navegación dentro de la nota

Usa Mayús+clic izquierdo en una etiqueta del panel, sin Ctrl, Command ni Alt, para desplazarte a su primera aparición en la nota actual. Repite la acción para ir a la siguiente aparición en el orden del código fuente y volver a la primera después de la última. Una etiqueta padre también coincide con sus descendientes, por lo que `##people` incluye `##people/Alex`.

Source mode, Live Preview y Reading View resaltan la línea coincidente y dibujan un contorno alrededor de la etiqueta. Source mode y Live Preview conservan el cursor y la selección del editor. La navegación también mantiene oculto el prefijo `##` en las etiquetas inactivas de Live Preview cuando está activada la opción de ocultarlo. Las secciones plegadas se expanden para mostrar la coincidencia.

En Reading View, una lista anidada resalta la línea mostrada que coincide. En Reading View y en las tablas renderizadas de Live Preview, el resaltado de la línea se limita a la celda coincidente. Las etiquetas ocultas en `%% comments %%` se omiten en Reading View. Si no hay ninguna aparición visible disponible, un aviso sugiere revisar la nota en modo de edición.

Editar la nota o cambiar el archivo de destino, el panel Markdown o el modo de visualización elimina el resaltado y reinicia el recorrido. Elegir otra etiqueta inicia el recorrido en la primera aparición de esa etiqueta. Desactivar el complemento elimina el resaltado.

<a id="search-caveats"></a>

## Consideraciones sobre la búsqueda

Hacer clic en una etiqueta del panel sustituye la consulta de búsqueda actual de Obsidian por una búsqueda de texto para el archivo y la etiqueta actuales. Los resultados pueden incluir texto en lugares excluidos del reconocimiento de etiquetas, como los bloques de código.
