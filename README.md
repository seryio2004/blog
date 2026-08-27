# Continuous Desintegration — guía editorial y técnica

Blog estático construido con Next.js, React, TypeScript, Tailwind CSS y artículos
en Markdown. Este documento describe el flujo editorial, la arquitectura y las
funcionalidades disponibles en el estado actual del proyecto.

## Funcionalidades documentadas

- Artículos Markdown agrupados automáticamente por sección y autor.
- Etiqueta de idioma obligatoria para distinguir contenido en español e inglés.
- Tres temas de artículo: líquido predeterminado, planetas azules y espacio
  verde de Forgejo.
- Selección automática del tema visual según la sección del artículo.
- Tarjetas compactas en el inicio y distintivos visibles de sección e idioma.
- Perfiles de autor con biografía y listado automático de publicaciones.
- Barra horizontal de redes sociales situada bajo la descripción del blog.
- Exportación estática compatible con GitHub Pages y rutas con
  <code>basePath</code>.

## Puesta en marcha

Se requiere Node.js 20.9 o superior.

~~~bash
npm install
npm run dev
~~~

La web estará disponible en <code>http://localhost:3000</code>.

Para comprobar la exportación estática completa:

~~~bash
npm run build
~~~

## Guía para redactores

No existe un panel de administración: el contenido se mantiene mediante los
archivos Markdown de [_posts/](./_posts/). Las imágenes se guardan dentro de
[public/assets/blog/](./public/assets/blog/).

### Crear un artículo

1. Crea un archivo en <code>_posts/</code>, por ejemplo
   <code>mi-primer-articulo.md</code>.
2. Usa un nombre de archivo estable, preferiblemente en minúsculas, sin espacios
   ni tildes. El nombre se convierte directamente en la URL
   <code>/posts/mi-primer-articulo/</code>.
3. Añade el bloque de metadatos al principio del archivo.
4. Escribe el contenido en Markdown después del segundo separador
   <code>---</code>.
5. Ejecuta <code>npm run dev</code> y revisa el artículo, su tarjeta, la sección
   y el perfil del autor.

Plantilla de frontmatter:

~~~yaml
---
title: "Título visible del artículo"
section: "Nombre de la sección"
language: "es"
excerpt: "Resumen breve que aparecerá en las tarjetas"
coverImage: "/assets/blog/mi-primer-articulo/cover.jpg"
date: "2026-08-25T10:00:00.000Z"
author:
  name: Nombre del autor
  picture: "/assets/blog/authors/nombre.jpg"
ogImage:
  url: "/assets/blog/mi-primer-articulo/cover.jpg"
---

Contenido del artículo en Markdown.
~~~

| Campo | Qué controla | Observaciones |
| --- | --- | --- |
| <code>title</code> | Título del artículo, tarjetas y metadatos | Se recomienda escribirlo entre comillas |
| <code>section</code> | Agrupación, URL y tema visual de la sección | Es obligatorio; una sección nueva se crea automáticamente |
| <code>language</code> | Idioma del artículo y distintivo visible | Obligatorio: usa únicamente <code>es</code> o <code>en</code> |
| <code>excerpt</code> | Resumen de las tarjetas | Debe ser breve y descriptivo |
| <code>coverImage</code> | Imagen principal y miniatura | Ruta pública que comienza por <code>/assets/</code> |
| <code>date</code> | Orden cronológico y fecha visible | Formato ISO; los artículos se ordenan del más reciente al más antiguo |
| <code>author.name</code> | Nombre visible y asociación al perfil | Mantén exactamente el mismo nombre en todos sus artículos |
| <code>author.picture</code> | Fotografía del autor | Usa la misma ruta en todas sus publicaciones |
| <code>ogImage.url</code> | Imagen para metadatos sociales | Normalmente puede reutilizar <code>coverImage</code> |

### Añadir imágenes

Guarda las imágenes de un artículo en una carpeta propia:

~~~text
public/assets/blog/mi-primer-articulo/
├── cover.jpg
└── captura-terminal.png
~~~

En el frontmatter y en el Markdown se referencian desde la raíz pública:

~~~md
![Descripción de la captura](/assets/blog/mi-primer-articulo/captura-terminal.png)
~~~

Las fotografías de autores se encuentran en
<code>public/assets/blog/authors/</code>.

