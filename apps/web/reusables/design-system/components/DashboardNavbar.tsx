import type { ReactNode } from "react";

export type DashboardPathSegment = {
  label: ReactNode;
  href?: string;
};

export function DashboardNavbar({
  brand = "EV.",
  brandHref = "/dashboard",
  paths = [],
  utilitySlot,
  actionSlot,
}: {
  brand?: ReactNode;
  brandHref?: string;
  paths?: DashboardPathSegment[];
  utilitySlot?: ReactNode;
  actionSlot?: ReactNode;
}) {
  return (
    <header className="grid flex-shrink-0 grid-cols-[1fr_auto] items-center border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-4 sm:grid-cols-[auto_1fr_auto] sm:px-6">
      <div className="flex h-11 min-w-0 items-center text-xl font-black tracking-tighter text-[#1a1a1a] sm:h-14">
        <a
          href={brandHref}
          className="mr-2 flex-shrink-0 transition-colors hover:text-[#2d5a2d]"
        >
          {brand}
        </a>

        {paths.map((path, index) => {
          const isIntermediate = paths.length >= 2 && index < paths.length - 1;
          return (
            <div
              key={`${String(path.label)}-${index}`}
              className={`${isIntermediate ? "hidden sm:flex" : "flex"} min-w-0 flex-shrink items-center`}
            >
              <span className="mr-2 flex-shrink-0 text-[#888]">/</span>
              {path.href ? (
                <a
                  href={path.href}
                  className="mr-2 truncate transition-colors hover:text-[#2d5a2d]"
                >
                  {path.label}
                </a>
              ) : (
                <div className="truncate">{path.label}</div>
              )}
            </div>
          );
        })}
      </div>

      {utilitySlot ? (
        <div className="row-start-1 col-start-2 flex h-8 items-center gap-4 border-l-2 border-[#1a1a1a]/10 pl-4 sm:col-start-3">
          {utilitySlot}
        </div>
      ) : null}

      {actionSlot ? (
        <div className="col-span-full flex min-w-0 items-center gap-2 pb-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:h-14 sm:justify-end sm:gap-3 sm:pb-0 sm:pl-4">
          {actionSlot}
        </div>
      ) : null}
    </header>
  );
}
