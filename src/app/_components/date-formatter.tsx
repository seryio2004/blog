import type { Locale } from "@/lib/i18n";

type Props = { dateString: string; locale?: Locale };

export default function DateFormatter({ dateString, locale = "es" }: Props) {
  const formatted = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));

  return <time dateTime={dateString}>{formatted}</time>;
}
