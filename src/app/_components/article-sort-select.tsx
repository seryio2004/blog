"use client";

import { useRouter } from "next/navigation";

type Props = {
  value: "recientes" | "antiguos";
};

export function ArticleSortSelect({ value }: Props) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-3 text-sm text-violet-100/70">
      Ordenar por
      <select
        value={value}
        onChange={(event) => {
          const order = event.target.value;
          router.replace(
            order === "antiguos"
              ? "/articulos?orden=antiguos"
              : "/articulos",
            { scroll: false },
          );
        }}
        className="rounded-lg border border-violet-300/20 bg-violet-950/40 px-3 py-2 text-violet-50 outline-none transition-colors hover:border-violet-300/40 focus:border-violet-300/60"
        aria-label="Orden de los artículos"
      >
        <option value="recientes">Más recientes</option>
        <option value="antiguos">Más antiguos</option>
      </select>
    </label>
  );
}
