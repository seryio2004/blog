import cn from "classnames";
import Link from "next/link";
import { getAuthorSlug } from "@/lib/authors";
import { withBasePath } from "@/lib/paths";

type Props = {
  name: string;
  picture: string;
  compact?: boolean;
};

const Avatar = ({ name, picture, compact = false }: Props) => {
  return (
    <Link
      href={`/autores/${getAuthorSlug(name)}`}
      className="group inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
      aria-label={`Ver perfil de ${name}`}
    >
      <img
        src={withBasePath(picture)}
        className={cn(
          "rounded-full object-cover transition-transform duration-200 group-hover:scale-105",
          compact
            ? "mr-[0.9rem] h-[2.7rem] w-[2.7rem]"
            : "mr-4 h-12 w-12",
        )}
        alt={name}
      />
      <span
        className={cn(
          "font-bold transition-colors duration-200 group-hover:text-sky-300 group-hover:underline",
          compact ? "text-[1.125rem]" : "text-xl",
        )}
      >
        {name}
      </span>
    </Link>
  );
};

export default Avatar;
