import { RssPage, buildRssMetadata } from "../../_views/rss-page";

export const metadata = buildRssMetadata("en");
export default function Page() { return <RssPage locale="en" />; }
