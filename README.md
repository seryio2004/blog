# Type shit — guía editorial y técnica

Este proyecto es un blog estático construido con Next.js, React, TypeScript,
Tailwind CSS y artículos en Markdown. Este documento explica cómo mantener el
contenido sin necesidad de conocer toda la aplicación y describe técnicamente
las funcionalidades incorporadas el 25 de agosto de 2026.

## Funcionalidades documentadas

- Fondo líquido azul de los artículos con más burbujas y movimiento ligado al
  scroll.
- Plantilla alternativa de artículo con planetas azules, algunos con anillos,
  aplicada únicamente a <code>hello-world</code>.
- Tarjetas de artículos del inicio reducidas al 90 % de su tamaño original.
- Perfiles de autor con biografía y listado automático de publicaciones.
- Nombre y fotografía del autor convertidos en enlaces a su perfil.
- Barra de contacto vertical, fija y situada a la derecha del inicio.

## Puesta en marcha

Se recomienda Node.js 20 o superior.

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
| <code>section</code> | Agrupación y URL de sección | Es obligatorio; una sección nueva se crea automáticamente |
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

### Elegir la plantilla de un artículo

La plantilla normal continúa siendo la opción predeterminada. La plantilla de
planetas está aislada y actualmente se aplica solo al artículo cuyo archivo es
<code>_posts/hello-world.md</code>.

La selección se controla mediante esta constante en
[src/app/posts/[slug]/page.tsx](./src/app/posts/%5Bslug%5D/page.tsx):

~~~ts
const PLANET_TEMPLATE_SLUG = "hello-world";
~~~

Para probarla con otro artículo, cambia el valor por el nombre de su archivo sin
<code>.md</code>. Este mecanismo acepta un único slug. Si se necesitan varios
artículos con esta plantilla, puede sustituirse la comparación por un conjunto
de slugs o añadirse un campo de plantilla al frontmatter.

### Modificar los enlaces de contacto

Los enlaces mostrados en la barra fija del inicio están en el array
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
- Confirma fecha, resumen, portada y <code>ogImage</code>.
- Usa el mismo nombre y fotografía que en los demás artículos del autor.
- Añade o actualiza la biografía en <code>src/lib/authors.ts</code>.
- Revisa el resultado en móvil y escritorio con <code>npm run dev</code>.
- Ejecuta <code>npm run build</code> antes de desplegar.

## Explicación técnica

### Flujo de datos

~~~text
_posts/*.md
  └─ gray-matter separa frontmatter y contenido
      └─ src/lib/api.ts crea objetos Post y los ordena por fecha
          ├─ home y /articulos
          ├─ /secciones/[section]
          ├─ /autores/[slug]
          └─ /posts/[slug]
              ├─ plantilla líquida predeterminada
              └─ plantilla planetaria para hello-world
~~~

[src/lib/api.ts](./src/lib/api.ts) es la capa de acceso a contenido. Lee el
sistema de archivos durante la compilación, valida <code>section</code>, crea
slugs, ordena publicaciones y construye las agrupaciones de secciones y autores.

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

### Plantilla planetaria alternativa

La nueva plantilla está completamente separada de la plantilla normal:

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
plantilla normal. También existen ajustes para móvil y para usuarios que
prefieren movimiento reducido.

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

### Barra de contacto

[social-sidebar.tsx](./src/app/_components/social-sidebar.tsx) contiene datos,
iconos SVG, navegación y estilos. Solo se importa desde
[src/app/page.tsx](./src/app/page.tsx), por lo que no aparece en artículos ni en
otras rutas.

La barra usa <code>position: fixed</code>, se centra verticalmente en el lateral
derecho y no se desplaza con el documento. El <code>padding-right</code> del
elemento <code>main</code> reserva espacio para que no tape el contenido. Los
tooltips se abren hacia la izquierda porque la barra está pegada al borde
derecho.

La navegación incluye etiquetas ocultas para lectores de pantalla, estados de
foco visibles y <code>aria-hidden</code> en los iconos decorativos.

## Organización de archivos modificados o añadidos

~~~text
blog/
├── _posts/
│   └── hello-world.md                 # Artículo que prueba la plantilla planetaria
├── public/assets/blog/                # Portadas, imágenes y avatares
└── src/
    ├── app/
    │   ├── _components/
    │   │   ├── avatar.tsx             # Enlace al autor y variante compacta
    │   │   ├── post-liquid-background.tsx
    │   │   │                          # Fondo líquido y parallax de artículos
    │   │   ├── post-preview.tsx       # Tarjeta normal/compacta
    │   │   └── social-sidebar.tsx     # Barra fija de contacto del inicio
    │   ├── autores/
    │   │   └── [slug]/page.tsx        # Perfil y publicaciones del autor
    │   ├── posts/
    │   │   └── [slug]/
    │   │       ├── page.tsx           # Selección de plantilla por slug
    │   │       └── _components/
    │   │           ├── planet-post-background.module.css
    │   │           ├── planet-post-background.tsx
    │   │           ├── planet-post-template.module.css
    │   │           └── planet-post-template.tsx
    │   ├── globals.css                # Tema líquido y burbujas
    │   └── page.tsx                   # Home, compactación y barra de contacto
    └── lib/
        ├── api.ts                     # Posts, secciones y agrupación de autores
        └── authors.ts                 # Slugs y biografías de autores
~~~

## Mapa rápido: qué archivo editar

| Necesidad | Archivo principal |
| --- | --- |
| Crear o editar un artículo | <code>_posts/&lt;slug&gt;.md</code> |
| Cambiar portada o imágenes | <code>public/assets/blog/</code> y frontmatter del artículo |
| Cambiar sección | Campo <code>section</code> del Markdown |
| Cambiar nombre o avatar | Campos <code>author</code> del Markdown |
| Cambiar biografía o URL de autor | <code>src/lib/authors.ts</code> |
| Cambiar GitHub, X o correo | <code>src/app/_components/social-sidebar.tsx</code> |
| Mover o rediseñar la barra de contacto | <code>social-sidebar.tsx</code> y padding del <code>main</code> en <code>src/app/page.tsx</code> |
| Elegir el post con planetas | Constante <code>PLANET_TEMPLATE_SLUG</code> en <code>posts/[slug]/page.tsx</code> |
| Cambiar planetas o anillos | <code>planet-post-background.tsx</code> y su CSS Module |
| Cambiar el panel de la plantilla planetaria | <code>planet-post-template.module.css</code> |
| Cambiar burbujas del fondo normal | <code>post-liquid-background.tsx</code> y <code>globals.css</code> |
| Cambiar el 90 % de las tarjetas del home | <code>post-preview.tsx</code> y <code>avatar.tsx</code> |

## Validación recomendada

Después de cualquier cambio editorial o técnico:

~~~bash
npm run dev
npm run build
~~~

El build es especialmente importante porque las páginas de posts, secciones y
autores se generan de forma estática y algunos errores de metadatos solo se
detectan durante esa fase.
