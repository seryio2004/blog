type AuthorProfile = {
  slug: string;
  bio: string;
};

const authorProfiles: Record<string, AuthorProfile> = {
  "nigi nigez": {
    slug: "nigi-nigez",
    bio: "Comparte guías prácticas sobre Python, automatización y la infraestructura que sostiene los proyectos de desarrollo.",
  },
  typeshit: {
    slug: "typeshit",
    bio: "Perfil editorial del blog, dedicado a compartir flujos de trabajo, herramientas y experiencias del día a día en desarrollo.",
  },
  "jj kasper": {
    slug: "jj-kasper",
    bio: "Escribe sobre desarrollo web moderno, arquitectura de aplicaciones y patrones de enrutado con Next.js.",
  },
  "tim neutkens": {
    slug: "tim-neutkens",
    bio: "Publica introducciones prácticas a Next.js, renderizado y generación estática de páginas.",
  },
  "joe haddad": {
    slug: "joe-haddad",
    bio: "Comparte contenidos sobre previsualización, gestión de contenido y experiencias de desarrollo con Next.js.",
  },
};

function createAuthorSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getAuthorProfile(name: string): AuthorProfile {
  const normalizedName = name.trim().toLocaleLowerCase("es");
  const profile = authorProfiles[normalizedName];

  return (
    profile ?? {
      slug: createAuthorSlug(name),
      bio: `${name} comparte artículos y experiencias técnicas en el blog.`,
    }
  );
}

export function getAuthorSlug(name: string) {
  return getAuthorProfile(name).slug;
}
