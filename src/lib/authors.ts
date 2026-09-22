type AuthorProfile = {
  slug: string;
  bio: Record<"es" | "en", string>;
};

const authorProfiles: Record<string, AuthorProfile> = {
  "sergio rodriguez": {
    slug: "sergio-rodriguez",
    bio: {
      es: "Comparte guías prácticas, herramientas y experiencias sobre desarrollo e infraestructura.",
      en: "Shares practical guides, tools and experiences about software development and infrastructure.",
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

  const resolved = profile ?? {
      slug: createAuthorSlug(name),
      bio: {
        es: `${name} comparte artículos y experiencias técnicas en el blog.`,
        en: `${name} shares technical articles and experiences on the blog.`,
      },
    };

  return { slug: resolved.slug, bio: resolved.bio[locale] };
}

export function getAuthorSlug(name: string) {
  return getAuthorProfile(name).slug;
}
