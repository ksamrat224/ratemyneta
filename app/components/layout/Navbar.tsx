import Link from "next/link";
import { WalletButton } from "../wallet-button";
import { ThemeToggle } from "../theme-toggle";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-indigo-600 dark:text-indigo-400 shrink-0">
          Rate My Neta
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Leaderboard
          </Link>
          <Link href="/party" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Parties
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
