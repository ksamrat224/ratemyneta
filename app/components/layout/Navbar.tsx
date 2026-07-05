import Link from "next/link";
import { WalletButton } from "../wallet-button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-[#dc2626] text-white shadow-sm border-b border-red-700/20">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-black text-xl tracking-tight text-white shrink-0 hover:opacity-90 transition-opacity">
            Rate My Neta
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-white/90">
            <Link href="/" className="hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Politicians
            </Link>
            <Link href="/party" className="hover:text-white transition-colors">
              Parties
            </Link>
            
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex justify-around border-t border-white/10 py-2.5 text-xs font-semibold text-white/95 bg-[#c22121]">
        <Link href="/" className="hover:text-white transition-colors">
          Leaderboard
        </Link>
        <Link href="/" className="hover:text-white transition-colors">
          Politicians
        </Link>
        <Link href="/party" className="hover:text-white transition-colors">
          Parties
        </Link>
        
      </div>
    </nav>
  );
}
