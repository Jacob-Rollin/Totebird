import Image from "next/image";
import Link from "next/link";

export function TotebirdLogo({
  size = "md",
  href = "/",
  variant = "wordmark",
}: {
  size?: "sm" | "md" | "lg" | "hero";
  href?: string | null;
  variant?: "wordmark" | "wordmark-dark" | "header" | "lockup" | "icon";
}) {
  const heights = { sm: 28, md: 36, lg: 48, hero: 72 };
  const h = heights[size];

  const src =
    variant === "icon"
      ? "/brand/icon/icon-orange-bird.png"
      : variant === "lockup"
        ? "/brand/lockup-horizontal.png"
        : variant === "header"
          ? "/brand/header-wordmark.png"
          : variant === "wordmark-dark"
            ? "/brand/wordmark-white-orange.png"
            : "/brand/wordmark-slate-orange.png";

  const aspect =
    variant === "icon" ? 1 : variant === "lockup" ? 4.6 : variant === "header" ? 4.3 : 4;

  const img = (
    <Image
      src={src}
      alt="Totebird"
      height={h}
      width={Math.round(h * aspect)}
      className="h-auto w-auto max-w-full object-contain"
      priority={size === "hero" || size === "lg"}
    />
  );

  if (!href) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Totebird home">
      {img}
    </Link>
  );
}
