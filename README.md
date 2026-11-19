# Continuous Disintegration

Blog estático construido con Next.js, React y TypeScript. Los artículos se
escriben en Markdown y se publican mediante la exportación estática de Next.js.

## Desarrollo

Se requiere Node.js 20.9 o superior.

```bash
npm install
npm run dev
```

Para validar y generar la exportación completa:

```bash
npx tsc --noEmit
npm run build
```

## Añadir un artículo

Los artículos están en [`_posts/`](./_posts/). Cada artículo tiene dos
archivos: `mi-articulo.md` (español) y `mi-articulo.en.md` (inglés). El nombre
se usa como slug en ambos idiomas: `/posts/mi-articulo/` y
`/en/posts/mi-articulo/`. Usa minúsculas, guiones y palabras que la gente
buscaría; no lo cambies tras publicar sin añadir una redirección 301 en
[`public/_redirects`](./public/_redirects).

```md
---
title: "Título visible del artículo"
section: "Nombre de la sección"
language: "es"
excerpt: "Resumen breve que aparecerá en las tarjetas"
coverImage: "/assets/blog/mi-articulo/cover.jpg"
date: "2026-09-16T10:00:00.000Z"
author:
  name: Nombre del autor
  picture: "/assets/blog/authors/nombre.jpg"
ogImage:
  url: "/assets/blog/mi-articulo/cover.jpg"
---

# Título interno

Contenido del artículo en Markdown.
```

| Campo | Uso |
| --- | --- |
| `title` | Título en tarjetas, página y metadatos |
| `section` | Agrupación y ruta de sección |
| `language` | `es` o `en` |
| `excerpt` | Resumen en tarjetas y metadatos |
| `coverImage` | Imagen editorial de referencia; se mantiene por compatibilidad |
| `date` | Fecha ISO y orden cronológico |
| `updatedDate` | Fecha ISO de la última edición; opcional, solo para artículos modificados |
| `author` | Nombre y fotografía del autor |
| `ogImage.url` | Imagen social personalizada; la imagen general activa la generación automática |

Las tarjetas y cabeceras usan ahora una composición técnica generada con CSS.
`coverImage` sigue formando parte del contrato editorial para mantener
compatibilidad con los artículos existentes. Si `ogImage.url` apunta a
`/assets/blog/social-preview.png` o se omite, se genera una imagen propia para
cada artículo e idioma. Puedes indicar otra imagen para sustituirla.

Al editar un artículo publicado, conserva `date` y añade o actualiza
`updatedDate` en el frontmatter de cada versión de idioma modificada. Este
campo muestra una sección «Artículo editado» con la fecha de última edición,
y actualiza la fecha de modificación en los metadatos y el sitemap. Los
artículos sin `updatedDate` no muestran esta sección.

## Imágenes

Guarda las imágenes en `public/assets/blog/`. Las rutas escritas en el
frontmatter o el cuerpo Markdown empiezan por `/assets/`:

```md
![Descripción de la captura](/assets/blog/mi-articulo/captura.png)
![Descripción del vídeo](/assets/blog/mi-articulo/demo.mp4)
![Nombre de la pieza](/assets/blog/mi-articulo/modelos/pieza.stl)
```

La misma sintaxis sirve para tres tipos de medio según la extensión:

- Imagen (`.jpg`, `.png`, `.webp`…): se muestra tal cual.
- Vídeo (`.mp4`, `.webm`): reproductor nativo con controles.
- Modelo 3D (`.stl`): visor interactivo con three.js, que solo se descarga
  cuando el visor entra en pantalla, y enlace para descargar el STL.

Si el archivo todavía no existe en `public/`, se muestra un recuadro
«pendiente» con la descripción y el nombre esperado. En cuanto añades el
archivo, aparece el medio real sin tocar el texto. `npm run build` falla si un
artículo publicado contiene recuadros pendientes.

## Borradores

Añade `draft: true` al frontmatter (basta en el archivo en español) para que
el artículo solo aparezca con `npm run dev`. No se exporta, ni sale en el
sitemap, el RSS o los listados. Quita la línea y pon la fecha real en `date`
al publicarlo.

