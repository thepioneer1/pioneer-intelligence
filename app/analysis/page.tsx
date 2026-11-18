"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// TypeScript interface matching your V2 AI JSON output
interface ProductConcept {
  name: string;
  description: string;
  coreFeatures: string[];
}

interface V2AnalysisReport {
  industry: string;
  opportunityScore: number;
  topCompetitors: string[];
  customerPainPoints: string[];
  marketGaps: string[];
  productOpportunities: ProductConcept[];
  businessModels: string[];
}

function isV2AnalysisReport(value: unknown): value is V2AnalysisReport {
  if (typeof value !== "object" || value === null) return false;

  const report = value as Record<string, unknown>;
  return (
    typeof report.industry === "string" &&
    typeof report.opportunityScore === "number" &&
    Array.isArray(report.topCompetitors) &&
    report.topCompetitors.every((item) => typeof item === "string") &&
    Array.isArray(report.customerPainPoints) &&
    report.customerPainPoints.every((item) => typeof item === "string") &&
    Array.isArray(report.marketGaps) &&
    report.marketGaps.every((item) => typeof item === "string") &&
    Array.isArray(report.productOpportunities) &&
    report.productOpportunities.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === "string" &&
        typeof (item as Record<string, unknown>).description === "string" &&
        Array.isArray((item as Record<string, unknown>).coreFeatures) &&
        ((item as Record<string, unknown>).coreFeatures as unknown[]).every(
          (feature) => typeof feature === "string",
        ),
    ) &&
    Array.isArray(report.businessModels) &&
    report.businessModels.every((item) => typeof item === "string")
  );
}

export default function AnalysisPage() {
  const [report, setReport] = useState<V2AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
      try {
        const industry = new URLSearchParams(window.location.search).get("industry")?.trim();
        if (!industry) {
          throw new Error("No industry was provided. Go back and enter an industry to analyze.");
        }

        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ industry }),
          signal: controller.signal,
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Analysis request failed.";
          throw new Error(message);
        }

        if (!isV2AnalysisReport(result)) {
          throw new Error("The server returned an invalid analysis report.");
        }

        setReport(result);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error ? requestError.message : "Could not load the analysis.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadReport();
    return () => controller.abort();
  }, []);

  if (!report) {
    return (
      <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="max-w-xl text-center">
          <p className="text-gray-300">
            {isLoading ? "Generating your analysis..." : error}
          </p>
          {error && (
            <Link href="/" className="inline-block mt-5 text-emerald-400 hover:text-emerald-300">
              Back to search
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
          >
            ← Back to Search
          </Link>
        </div>
        {/* Header & Opportunity Score Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-emerald-400 font-semibold mb-1">
              V2 Venture Intelligence Report
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">
              {report.industry} Analysis
            </h1>
            <p className="text-gray-400 mt-2">
              AI-generated market gap & product concept report.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl text-center">
            <span className="block text-xs text-gray-400 uppercase tracking-wider">
              Opportunity Score
            </span>
            <span className="text-4xl font-extrabold text-emerald-400">
              {report.opportunityScore}
              <span className="text-lg text-gray-500">/100</span>
            </span>
          </div>
        </div>

        {/* V1 Foundation: Competitors & Pain Points */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Top Competitors</h2>
            <ul className="space-y-2 text-gray-300">
              {report.topCompetitors.map((comp, idx) => (
                <li key={idx}>• {comp}</li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Customer Pain Points</h2>
            <ul className="space-y-2 text-gray-300">
              {report.customerPainPoints.map((pain, idx) => (
                <li key={idx}>• {pain}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* V2 Expansion: Market Gaps */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-emerald-500/30 mb-6">
          <h2 className="text-2xl font-semibold text-emerald-400 mb-4">
            Detected Market Gaps
          </h2>
          <ul className="space-y-3 text-gray-200">
            {report.marketGaps.map((gap, idx) => (
              <li key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                {gap}
              </li>
            ))}
          </ul>
        </div>

        {/* V2 Expansion: Product Concepts & Revenue Models */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Product Concepts</h2>
            <div className="space-y-4">
              {report.productOpportunities.map((product, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 p-5 rounded-xl border border-zinc-800"
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.coreFeatures.map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-xs bg-zinc-800 text-gray-200 px-3 py-1 rounded-full"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Revenue Models</h2>
            <ul className="space-y-3 text-gray-300">
              {report.businessModels.map((model, idx) => (
                <li
                  key={idx}
                  className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-sm"
                >
                  {model}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}