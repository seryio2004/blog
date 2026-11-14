import { RootDocument, rootMetadata } from "@/app/_components/root-document";
import "../globals.css";

export const metadata = rootMetadata("es");

export default function SpanishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="es">{children}</RootDocument>;
}
