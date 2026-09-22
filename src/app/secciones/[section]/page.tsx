import { getSections } from "@/lib/api";
import { buildSectionMetadata, SectionPageContent } from "../../_views/section-page";

type Props = { params: Promise<{ section: string }> };
export default function SectionPage(props: Props) { return <SectionPageContent {...props} locale="es" />; }
export function generateMetadata(props: Props) { return buildSectionMetadata({ ...props, locale: "es" }); }
export function generateStaticParams() { return getSections("es").map(section => ({ section: section.slug })); }