## Secciones

No hay un registro manual de secciones. [`src/lib/api.ts`](./src/lib/api.ts)
agrupa los artículos por el valor de `section` y genera una ruta normalizada.
Una sección nueva aparece automáticamente en el inicio, el archivo y la
navegación temática.

Usa siempre la misma escritura para evitar secciones duplicadas.

## Autores

El nombre y la fotografía proceden del frontmatter. Las biografías y slugs
públicos están en [`src/lib/authors.ts`](./src/lib/authors.ts). Los autores no
registrados reciben un slug y una biografía genérica.

## Sistema visual

Todo el blog comparte la misma interfaz editorial:

- [`src/app/globals.css`](./src/app/globals.css): tokens, retícula, responsive y componentes globales.
- [`src/app/_components/technical-cover.tsx`](./src/app/_components/technical-cover.tsx): ilustraciones técnicas de tarjetas y artículos.
- [`src/app/_components/post-preview.tsx`](./src/app/_components/post-preview.tsx): tarjetas del inicio, archivo, secciones y autores.
- [`src/app/posts/[slug]/page.tsx`](./src/app/posts/%5Bslug%5D/page.tsx): plantilla única de lectura.
- [`src/app/_components/markdown-styles.module.css`](./src/app/_components/markdown-styles.module.css): contenido Markdown, código, tablas y citas.
- [`src/app/_components/article-sidebar.tsx`](./src/app/_components/article-sidebar.tsx): ventanas laterales de artículos, repositorios y RSS en escritorio.
- [`src/app/_components/follow-menu.tsx`](./src/app/_components/follow-menu.tsx): menú «Sígueme» de la cabecera y las ventanas laterales, con RSS, correo y X.

Instagram y TikTok aparecen como «Próximamente» hasta añadir sus URLs en
`upcomingChannels`, dentro de `follow-menu.tsx`. La página `/tiktok/` (no
indexable) es el destino del enlace de la bio de TikTok y lista las guías. El correo y la cuenta de X se
configuran en `src/lib/site.ts`.

Las ventanas laterales recomiendan otros artículos, dando prioridad a la misma
sección, y utilizan el RSS del idioma de lectura. En pantallas amplias se
distribuyen a ambos lados; en portátiles se agrupan a la izquierda y por debajo
de 1024 px se ocultan. Cada ventana se puede cerrar durante la lectura del
artículo; permanece cerrada para ese artículo durante la sesión de la pestaña,
también al recargar o cambiar de idioma. Los enlaces de repositorios se editan
en `article-sidebar.tsx`.

Los temas espaciales del frontend anterior fueron retirados para evitar que
componentes y estilos sin uso entren en conflicto con el sistema actual.

## RSS y metadatos

Las páginas `/rss/` y `/en/rss/` presentan el feed con el estilo del blog,
instrucciones de suscripción, la dirección para copiar y las últimas
publicaciones. El menú «Sígueme» enlaza a estas páginas. Los archivos
`/feed.xml` y `/en/feed.xml` conservan el formato RSS para los lectores y la
autodetección del navegador. La vista se mantiene en
[`src/app/_views/rss-page.tsx`](./src/app/_views/rss-page.tsx).

Las vistas previas de los artículos se generan como PNG de 1200 × 630 durante
la compilación, en `/social/es/<slug>.png` y `/social/en/<slug>.png`. Incluyen
título, sección, autor y marca del blog, con los colores de cada tema. Open
Graph, Twitter y los datos estructurados usan la misma imagen. Cambiar el
título o la sección y recompilar actualiza la vista previa automáticamente.
Las fuentes están incluidas en `src/assets/fonts/`, por lo que no se necesitan
descargas ni un servidor de imágenes en producción.

[`src/app/feed.xml/route.ts`](./src/app/feed.xml/route.ts) genera el feed RSS
durante la exportación estática y enlaza al dominio principal. Todas las URLs
absolutas usan `https://continuousdisintegration.com`.

## Idiomas