### Secciones

Las secciones no tienen un fichero de configuración separado. El valor de
<code>section</code> se procesa en [src/lib/api.ts](./src/lib/api.ts):

- Los artículos con el mismo nombre de sección se agrupan automáticamente.
- El nombre se normaliza para crear la URL. Por ejemplo, <code>Next.js</code>
  genera <code>/secciones/next-js/</code>.
- El inicio muestra todas las secciones y el artículo más reciente de cada una.
- Un valor vacío provoca un error durante la lectura o la compilación.

Para evitar secciones duplicadas, utiliza siempre la misma escritura y
capitalización.

### Idiomas

Cada artículo debe declarar <code>language: "es"</code> o
<code>language: "en"</code>. [src/lib/api.ts](./src/lib/api.ts) valida el valor
durante la lectura y detiene la compilación si falta o no es válido.

[LanguageBadge](./src/app/_components/language-badge.tsx) muestra
<code>ES · Español</code> en ámbar o <code>EN · English</code> en cian. La
etiqueta aparece en tarjetas y cabeceras, y el atributo HTML <code>lang</code>
se aplica al contenido para mejorar accesibilidad y pronunciación en lectores
de pantalla.

### Autores y biografías

El nombre y la fotografía se definen en el frontmatter de cada artículo. La
biografía y el slug público se configuran en
[src/lib/authors.ts](./src/lib/authors.ts).

Para añadir o modificar un perfil:

~~~ts
const authorProfiles: Record<string, AuthorProfile> = {
  "ana ejemplo": {
    slug: "ana-ejemplo",
    bio: "Escribe sobre desarrollo web, accesibilidad y diseño de producto.",
  },
};
~~~

La clave del registro debe coincidir con <code>author.name</code> convertido a
minúsculas. El nombre mostrado conserva la escritura del Markdown.

Comportamiento automático:

- Al pulsar sobre cualquier avatar o nombre se abre
  <code>/autores/&lt;slug-del-autor&gt;/</code>.
- La página muestra la biografía, la fotografía, el número de artículos y sus
  publicaciones.
- Si un autor aparece en Markdown pero no está registrado, se genera un slug y
  una biografía genérica. Conviene registrarlo para ofrecer un perfil cuidado.
- La fotografía usada por el perfil procede del artículo más reciente de ese
  autor. Por eso todas sus publicaciones deben utilizar la misma imagen.
- Si un autor deja de tener artículos, su página deja de generarse en la
  exportación estática.

### Temas visuales por sección

La plantilla se decide en
[src/app/posts/[slug]/page.tsx](./src/app/posts/%5Bslug%5D/page.tsx). El estado
actual define tres temas y asigna dos de ellos por sección:

~~~ts
type PostTheme = "liquid" | "planets" | "forgejo";

const SECTION_THEMES: Partial<Record<string, PostTheme>> = {
  python: "planets",
  forgejo: "forgejo",
};
~~~

- <code>Python</code> utiliza la plantilla de planetas azules.
- <code>Forgejo</code> utiliza la plantilla espacial verde.
- Cualquier sección sin asignación utiliza el fondo líquido predeterminado.

Las claves son slugs normalizados: por ejemplo, <code>Forgejo</code> se
convierte en <code>forgejo</code>. Para asignar un tema existente a otra
sección solo hay que añadir una entrada a <code>SECTION_THEMES</code>.

Para crear un tema nuevo:

1. Amplía la unión <code>PostTheme</code>.
2. Crea su plantilla, fondo y CSS Module dentro de
   <code>posts/[slug]/_components/</code>.
3. Importa la plantilla en <code>posts/[slug]/page.tsx</code>.
4. Añade una rama de renderizado para el nuevo valor.
5. Asocia las secciones deseadas en <code>SECTION_THEMES</code>.

La constante heredada <code>PLANET_TEMPLATE_SLUG</code> conserva la posibilidad
de forzar la plantilla planetaria para un slug concreto, además de la selección
por sección.

### Modificar los enlaces sociales

Los enlaces mostrados en la barra horizontal bajo la descripción del inicio
están en el array
<code>socialLinks</code> de
[src/app/_components/social-sidebar.tsx](./src/app/_components/social-sidebar.tsx):

