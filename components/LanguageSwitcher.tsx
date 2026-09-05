"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
          language === "en"
            ? "bg-indigo-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage("ar")}
        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
          language === "ar"
            ? "bg-indigo-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        AR
      </button>

      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
          language === "fr"
            ? "bg-indigo-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        FR
      </button>
    </div>
  );
}
