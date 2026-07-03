import { politicians } from "@/app/data/politicians";
import { parties } from "@/app/data/parties";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-250/60 dark:border-gray-700/60 p-5 flex flex-col gap-1.5 shadow-xs">
      <span className="text-3xl font-black text-[#dc2626] dark:text-red-400">{value}</span>
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">{label}</span>
      {sublabel && <span className="text-[10px] font-semibold text-gray-450 dark:text-gray-500">{sublabel}</span>}
    </div>
  );
}

interface StatsRowProps {
  onChainRatings: number;
  zkVerifiedCount: number;
}

export function StatsRow({ onChainRatings, zkVerifiedCount }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Politicians Tracked"
        value={politicians.length}
        sublabel="from Nepal Parliament"
      />
      <StatCard
        label="Janamat Polls"
        value="Live"
        sublabel="powered by Janamat"
      />
      <StatCard
        label="On-Chain Ratings"
        value={onChainRatings.toLocaleString()}
        sublabel="immutable on Solana"
      />
      <StatCard
        label="zkID Verified"
        value={zkVerifiedCount.toLocaleString()}
        sublabel="via Janamat zkID"
      />
    </div>
  );
}
