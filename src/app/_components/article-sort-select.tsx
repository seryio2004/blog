"use client";

import { copy, type Locale } from "@/lib/i18n";

type Props = {
  value: "newest" | "oldest";
  onChange: (value: "newest" | "oldest") => void;
  locale?: Locale;
};

export function ArticleSortSelect({ value, onChange, locale = "es" }: Props) {
  const text = copy[locale];
  return (
    <label className="sort-control">
      {text.sort}
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value as "newest" | "oldest");
        }}
        className="sort-control__select"
        aria-label={text.sortLabel}
      >
        <option value="newest">{text.newest}</option>
        <option value="oldest">{text.oldest}</option>
      </select>
    </label>
  );
}
