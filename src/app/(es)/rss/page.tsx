import { RssPage, buildRssMetadata } from "@/app/_views/rss-page";

export const metadata = buildRssMetadata("es");
export default function Page() { return <RssPage locale="es" />; }
