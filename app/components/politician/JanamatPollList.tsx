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
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{poll.title}</h4>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = Math.round((opt.votes / total) * 100);
          const sentiment = classifyOptionSentiment(opt.text);
          return (
            <div key={opt.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-300">{opt.text}</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    sentiment === "positive" && "bg-green-500",
                    sentiment === "negative" && "bg-red-500",
                    sentiment === "neutral" && "bg-gray-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">{poll.totalVotes.toLocaleString()} votes</p>
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
