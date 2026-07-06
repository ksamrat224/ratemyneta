"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "../wallet-button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/politicians", label: "Politicians" },
  { href: "/party", label: "Parties" },
  { href: "/how-it-works", label: "How It Works" },
];

export function Navbar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-40 bg-[#dc2626] text-white shadow-sm">
      <div className="max-w-400 mx-auto px-4 h-16 flex items-center">
        {/* Left: logo */}
        <div className="w-52 shrink-0">
          <Link href="/" className="font-black text-lg tracking-tight text-white hover:opacity-90 transition-opacity">
            Rate My Politician
          </Link>
        </div>

        {/* Center: nav links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-1 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded transition-colors ${
                isActive(href)
                  ? "text-white border-b-2 border-white font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: wallet + avatar */}
        <div className="w-52 flex items-center justify-end gap-3 shrink-0">
          <WalletButton />
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/30 shrink-0 bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-full w-full" fill="none">
              <circle cx="18" cy="18" r="18" fill="#b91c1c" />
              <text x="18" y="23" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="sans-serif">न</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex justify-around border-t border-white/10 py-2.5 text-xs font-semibold bg-[#c22121]">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "text-white border-b border-white pb-0.5" : "text-white/80"}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
