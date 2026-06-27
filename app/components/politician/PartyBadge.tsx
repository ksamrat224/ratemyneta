import { parties } from "@/app/data/parties";

interface PartyBadgeProps {
  partyId: string;
}

export function PartyBadge({ partyId }: PartyBadgeProps) {
  const party = parties[partyId];
  if (!party) return null;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: party.color }}
    >
      {party.shortName}
    </span>
  );
}
