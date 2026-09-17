type AuthorProfile = {
  slug: string;
  bio: string;
};

const authorProfiles: Record<string, AuthorProfile> = {
  "sergio rodriguez": {
    slug: "sergio-rodriguez",
    bio: "Comparte guías prácticas, herramientas y experiencias sobre desarrollo e infraestructura.",
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
