import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
  id: string;
  name: string;
  image: string | null;
  productCount?: number;
}

export function CategoryCard({ id, name, image, productCount }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 brand-gradient opacity-20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-lg font-semibold">{name}</h3>
        {typeof productCount === "number" && (
          <p className="text-xs text-white/80 mt-0.5">
            {productCount} {productCount === 1 ? "product" : "products"}
          </p>
        )}
      </div>
    </Link>
  );
}
