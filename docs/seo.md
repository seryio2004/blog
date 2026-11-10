# SEO del blog: cambios y seguimiento

Revisión del 10 de noviembre de 2026. Referencia: [artículo de Nicholas Dulait](https://x.com/nicholasdulait/status/2120063043614716174), recuperado mediante la API pública de FxTwitter.

Se aplicó el proceso al blog: mejorar artículos existentes, atender consultas relevantes, aportar explicaciones comprobables, revisar el HTML y medir después. La selección de intención comercial y el marcado Product del ejemplo de una tienda no corresponden a este sitio. Se mantiene BlogPosting. No se requiere instalar Claude ni contratar ChatSEO para aplicar el proceso.

## Lo que muestran los datos

Fuente local intacta: `continuousdisintegration.com-Performance-on-Search-2026-11-10/`. `Filtros.csv` indica últimos tres meses; `Gráfico.csv` contiene fechas del 17 de septiembre al 8 de noviembre de 2026. Totales diarios: 18 clics, 403 impresiones y CTR 4,47 %. No se ha presentado este período como los últimos 28 días.

`Consultas.csv` tiene 18 consultas. Solo tres están entre las posiciones 5 y 15, todas con cero clics. La muestra es pequeña. `Páginas.csv` y `Consultas.csv` son agregados separados; no permiten atribuir una consulta a una URL ni confirmar canibalización. Las asociaciones siguientes son hipótesis editoriales por tema. No hay datos de volumen mensual, dificultad, backlinks ni ventas.

| Consulta observada | Impresiones | Posición | Página propuesta y decisión |
| --- | ---: | ---: | --- |
| forgejo packages | 4 | 7,5 | Guía Forgejo en inglés: título, descripción y explicación inicial del registro |
| pep440 | 1 | 5 | Versionado Python: corregir PEP 404 y explicar PEP 440 frente a SemVer |
| unix tv remote | 1 | 10 | TV Remote en inglés: aclarar Linux, requisitos, límites y control por Wi-Fi |
| rdp monitoring | 15 | 56,87 | Monitorización en inglés: conservar y medir; fuera del rango 5–15 |
| rdp session monitoring | 11 | 43,36 | Misma página de monitorización; evitar un artículo duplicado |
| python semver | 2 | 37,5 | Misma guía de versionado; evitar otra página para el mismo tema |
| forgejo ci | 2 | 42,5 | Misma guía Forgejo; continuar consolidando |
| uv_system_certs | 1 | 17 | Ya tratado en la guía Forgejo; observar antes de ampliar |
| wtsenumeratesessions | 1 | 33 | Tema de monitorización; verificar consulta por página antes de ampliar |
| semantic versioning python | 1 | 42 | Misma guía de versionado; no duplicar |

La guía Forgejo inglesa es la página de artículo con más impresiones (169, posición 17,68); la española tiene 32 y posición 8,31. Las páginas históricas `Create-and-upload-a-package` y `guia_runners` también aparecen en el informe. Ya estaban unificadas en el código. Se añadieron redirecciones HTTP 301 para Cloudflare, conservando el HTML de traslado para GitHub Pages. La barra final ya la normaliza `html_handling: force-trailing-slash` en Cloudflare.

La comparación pública se apoyó en documentación primaria de [Forgejo Packages](https://forgejo.org/docs/latest/user/packages/), [Forgejo PyPI](https://forgejo.org/docs/latest/user/packages/pypi/) y [Python Packaging](https://packaging.python.org/en/latest/specifications/version-specifiers/). No equivale a una captura de los tres primeros resultados de Google por país/dispositivo. La aportación propia del blog sigue siendo sus proyectos, configuraciones, problemas y ejemplos; no se añadieron experiencias ni mediciones inventadas.

## Cambios aplicados

- Un H1 por artículo, definido por la plantilla. Los cuerpos Markdown usan H2 y niveles consecutivos. Los encabezados dentro de ejemplos de código se conservaron.
- Títulos de artículos concisos con el tema al principio; no se les añade automáticamente el nombre largo del blog. El presupuesto editorial de 60 caracteres es una comprobación propia, no un límite de Google.
- Guías existentes de Forgejo, versionado Python y TV Remote ampliadas para resolver las consultas pertinentes. PEP 404 se corrigió a PEP 440 en la versión inglesa.
- Dos enlaces contextuales por artículo hacia lecturas relacionadas, en su propio idioma. Se conservan las URLs existentes para no romper enlaces externos.
- Imagen social WebP: de 1.491.914 a 63.498 bytes, aproximadamente 95,7 % menos. Gráfico de uv en WebP sin pérdida: de 24.293 a 7.608 bytes, aproximadamente 68,7 % menos, con texto alternativo descriptivo y dimensiones reservadas. Se mantienen los PNG antiguos para enlaces existentes. Las tarjetas específicas de artículos siguen generándose individualmente.
- Sitemap con la fecha más reciente de publicación o edición, también en archivos, autores y secciones. Se conservan canonical, hreflang y BlogPosting.
- Página 404 explícitamente no indexable. Auditoría del HTML exportado antes de ambos despliegues.

El 10 de noviembre es la fecha de esta edición. No cambia la fecha de publicación original. La guía Forgejo y el servidor doméstico habían recibido cambios recientes; las correcciones técnicas y de claridad de esta entrega no se presentan como una optimización validada por resultados posteriores.

## Verificación y uso

Requisitos: Node.js y Python 3, sin paquetes Python adicionales. `npm run build` comprueba TypeScript, genera la exportación y ejecuta `npm run check:seo`. Los dos trabajos de despliegue existentes usan ese mismo comando. Se verificaron 28 páginas indexables y 12 artículos, también con `/blog` como ruta base de GitHub Pages. Una prueba negativa confirmó que la auditoría rechaza un artículo sin H1.

La auditoría comprueba páginas indexables, títulos y descripciones, un H1, enlaces internos, al menos dos páginas enlazando cada artículo, imágenes, JSON-LD de artículos, canonical, reciprocidad de idiomas y correspondencia con el sitemap. Bloquea el build si falla. No sustituye la inspección de URL o la prueba de resultados enriquecidos de Google en producción.

Para repetir el análisis sin modificar los CSV:

```bash
npm run seo:search-console -- continuousdisintegration.com-Performance-on-Search-2026-11-10 --as-of 2026-11-10
```

Cada lunes:

1. Exportar los últimos 28 días y el período anterior comparable, manteniendo los mismos filtros.
2. Revisar las consultas entre posiciones 5 y 15 por impresiones. En Search Console, filtrar cada consulta y consultar Páginas para confirmar la URL antes de tocar contenido.
3. Elegir hasta tres páginas existentes y registrar qué se quiere mejorar. El script muestra la pausa de 60 días propuesta por el artículo; no es una garantía sobre el rastreo de Google. Tras esta edición, priorizar seguimiento y diagnóstico durante esa pausa.
4. Comparar intención y resultados actuales en el país e idioma objetivo. Confirmar hechos con documentación primaria. Crear una página solo si resuelve una necesidad diferente.
5. Ejecutar el build antes de publicar. Después del despliegue, comprobar redirecciones HTTP, sitemap, URL indexable e imágenes en el dominio real. Mantener enviado `https://continuousdisintegration.com/sitemap.xml` en Search Console.
6. Comparar clics, impresiones, CTR y posición por página y consulta. Tener en cuenta el bajo número de impresiones; no atribuir cambios a SEO solo por unos pocos clics.

No se creó una tarea recurrente ni se conectaron cuentas externas. El seguimiento queda disponible mediante el comando y este procedimiento. Los cambios están preparados localmente; no se ha desplegado ni solicitado una reindexación.

Referencias técnicas: [títulos de Google Search](https://developers.google.com/search/docs/appearance/title-link), [datos estructurados de artículos](https://developers.google.com/search/docs/appearance/structured-data/article), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) y [redirecciones de Cloudflare](https://developers.cloudflare.com/workers/static-assets/redirects/).
