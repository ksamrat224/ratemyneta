import { politicians } from "@/app/data/politicians";
import { parties } from "@/app/data/parties";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
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
