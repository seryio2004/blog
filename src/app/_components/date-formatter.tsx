type Props = { dateString: string };

export default function DateFormatter({ dateString }: Props) {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));

  return <time dateTime={dateString}>{formatted}</time>;
}
