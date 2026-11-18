import { NextResponse } from 'next/server';

interface ProductConcept {
  name: string;
  description: string;
  coreFeatures: string[];
}

interface AnalysisReport {
  industry: string;
  opportunityScore: number;
  topCompetitors: string[];
  customerPainPoints: string[];
  marketGaps: string[];
  productOpportunities: ProductConcept[];
  businessModels: string[];
  _meta?: {
    source: "live-ai" | "offline-fallback";
    modelUsed: string;
    archetype?: string;
  };
}

interface OpenRouterResponse {
  model?: string;
  error?: { message?: string };
  choices?: Array<{
    message?: { content?: string | null };
  }>;
}

const MODEL_CASCADE = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "openrouter/free",
];

function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  if (error.name === "TimeoutError" || error.name === "AbortError") return "ETIMEDOUT";
  if (typeof error.cause === "object" && error.cause !== null && "code" in error.cause) {
    return typeof error.cause.code === "string" ? error.cause.code : undefined;
  }
  return undefined;
}

function sanitizeAnalysisReport(raw: unknown, normalizedIndustry: string): AnalysisReport | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const toCleanStrings = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item !== null && "name" in item) {
          return String((item as Record<string, unknown>).name).trim();
        }
        return "";
      })
      .filter(Boolean);
  };

  const score = Number(r.opportunityScore);
  const topCompetitors = toCleanStrings(r.topCompetitors);
  const customerPainPoints = toCleanStrings(r.customerPainPoints);
  const marketGaps = toCleanStrings(r.marketGaps);
  const businessModels = toCleanStrings(r.businessModels);

  const productOpportunities: ProductConcept[] = Array.isArray(r.productOpportunities)
    ? r.productOpportunities
        .map((p) => {
          if (typeof p !== "object" || p === null) return null;
          const prod = p as Record<string, unknown>;
          const name = typeof prod.name === "string" ? prod.name.trim() : "";
          const description = typeof prod.description === "string" ? prod.description.trim() : "";
          const coreFeatures = toCleanStrings(prod.coreFeatures);
          if (!name || !description) return null;
          return {
            name,
            description,
            coreFeatures: coreFeatures.length > 0 ? coreFeatures : ["Automated Workflow Engine", "Real-Time Analytics"],
          };
        })
        .filter((item): item is ProductConcept => item !== null)
    : [];

  if (
    !Number.isFinite(score) ||
    topCompetitors.length === 0 ||
    customerPainPoints.length === 0 ||
    marketGaps.length === 0 ||
    productOpportunities.length === 0 ||
    businessModels.length === 0
  ) {
    return null;
  }

  return {
    industry: normalizedIndustry,
    opportunityScore: Math.min(99, Math.max(1, Math.round(score))),
    topCompetitors,
    customerPainPoints,
    marketGaps,
    productOpportunities,
    businessModels,
  };
}

