"use client";

import { useState } from "react";
import clsx from "clsx";

export function LanguageToggle() {
  const [lang, setLang] = useState<"ne" | "en">("ne");

  return (
    <button
      onClick={() => setLang(lang === "ne" ? "en" : "ne")}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-gray-200 dark:border-gray-750/70 font-sans cursor-pointer group"
      title="Toggle Language"
    >
      <div className="flex flex-col items-center justify-center leading-none select-none">
        <span className={clsx("text-[10px] font-black tracking-tighter transition-colors duration-150", lang === "ne" ? "text-[#dc2626] dark:text-red-400" : "text-gray-400 dark:text-gray-500")}>
          ने
        </span>
        <span className="h-[1px] w-5 bg-gray-200 dark:bg-gray-700 my-0.5" />
        <span className={clsx("text-[9px] font-black tracking-tighter transition-colors duration-150", lang === "en" ? "text-[#dc2626] dark:text-red-400" : "text-gray-400 dark:text-gray-500")}>
          EN
        </span>
      </div>
    </button>
  );
}
