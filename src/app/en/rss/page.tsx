import { RssPage, buildRssMetadata } from "@/app/_views/rss-page";

export const metadata = buildRssMetadata("en");
export default function Page() { return <RssPage locale="en" />; }