function buildAdaptiveFallbackReport(industry: string): AnalysisReport {
  const clean = industry.charAt(0).toUpperCase() + industry.slice(1);
  const lower = industry.toLowerCase();

  const hash = lower.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const score = 81 + (hash % 15);

  // 1. Retail, Fashion & E-Commerce
  if (/(clothing|fashion|boutique|retail|store|apparel|shop|ecommerce|e-commerce|shoes|jewelry)/.test(lower)) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: ["Shopify", "Square Retail", "WooCommerce", "Lightspeed POS"],
      customerPainPoints: [
        `High inventory holding costs and dead stock on slow-moving seasonal apparel`,
        `Fierce margin compression from fast-fashion giants and high customer acquisition costs (CAC)`,
        `Disconnected online inventory and physical brick-and-mortar stock leading to fulfillment errors`,
      ],
      marketGaps: [
        `Hyper-local omnichannel curation engine that helps independent boutique owners predict sizing trends and automate social-to-cart purchasing.`,
      ],
      productOpportunities: [
        {
          name: `VogueSync ${clean} AI`,
          description: `An automated inventory forecasting and social commerce tool built for independent boutique owners to optimize seasonal stock and reduce markdowns.`,
          coreFeatures: [
            "AI-Driven Trend & Sizing Predictor",
            "Unified Online/In-Store POS Inventory Sync",
            "Automated Instagram-to-Cart DM Checkout",
          ],
        },
      ],
      businessModels: [
        "Tiered Monthly SaaS ($59–$129/month)",
        "0.5% Gross Merchandise Value (GMV) volume fee",
      ],
      _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Retail & E-Commerce" },
    };
  }

  // 2. Trades & Field Services
  if (/(electric|plumb|hvac|roof|landscap|construct|clean|repair|contract|auto|mechanic)/.test(lower)) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: ["ServiceTitan", "Jobber", "Housecall Pro", "FieldPulse"],
      customerPainPoints: [
        `On-site technicians lose billable hours manually writing estimates and chasing invoice approvals`,
        `Missed phone calls during active jobs result in immediate lead loss to faster-responding competitors`,
        `Enterprise dispatch platforms are overly complex and expensive for small independent crews`,
      ],
      marketGaps: [
        `Voice-to-estimate mobile co-pilot tailored for small teams that generates itemized quotes from job-site photos in under 30 seconds.`,
      ],
      productOpportunities: [
        {
          name: `FieldSnap ${clean} AI`,
          description: `A mobile intake and quoting engine built for independent operators to turn job-site conditions into signed estimates on the spot.`,
          coreFeatures: [
            "Photo & Voice-to-Quote Generator",
            "Automated Missed-Call SMS Booking",
            "One-Tap Deposit & Invoice Collection",
          ],
        },
      ],
      businessModels: [
        "Flat-rate SMB SaaS ($79/month per crew)",
        "1.5% instant payout processing fee",
      ],
      _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Field Services & Trades" },
    };
  }

  // 3. Food & Hospitality
  if (/(coffee|cafe|restaurant|bakery|food|bar|cater|pizza|kitchen|hospitality)/.test(lower)) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: ["Toast", "Square for Restaurants", "Lightspeed", "7shifts"],
      customerPainPoints: [
        `Unpredictable ingredient waste and over-ordering due to disconnected POS and inventory data`,
        `High staff turnover makes training new hires on recipes and peak-hour workflows slow`,
        `Third-party delivery apps erode net margins by 15–30% without capturing repeat customer data`,
      ],
      marketGaps: [
        `Predictive micro-inventory and prep-forecasting layer connecting directly to existing POS data for independent operators.`,
      ],
      productOpportunities: [
        {
          name: `PantryPulse for ${clean}`,
          description: `An AI demand-forecasting and automated supplier ordering tool that cuts perishable waste by analyzing local weather and sales velocity.`,
          coreFeatures: [
            "POS-Synced Daily Prep & Par Calculator",
            "Automated Supplier Reorder Alerts",
            "Direct SMS VIP Loyalty & Pre-Order Loop",
          ],
        },
      ],
      businessModels: [
        "Monthly location subscription ($89/location)",
        "Supplier marketplace rebate share",
      ],
      _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Food & Hospitality" },
    };
  }

  // 4. Health, Fitness & Appointments
  if (/(dental|clinic|gym|fitness|physio|salon|barber|spa|health|vet|wellness)/.test(lower)) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: ["Mindbody", "Jane App", "Fresha", "Vagaro"],
      customerPainPoints: [
        `Last-minute appointment cancellations and no-shows leave high-margin daily slots unfilled`,
        `Front-desk staff spend hours on repetitive intake forms and rebooking calls`,
        `Client drop-off after initial visits due to lack of personalized post-session follow-up`,
      ],
      marketGaps: [
        `Autonomous waitlist-backfill and retention agent that automatically fills cancelled slots via SMS within minutes.`,
      ],
      productOpportunities: [
        {
          name: `SlotFill ${clean} AI`,
          description: `An automated schedule-recovery and client retention engine that detects cancellations and triggers targeted SMS offers.`,
          coreFeatures: [
            "Instant Cancellation Waitlist Backfill",
            "Pre-Visit Digital Intake & Triage",
            "Automated Rebooking Cadence Engine",
          ],
        },
      ],
      businessModels: [
        "Base SaaS ($69/month) + performance fee per recovered slot",
        "Multi-practitioner tier pricing",
      ],
      _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Health, Wellness & Appointments" },
    };
  }

  // 5. Sports, Clubs, Coaching & Athletics
  if (/(football|soccer|basketball|rugby|tennis|cricket|sport|coach|league|club|academy|athletic|team)/.test(lower)) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: ["Hudl", "TeamSnap", "Catapult Sports", "PlayMetrics"],
      customerPainPoints: [
        `Grassroots and amateur ${lower} coaches spend hours manually clipping game film and tagging player stats`,
        `Fragmented parent/player communication, roster availability, and registration fee collection across spreadsheets and group chats`,
        `Pro-grade wearable GPS and tactical analytics tools are priced far out of reach for youth and semi-pro clubs`,
      ],
      marketGaps: [
        `Affordable smartphone-only computer vision scouting and automated highlight tagging built specifically for grassroots ${lower} clubs and academies.`,
      ],
      productOpportunities: [
        {
          name: `PitchVision ${clean} AI`,
          description: `A sideline smartphone video analyzer that automatically tracks player positioning, generates tactical heatmaps, and clips recruitable highlights without expensive camera rigs.`,
          coreFeatures: [
            "Automated Smartphone Match Film Tagging",
            "Player Recruiting Highlight Reel Generator",
            "Unified Roster, Dues & Attendance Hub",
          ],
        },
      ],
      businessModels: [
        "Annual club/team license ($299/team per season)",
        "Freemium player recruiting profile upgrades ($15/month)",
      ],
      _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Sports & Athletics" },
    };
  }

  // 6. General Industry Fallback
  return {
    industry: clean,
    opportunityScore: score,
    topCompetitors: [
      `Legacy ${clean} Platforms`,
      `Enterprise ${clean} Software`,
      `Traditional Regional Operators`,
    ],
    customerPainPoints: [
      `Independent ${lower} operators rely on fragmented spreadsheets, manual tracking, and disjointed software tools`,
      `High administrative overhead and slow turnaround times on client inquiries lead to lost revenue`,
      `Existing enterprise solutions for ${lower} are too bloated, expensive, and difficult to set up`,
    ],
    marketGaps: [
      `Lightweight, AI-native workflow and automation layer purpose-built specifically for independent ${lower} businesses.`,
    ],
    productOpportunities: [
      {
        name: `Pioneer ${clean} Co-Pilot`,
        description: `An opinionated automation assistant that streamlines intake, scheduling, and client management for ${lower} teams.`,
        coreFeatures: [
          "24/7 Automated Inbound Lead Intake",
          "AI-Powered Workflow & Task Automation",
          "Instant Client Portal & Status Tracker",
        ],
      },
    ],
    businessModels: [
      "Tiered Monthly SaaS ($49–$99/month)",
      "Usage-based AI transaction fee",
    ],
    _meta: { source: "offline-fallback", modelUsed: "local-sector-engine", archetype: "Vertical Specialized" },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("industry" in body)) {
    return NextResponse.json({ error: "An industry is required." }, { status: 400 });
  }

  const industry = body.industry;
  if (typeof industry !== "string" || !industry.trim() || industry.trim().length > 160) {
    return NextResponse.json(
      { error: "Industry must be between 1 and 160 characters." },
      { status: 400 },
    );
  }

  const normalizedIndustry = industry.trim();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ OPENROUTER_API_KEY missing — serving adaptive fallback.");
    return NextResponse.json(buildAdaptiveFallbackReport(normalizedIndustry));
  }

  const systemPrompt = `You are a senior venture capital analyst and market intelligence researcher.
Analyze the target industry deeply and return concrete, specific market intelligence.

CRITICAL RULES:
1. "topCompetitors" MUST list 3 to 5 REAL, existing companies, software platforms, or major brands operating in this exact sector (e.g., for Electricians: "ServiceTitan", "Jobber", "Housecall Pro"). NEVER output generic placeholders like "Legacy Suites", "Regional Operators", or "Competitor 1".
2. "customerPainPoints" MUST describe specific, costly operational or buyer bottlenecks in this industry.
3. "marketGaps" MUST identify underserved niches, workflow bottlenecks, or pricing gaps left open by current incumbents.
4. "productOpportunities" MUST propose 2 concrete, brandable software or tech-enabled product concepts tailored to solve those gaps.
5. "businessModels" MUST list realistic monetization and pricing strategies for those products.

Respond ONLY with a valid JSON object matching this exact schema (no markdown fences, no commentary):
{
  "industry": "Industry Name",
  "opportunityScore": 87,
  "topCompetitors": ["Real Company 1", "Real Company 2", "Real Company 3"],
  "customerPainPoints": ["Specific pain point 1", "Specific pain point 2", "Specific pain point 3"],
  "marketGaps": ["Actionable market gap 1", "Actionable market gap 2"],
  "productOpportunities": [
    {
      "name": "Brandable Product Name",
      "description": "Clear value proposition and target buyer",
      "coreFeatures": ["Specific Feature 1", "Specific Feature 2", "Specific Feature 3"]
    }
  ],
  "businessModels": ["Specific revenue model 1", "Specific revenue model 2"]
}`;

  for (const modelId of MODEL_CASCADE) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Pioneer Intelligence",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: modelId,
          temperature: 0.4,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Conduct a venture gap analysis for the industry: ${JSON.stringify(normalizedIndustry)}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as OpenRouterResponse;
        console.warn(`⚠️ Model ${modelId} failed (${response.status}):`, errData.error?.message || "HTTP error");
        continue;
      }

      const data = (await response.json()) as OpenRouterResponse;
      const aiMessage = data.choices?.[0]?.message?.content;

      if (typeof aiMessage !== "string" || !aiMessage.trim()) {
        console.warn(`⚠️ Model ${modelId} returned empty content.`);
        continue;
      }

      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      const parsedRaw: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : aiMessage);
      const sanitized = sanitizeAnalysisReport(parsedRaw, normalizedIndustry);

      if (!sanitized) {
        console.warn(`⚠️ Model ${modelId} returned incomplete JSON structure.`);
        continue;
      }

      return NextResponse.json({
        ...sanitized,
        _meta: {
          source: "live-ai",
          modelUsed: data.model || modelId,
        },
      });
    } catch (error) {
      const code = getErrorCode(error);
      console.warn(`⚠️ Network/Parse error on ${modelId}:`, code ?? error);

      if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ENETUNREACH") {
        break;
      }
    }
  }

  console.warn("⚠️ All live models unavailable — serving sector-aware fallback report.");
  return NextResponse.json(buildAdaptiveFallbackReport(normalizedIndustry));
}