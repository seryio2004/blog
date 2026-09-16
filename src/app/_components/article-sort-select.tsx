"use client";

type Props = {
  value: "recientes" | "antiguos";
  onChange: (value: "recientes" | "antiguos") => void;
};

export function ArticleSortSelect({ value, onChange }: Props) {
  return (
    <label className="sort-control">
      ORDENAR /
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value as "recientes" | "antiguos");
        }}
        className="sort-control__select"
        aria-label="Orden de los artículos"
      >
        <option value="recientes">Más recientes</option>
        <option value="antiguos">Más antiguos</option>
      </select>
    </label>
  );
}
