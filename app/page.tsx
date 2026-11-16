export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-bold mb-6 text-center">
        Pioneer Intelligence
      </h1>

      <p className="text-xl text-gray-400 text-center max-w-3xl mb-10">
        Discover profitable business opportunities through AI-powered
        competitor analysis, market intelligence, and trend forecasting.
      </p>

      <div className="w-full max-w-xl">
        <input
          type="text"
          placeholder="Enter an industry..."
          className="w-full p-4 rounded-xl text-black text-lg"
        />

        <button className="w-full mt-4 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
          Analyze Market
        </button>
      </div>
    </main>
  );
}
