import { RssPage, buildRssMetadata } from "../_views/rss-page";

export const metadata = buildRssMetadata("es");
export default function Page() { return <RssPage locale="es" />; }
