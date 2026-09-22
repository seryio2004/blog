import { getAuthors } from "@/lib/api";
import { AuthorPageContent, buildAuthorMetadata } from "../../_views/author-page";

type Props = { params: Promise<{ slug: string }> };
export default function AuthorPage(props: Props) { return <AuthorPageContent {...props} locale="es" />; }
export function generateMetadata(props: Props) { return buildAuthorMetadata({ ...props, locale: "es" }); }
export function generateStaticParams() { return getAuthors("es").map(author => ({ slug: author.slug })); }
