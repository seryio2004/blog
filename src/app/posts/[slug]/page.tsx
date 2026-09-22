import { getAllPosts } from "@/lib/api";
import { buildPostMetadata, PostPageContent } from "../../_views/post-page";

type Params = { params: Promise<{ slug: string }> };
export default function Post(props: Params) { return <PostPageContent {...props} locale="es" />; }
export function generateMetadata(props: Params) { return buildPostMetadata({ ...props, locale: "es" }); }
export function generateStaticParams() { return getAllPosts("es").map(post => ({ slug: post.slug })); }
