import type { ReactNode } from "react";

export function AuthShell({
  children,
  homeHref = "/",
  brand = "EV.",
  subtitle = "Event roulette for live activations",
}: {
  children: ReactNode;
  homeHref?: string;
  brand?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f0f0e8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#1a1a1a 1px, transparent 1px),
            linear-gradient(90deg, #1a1a1a 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <a href={homeHref} className="inline-block">
            <span className="text-4xl font-black text-[#1a1a1a]">{brand}</span>
          </a>
          <p className="mt-3 text-sm text-[#888]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
