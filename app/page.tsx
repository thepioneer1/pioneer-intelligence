"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-8">
        Pioneer Intelligence
      </h1>

      <button
        onClick={() => {
          window.location.href = "/analysis";
        }}
        className="bg-white text-black px-8 py-4 rounded-xl"
      >
        Analyze Market
      </button>
    </main>
  );
}