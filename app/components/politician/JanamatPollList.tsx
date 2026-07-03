"use client";

import useSWR from "swr";
import { fetchPoll } from "@/app/janamat/client";
import { classifyOptionSentiment } from "@/app/janamat/sentiment";
import clsx from "clsx";

interface JanamatPollListProps {
  pollIds: number[];
}

function PollCard({ pollId }: { pollId: number }) {
  const { data: poll, error } = useSWR(["janamat-poll", pollId], () =>
    fetchPoll(pollId)
  );

  if (error) return null;
  if (!poll) return (
    <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  );

  const total = poll.totalVotes || 1;

  return (
    <div className="border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5 space-y-4 bg-gray-50/30 dark:bg-gray-900/35">
      <h4 className="font-extrabold text-sm text-gray-950 dark:text-gray-100 leading-snug">{poll.title}</h4>
      <div className="space-y-3.5">
        {poll.options.map((opt) => {
          const pct = Math.round((opt.votes / total) * 100);
          const sentiment = classifyOptionSentiment(opt.text);
          return (
            <div key={opt.id} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">{opt.text}</span>
                <span className="text-gray-900 dark:text-gray-200">{pct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    sentiment === "positive" && "bg-[#dc2626]",
                    sentiment === "negative" && "bg-[#8b5cf6]",
                    sentiment === "neutral" && "bg-gray-400 dark:bg-gray-600"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wide">
        <span>{poll.totalVotes.toLocaleString()} votes</span>
        <span>Janamat Verified</span>
      </div>
    </div>
  );
}

export function JanamatPollList({ pollIds }: JanamatPollListProps) {
  if (!pollIds || pollIds.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No Janamat polls linked yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {pollIds.map((id) => (
        <PollCard key={id} pollId={id} />
      ))}
    </div>
  );
}