~~~ts
const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/seryio2004/blog",
    icon: "github",
    external: true,
  },
  {
    label: "X",
    href: "https://x.com/seryio2004",
    icon: "x",
    external: true,
  },
  {
    label: "Correo",
    href: "mailto:rodriguezsergiomartinez@gmail.com",
    icon: "mail",
  },
];
~~~

- Cambia <code>href</code> para actualizar una dirección.
- Usa <code>mailto:</code> para correos.
- <code>external: true</code> abre el enlace en una pestaña nueva.
- Para añadir una red nueva también hay que ampliar
  <code>SocialIconName</code> y añadir su SVG dentro de
  <code>SocialIcon</code>.

La cuenta de X usa actualmente <code>@seryio2004</code>; conviene confirmar que
es la cuenta definitiva antes de publicar.

### Lista de comprobación editorial

Antes de publicar un artículo:

- Comprueba que el nombre del archivo produce la URL deseada.
- Revisa que <code>section</code> no esté vacío y coincida con una sección
  existente si corresponde.
- Declara <code>language: "es"</code> o <code>language: "en"</code>.
- Confirma que portada, imágenes internas y <code>ogImage</code> existen
  realmente dentro de <code>public/</code>.
- Confirma fecha y resumen.
- Usa el mismo nombre y fotografía que en los demás artículos del autor.
- Añade o actualiza la biografía en <code>src/lib/authors.ts</code>.
- Revisa el resultado en móvil y escritorio con <code>npm run dev</code>.
- Ejecuta <code>npm run build</code> antes de desplegar.

## Explicación técnica

### Flujo de datos

