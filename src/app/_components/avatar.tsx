import Link from "next/link";
import { getAuthorSlug } from "@/lib/authors";
import { withBasePath } from "@/lib/paths";

type Props = { name: string; picture: string; compact?: boolean };

export default function Avatar({ name, picture }: Props) {
  return (
    <Link href={`/autores/${getAuthorSlug(name)}`} className="author-link" aria-label={`Ver perfil de ${name}`}>
      <img src={withBasePath(picture)} alt="" width="32" height="32" />
      <span>{name}</span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
