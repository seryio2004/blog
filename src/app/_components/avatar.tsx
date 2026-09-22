import Link from "next/link";
import { getAuthorSlug } from "@/lib/authors";
import { withBasePath } from "@/lib/paths";
import { copy, routes, type Locale } from "@/lib/i18n";

type Props = { name: string; picture: string; compact?: boolean; locale?: Locale };

export default function Avatar({ name, picture, locale = "es" }: Props) {
  return (
    <Link href={routes(locale).author(getAuthorSlug(name))} className="author-link" aria-label={`${copy[locale].authorProfile} ${name}`}>
      <img src={withBasePath(picture)} alt="" width="32" height="32" />
      <span>{name}</span>
      <span aria-hidden="true">-&gt;</span>
    </Link>
  );
}
