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

Los artículos están en [`_posts/`](./_posts/). El nombre del archivo se usa
como slug; por ejemplo, `mi-articulo.md` genera `/posts/mi-articulo/`.

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
| `author` | Nombre y fotografía del autor |
| `ogImage.url` | Imagen para compartir el artículo |

Las tarjetas y cabeceras usan ahora una composición técnica generada con CSS.
`coverImage` sigue formando parte del contrato editorial para mantener
compatibilidad con los artículos existentes. `ogImage.url` sí se usa en los
metadatos sociales.

## Imágenes

Guarda las imágenes en `public/assets/blog/`. Las rutas escritas en el
frontmatter o el cuerpo Markdown empiezan por `/assets/`:

```md
![Descripción de la captura](/assets/blog/mi-articulo/captura.png)
```

Las rutas Markdown se adaptan automáticamente al `basePath` de GitHub Pages.

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

Los temas espaciales del frontend anterior fueron retirados para evitar que
componentes y estilos sin uso entren en conflicto con el sistema actual.

## RSS y metadatos

[`src/app/feed.xml/route.ts`](./src/app/feed.xml/route.ts) genera el feed RSS
durante la exportación estática. Los metadatos absolutos usan
`NEXT_PUBLIC_SITE_URL`; si no existe, se usa
`https://seryio2004.github.io/blog`.

## GitHub Pages

El workflow [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml) ejecuta
`npm ci` y `npm run build`. `NEXT_PUBLIC_BASE_PATH` procede de
`actions/configure-pages`, y [`src/lib/paths.ts`](./src/lib/paths.ts) adapta las
rutas públicas al subdirectorio del sitio.

Antes de publicar un artículo, comprueba que:

- `section` y `language` son válidos.
- La fecha usa formato ISO.
- El avatar, las imágenes Markdown y `ogImage.url` existen en `public/`.
- El nombre del autor coincide con sus otras publicaciones.
- `npx tsc --noEmit` y `npm run build` terminan correctamente.
