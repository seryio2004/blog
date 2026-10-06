type AuthorProfile = {
  slug: string;
  picture?: string;
  bio: Record<"es" | "en", string>;
};

const authorProfiles: Record<string, AuthorProfile> = {
  "sergio rodriguez": {
    slug: "sergio-rodriguez",
    picture: "/assets/blog/authors/sergio-rodriguez.png",
    bio: {
      es: "Soy un apasionado de los sistemas embebidos, Linux y DevOps. Desarrollo aplicaciones, automatizo tareas y monto mi propia infraestructura. En Continuous Disintegration comparto lo que aprendo: guías prácticas, proyectos personales y los problemas que aparecen al llevar una idea a la práctica.",
      en: "I am passionate about embedded systems, Linux and DevOps. I build applications, automate tasks and run my own infrastructure. On Continuous Disintegration, I share what I learn: practical guides, personal projects and the problems that come up when putting an idea into practice.",
    },
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

export function getAuthorProfile(name: string, locale: "es" | "en" = "es") {
  const normalizedName = name.trim().toLocaleLowerCase("es");
  const profile = authorProfiles[normalizedName];

  const resolved: AuthorProfile = profile ?? {
      slug: createAuthorSlug(name),
      bio: {
        es: `${name} comparte artículos y experiencias técnicas en el blog.`,
        en: `${name} shares technical articles and experiences on the blog.`,
      },
    };

  return {
    slug: resolved.slug,
    bio: resolved.bio[locale],
    ...(resolved.picture ? { picture: resolved.picture } : {}),
  };
}

export function getAuthorSlug(name: string) {
  return getAuthorProfile(name).slug;
}
