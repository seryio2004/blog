import { RootDocument, rootMetadata } from "@/app/_components/root-document";
import "../globals.css";

export const metadata = rootMetadata("en");

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
