import { getSections } from "@/lib/api";
import { buildSectionMetadata, SectionPageContent } from "../../../_views/section-page";

type Props = { params: Promise<{ section: string }> };
export default function EnglishSectionPage(props: Props) { return <SectionPageContent {...props} locale="en" />; }
export function generateMetadata(props: Props) { return buildSectionMetadata({ ...props, locale: "en" }); }
export function generateStaticParams() { return getSections("en").map(section => ({ section: section.slug })); }