~~~text
_posts/*.md
  └─ gray-matter separa frontmatter y contenido
      └─ src/lib/api.ts valida section y language, crea objetos Post
          ├─ home y /articulos
          ├─ /secciones/[section]
          ├─ /autores/[slug]
          └─ /posts/[slug]
              └─ getPostThemeBySection(section)
                  ├─ Python  → plantilla de planetas
                  ├─ Forgejo → plantilla espacial verde
                  └─ resto   → plantilla líquida
~~~

[src/lib/api.ts](./src/lib/api.ts) es la capa de acceso a contenido. Lee el
sistema de archivos durante la compilación, valida <code>section</code> y
<code>language</code>, crea slugs, ordena publicaciones y construye las
agrupaciones de secciones y autores.

### Fondo líquido predeterminado

El fondo normal de los artículos se compone de:

- [post-liquid-background.tsx](./src/app/_components/post-liquid-background.tsx),
  un componente cliente que renderiza dos masas líquidas y siete burbujas.
- [globals.css](./src/app/globals.css), que contiene colores, tamaños,
  posiciones, deformaciones y animaciones.
- La rama predeterminada de
  [posts/[slug]/page.tsx](./src/app/posts/%5Bslug%5D/page.tsx), que coloca el
  fondo detrás del artículo actual.

El efecto de profundidad ligado al scroll se calcula con
<code>requestAnimationFrame</code>. El progreso modifica el desplazamiento
vertical y la escala de toda la capa. Un <code>ResizeObserver</code> recalcula
el efecto si cambia la altura del documento.

Para personalizarlo en <code>globals.css</code>:

| Selector | Responsabilidad |
| --- | --- |
| <code>.post-liquid-scroll</code> | Capa fija, recorte y transformación por scroll |
| <code>.post-liquid-blob--blue</code> | Masa azul principal |
| <code>.post-liquid-blob--shadow</code> | Masa oscura secundaria |
| <code>.post-liquid-bubble</code> | Apariencia común de las burbujas |
| <code>.post-liquid-bubble:nth-child(n)</code> | Tamaño, posición, opacidad, trayectoria y duración de cada burbuja |

Si se añade otro elemento
<code>&lt;span className="post-liquid-bubble" /&gt;</code>, debe añadirse su
regla <code>nth-child</code> correspondiente. Los usuarios con
<code>prefers-reduced-motion: reduce</code> no reciben el movimiento de scroll
ni las animaciones continuas.

### Plantilla de planetas

La sección <code>Python</code> utiliza una plantilla separada de la normal:

- [planet-post-template.tsx](./src/app/posts/%5Bslug%5D/_components/planet-post-template.tsx)
  compone cabecera, artículo y fondo.
- [planet-post-template.module.css](./src/app/posts/%5Bslug%5D/_components/planet-post-template.module.css)
  define el panel del artículo, tipografía, enlaces, código e imágenes.
- [planet-post-background.tsx](./src/app/posts/%5Bslug%5D/_components/planet-post-background.tsx)
  declara siete planetas y qué planetas tienen anillos.
- [planet-post-background.module.css](./src/app/posts/%5Bslug%5D/_components/planet-post-background.module.css)
  controla tamaños, tonos azules, posiciones, órbitas, anillos y animaciones.

En el array <code>planets</code>, <code>ringed: true</code> activa los anillos.
Las clases <code>.planetOne</code> a <code>.planetSeven</code> permiten ajustar
cada cuerpo por separado mediante variables CSS como
<code>--planet-size</code>, <code>--planet-opacity</code>,
<code>--planet-mid</code>, <code>--duration</code> y
<code>--delay</code>.

Los CSS Modules mantienen estos estilos encapsulados y evitan alterar la
plantilla normal. El panel de lectura es translúcido para dejar visible el fondo.
También existen ajustes para móvil y para usuarios que prefieren movimiento
reducido.

### Plantilla espacial de Forgejo

La sección <code>Forgejo</code> utiliza un segundo tema aislado:

- [forgejo-post-template.tsx](./src/app/posts/%5Bslug%5D/_components/forgejo-post-template.tsx)
  compone el artículo y aplica semántica de idioma.
- [forgejo-post-template.module.css](./src/app/posts/%5Bslug%5D/_components/forgejo-post-template.module.css)
  define la gama verde espacial y el panel translúcido.
- [forgejo-post-background.tsx](./src/app/posts/%5Bslug%5D/_components/forgejo-post-background.tsx)
  declara seis mundos, lunas, anillos y un cometa.
- [forgejo-post-background.module.css](./src/app/posts/%5Bslug%5D/_components/forgejo-post-background.module.css)
  diferencia planetas gaseosos, cristalinos, ácidos, forestales, nocturnos y
  musgosos mediante gradientes y animaciones propias.

El fondo se adapta a móvil, reduce el número de cuerpos visibles en pantallas
pequeñas y desactiva animaciones cuando el usuario solicita movimiento
reducido.

### Tarjetas compactas del inicio

[PostPreview](./src/app/_components/post-preview.tsx) acepta la propiedad
opcional <code>compact</code>. El inicio la activa en sus dos grupos de
publicaciones:

~~~tsx
<PostPreview {...props} compact />
~~~

La variante compacta aplica un ancho del 90 % y reduce proporcionalmente
padding, radios, márgenes, tipografías y avatar. Otras páginas que reutilizan
<code>PostPreview</code>, como <code>/articulos/</code>, las secciones y los
perfiles de autor, no reciben la propiedad y conservan el tamaño original.

Los tamaños del avatar compacto están en
[avatar.tsx](./src/app/_components/avatar.tsx). Para cambiar el porcentaje hay
que mantener coordinados los valores de ambos componentes.

### Perfiles de autor

La implementación se divide en tres capas:

1. [authors.ts](./src/lib/authors.ts) mantiene slug y biografía, además del
   fallback para autores no registrados.
2. [api.ts](./src/lib/api.ts) agrupa los posts ordenados mediante
   <code>getAuthors</code> y resuelve un perfil con
   <code>getAuthorBySlug</code>.
3. [autores/[slug]/page.tsx](./src/app/autores/%5Bslug%5D/page.tsx) genera las
   páginas, metadatos y parámetros estáticos.

<code>dynamicParams = false</code> limita las rutas a los autores descubiertos
durante la compilación. <code>generateStaticParams</code> crea una página por
autor. El componente <code>Avatar</code> utiliza
<code>getAuthorSlug</code> para enlazar foto y nombre desde cualquier tarjeta o
cabecera.

### Barra de redes sociales

[social-sidebar.tsx](./src/app/_components/social-sidebar.tsx) contiene datos,
iconos SVG, navegación y estilos. Solo se importa desde
[src/app/page.tsx](./src/app/page.tsx), por lo que no aparece en artículos ni en
otras rutas.

Aunque el nombre histórico del componente conserva <code>sidebar</code>, ahora
es una barra horizontal integrada en el encabezado, justo debajo de la
descripción del blog. Participa en el flujo normal del documento, no reserva
espacio lateral y los tooltips se abren debajo de cada icono.

La navegación incluye etiquetas ocultas para lectores de pantalla, estados de
foco visibles y <code>aria-hidden</code> en los iconos decorativos.

## Organización de archivos modificados o añadidos

~~~text
blog/
├── _posts/                            # Artículos Markdown
├── public/assets/blog/                # Portadas, capturas y avatares
└── src/
    ├── app/
    │   ├── _components/
    │   │   ├── language-badge.tsx     # Etiqueta ES/EN
    │   │   ├── post-liquid-background.tsx
    │   │   ├── post-preview.tsx       # Tarjeta normal/compacta
    │   │   └── social-sidebar.tsx     # Barra horizontal del inicio
    │   ├── articulos/page.tsx
    │   ├── autores/[slug]/page.tsx
    │   ├── secciones/[section]/page.tsx
    │   ├── posts/[slug]/
    │   │   ├── page.tsx               # Selección de tema por sección
    │   │   └── _components/
    │   │       ├── planet-post-*
    │   │       └── forgejo-post-*
    │   ├── globals.css                # Tema líquido y estilos globales
    │   └── page.tsx                   # Inicio y barra social
    ├── interfaces/post.ts             # Post y PostLanguage
    └── lib/
        ├── api.ts                     # Lectura, validación y agrupaciones
        ├── authors.ts                 # Slugs y biografías
        └── paths.ts                   # Compatibilidad con basePath
~~~

## Mapa rápido: qué archivo editar

| Necesidad | Archivo principal |
| --- | --- |
| Crear o editar un artículo | <code>_posts/&lt;slug&gt;.md</code> |
| Cambiar portada o imágenes | <code>public/assets/blog/</code> y frontmatter del artículo |
| Cambiar sección | Campo <code>section</code> del Markdown |
| Cambiar idioma | Campo <code>language</code> del Markdown |
| Cambiar nombre o avatar | Campos <code>author</code> del Markdown |
| Cambiar biografía o URL de autor | <code>src/lib/authors.ts</code> |
| Cambiar GitHub, X o correo | <code>src/app/_components/social-sidebar.tsx</code> |
| Mover o rediseñar la barra social | <code>social-sidebar.tsx</code> y <code>src/app/page.tsx</code> |
| Asignar un tema a una sección | <code>SECTION_THEMES</code> en <code>posts/[slug]/page.tsx</code> |
| Cambiar planetas azules o anillos | <code>planet-post-background.tsx</code> y su CSS Module |
| Cambiar el tema verde de Forgejo | Archivos <code>forgejo-post-*</code> |
| Cambiar los paneles de lectura | CSS Modules <code>*-post-template.module.css</code> |
| Cambiar burbujas del fondo normal | <code>post-liquid-background.tsx</code> y <code>globals.css</code> |
| Cambiar el 90 % de las tarjetas del home | <code>post-preview.tsx</code> y <code>avatar.tsx</code> |

## Validación recomendada

Después de cualquier cambio editorial o técnico:

~~~bash
npx tsc --noEmit
npm run dev
npm run build
~~~

El build es especialmente importante porque las páginas de posts, secciones y
autores se generan de forma estática. Los metadatos <code>section</code> y
<code>language</code> se validan durante la lectura, pero las rutas de imágenes
también deben comprobarse visualmente porque su existencia no se valida desde
el frontmatter.

## Despliegue en GitHub Pages

El workflow
[deploy-pages.yml](./.github/workflows/deploy-pages.yml) se ejecuta al hacer
push a <code>main</code> o manualmente mediante <code>workflow_dispatch</code>.
Usa Node.js 20, instala con <code>npm ci</code>, genera la exportación estática
en <code>out/</code> y la publica con GitHub Pages.

<code>NEXT_PUBLIC_BASE_PATH</code> procede de
<code>actions/configure-pages</code>. [next.config.ts](./next.config.ts) lo
aplica a Next.js y [markdownToHtml.ts](./src/lib/markdownToHtml.ts) reescribe
rutas absolutas de imágenes y enlaces Markdown para que funcionen tanto en
local como bajo el subdirectorio de Pages.
