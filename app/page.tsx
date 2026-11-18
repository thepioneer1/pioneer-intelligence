"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [industry, setIndustry] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim()) return;
    // Redirects to your analysis page with the industry typed in the URL
    router.push(`/analysis?industry=${encodeURIComponent(industry.trim())}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
          AI Venture Intelligence
        </p>
        <h1 className="text-5xl font-bold mb-4">
          Pioneer Intelligence
        </h1>
        <p className="text-gray-400 mb-8">
          Enter any industry to uncover market gaps, competitor weaknesses, and AI product concepts.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Electricians, Coffee Shops..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="bg-emerald-500 text-black font-bold px-8 py-4 rounded-xl hover:bg-emerald-400 transition cursor-pointer"
          >
            Analyze Market
          </button>
        </form>
      </div>
    </main>
  );
}