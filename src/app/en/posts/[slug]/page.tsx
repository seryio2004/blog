import { getAllPosts } from "@/lib/api";
import { buildPostMetadata, PostPageContent } from "../../../_views/post-page";

type Params = { params: Promise<{ slug: string }> };
export default function EnglishPost(props: Params) { return <PostPageContent {...props} locale="en" />; }
export function generateMetadata(props: Params) { return buildPostMetadata({ ...props, locale: "en" }); }
export function generateStaticParams() { return getAllPosts("en").map(post => ({ slug: post.slug })); }