El español vive en el grupo de rutas [`src/app/(es)/`](./src/app/(es)/) y el
inglés en [`src/app/en/`](./src/app/en/). Cada uno tiene su propio layout raíz,
de modo que el HTML exportado lleva `<html lang="es">` o `<html lang="en">`
sin depender de JavaScript. Ambos usan
[`root-document.tsx`](./src/app/_components/root-document.tsx). Como hay dos
layouts raíz, el 404 global está en
[`global-not-found.tsx`](./src/app/global-not-found.tsx).

## Cloudflare Workers

El blog se publica solo en Cloudflare. [`wrangler.jsonc`](./wrangler.jsonc)
publica la exportación estática de `out/` en la raíz del Worker, y el workflow
[`deploy.yml`](./.github/workflows/deploy.yml) ejecuta `npm ci`,
`npm run build` y el despliegue en cada push a `main`. Las redirecciones 301
están en [`public/_redirects`](./public/_redirects).

El workflow necesita los secretos `CLOUDFLARE_API_TOKEN` y
`CLOUDFLARE_ACCOUNT_ID` para publicar.

### Analítica

Se usa Cloudflare Web Analytics (sin cookies). Crea el sitio en el panel de
Cloudflare (**Analytics & Logs → Web Analytics → Add a site**), copia el token
del fragmento JavaScript y guárdalo como **variable** del repositorio
`CF_WEB_ANALYTICS_TOKEN` (Settings → Secrets and variables → Actions →
Variables). El token es público. Sin esa variable el sitio se compila sin
analítica. Para medir TikTok, usa enlaces con `?utm_source=tiktok`.

## SEO y Google Search Console

La URL principal es `https://continuousdisintegration.com/`.
[`src/app/sitemap.ts`](./src/app/sitemap.ts) genera `/sitemap.xml` con las
páginas y artículos del dominio principal; [`src/app/robots.ts`](./src/app/robots.ts)
lo anuncia a los buscadores. Cada página declara su URL canónica con
`rel="canonical"`.
La portada incluye datos estructurados `WebSite` con el nombre del blog.

Para registrar el dominio en [Google Search Console](https://search.google.com/search-console):

1. Selecciona **Añadir propiedad** y el tipo **Dominio**. Introduce `continuousdisintegration.com` sin `https://` ni `www`.
2. Copia el registro TXT de verificación que te entregue Google y añádelo en el DNS del dominio (en Cloudflare, **DNS → Records → Add record**, tipo **TXT**, nombre `@`). Conserva el valor exacto proporcionado por Google.
3. Vuelve a Search Console y pulsa **Verificar**. La propagación del DNS puede tardar.
4. En **Sitemaps**, envía `https://continuousdisintegration.com/sitemap.xml`.
5. Usa **Inspección de URLs** con `https://continuousdisintegration.com/` para comprobar su indexación y, si hace falta, solicitarla.

### IndexNow (Bing, Yandex, Seznam, Naver)

Cada despliegue avisa automáticamente a [IndexNow](https://www.indexnow.org/)
de las URLs nuevas, modificadas o eliminadas. El workflow guarda el
`sitemap.xml` publicado antes de desplegar y, después,
[`scripts/indexnow.py`](./scripts/indexnow.py) lo compara con el nuevo
(URLs y `lastmod`). La clave pública está en `public/<clave>.txt`; si la
cambias, actualiza también `KEY` en el script. Un fallo de IndexNow solo deja
un aviso en el workflow, nunca rompe el despliegue.

Google no usa IndexNow: para Google sigue valiendo el sitemap y la
**Inspección de URLs** de Search Console.

```bash
python3 scripts/indexnow.py --all --dry-run          # ver qué se enviaría
python3 scripts/indexnow.py --url https://continuousdisintegration.com/posts/slug/
```

Antes de publicar un artículo, comprueba que:

- `section` y `language` son válidos.
- La fecha usa formato ISO.
- El avatar, las imágenes Markdown y `ogImage.url` existen en `public/`.
- El nombre del autor coincide con sus otras publicaciones.
- `npx tsc --noEmit` y `npm run build` terminan correctamente.
