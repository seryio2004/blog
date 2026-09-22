import { getAuthors } from "@/lib/api";
import { AuthorPageContent, buildAuthorMetadata } from "../../../_views/author-page";

type Props = { params: Promise<{ slug: string }> };
export default function EnglishAuthorPage(props: Props) { return <AuthorPageContent {...props} locale="en" />; }
export function generateMetadata(props: Props) { return buildAuthorMetadata({ ...props, locale: "en" }); }
export function generateStaticParams() { return getAuthors("en").map(author => ({ slug: author.slug })); }
