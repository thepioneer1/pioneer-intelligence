export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          Industry Analysis
        </h1>

        <p className="text-gray-400 mb-8">
          AI-generated market report.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-semibold mb-4">
              Top Competitors
            </h2>

            <ul className="space-y-2">
              <li>• ServiceM8</li>
              <li>• Tradify</li>
              <li>• Jobber</li>
            </ul>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-semibold mb-4">
              Top Pain Points
            </h2>

            <ul className="space-y-2">
              <li>• Missed phone calls</li>
              <li>• Scheduling issues</li>
              <li>• Quote generation</li>
            </ul>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            Best Opportunity
          </h2>

          <p>AI Receptionist for Electricians</p>

          <p className="mt-4 text-green-400 font-bold">
            Opportunity Score: 92/100
          </p>
        </div>
      </div>
    </main>
  );
}