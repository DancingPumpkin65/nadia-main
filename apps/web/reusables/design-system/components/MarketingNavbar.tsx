import type { ReactNode } from "react";

type NavItem = {
  label: ReactNode;
  href: string;
  hiddenOnMobile?: boolean;
};

export function MarketingNavbar({
  brand = "EV.",
  brandHref = "/",
  items,
  utilitySlot,
  ctaLabel,
  ctaHref,
}: {
  brand?: ReactNode;
  brandHref?: string;
  items: NavItem[];
  utilitySlot?: ReactNode;
  ctaLabel: ReactNode;
  ctaHref: string;
}) {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-4 text-[#1a1a1a]">
      <div className="flex items-center gap-4">
        <a href={brandHref} className="text-xl font-black tracking-tighter">
          {brand}
        </a>
      </div>

      <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-wide">
        {items.map((item) => (
          <a
            key={String(item.href)}
            href={item.href}
            className={`${item.hiddenOnMobile ? "hidden sm:block" : ""} hover:underline underline-offset-4`}
          >
            {item.label}
          </a>
        ))}

        {utilitySlot ? <div className="flex items-center">{utilitySlot}</div> : null}

        <a
          href={ctaHref}
          className="border-2 border-[#1a1a1a] px-4 py-2 transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
        >
          {ctaLabel}
        </a>
      </div>
    </nav>
  );
}
