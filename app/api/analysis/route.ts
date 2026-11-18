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
            coreFeatures:
              coreFeatures.length > 0
                ? coreFeatures
                : ["Automated Workflow Engine", "Real-Time Analytics"],
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

// Dynamically classifies ANY industry into operational archetypes & generates tailored intelligence
function buildSmartAdaptiveReport(industry: string): AnalysisReport {
  const clean = industry
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const lower = industry.toLowerCase();

  const hash = lower.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const score = 81 + (hash % 15);

  const archetypes: Array<{
    name: string;
    pattern: RegExp;
    competitors: string[];
    painPoints: (ind: string) => string[];
    gap: (ind: string) => string;
    productPrefix: string;
    productDesc: (ind: string) => string;
    features: string[];
    models: string[];
  }> = [
    {
      name: "Retail & E-Commerce",
      pattern: /(clothing|fashion|boutique|retail|store|apparel|shop|ecommerce|e-commerce|shoes|jewelry|brand|merch)/,
      competitors: ["Shopify", "Square Retail", "Lightspeed POS", "Klaviyo"],
      painPoints: (ind) => [
        `High inventory holding costs and dead stock on slow-moving seasonal ${ind} items`,
        `Margin compression from rising customer acquisition costs (CAC) and marketplace fees`,
        `Disconnected online storefront inventory and physical stock causing fulfillment delays`,
      ],
      gap: (ind) =>
        `Omnichannel demand-forecasting and social-to-cart automation tailored for independent ${ind} operators.`,
      productPrefix: "ShelfSync",
      productDesc: (ind) =>
        `An AI inventory predictor and automated social checkout engine built for independent ${ind} brands to prevent dead stock.`,
      features: ["AI SKU & Demand Forecasting", "Unified Online/In-Store Inventory", "Automated Social DM Checkout"],
      models: ["Tiered Monthly SaaS ($59–$129/month)", "0.5% GMV volume fee"],
    },
    {
      name: "Trades & Field Services",
      pattern: /(electric|plumb|hvac|roof|landscap|construct|clean|repair|contract|auto|mechanic|build|pest|solar)/,
      competitors: ["ServiceTitan", "Jobber", "Housecall Pro", "FieldPulse"],
      painPoints: (ind) => [
        `On-site ${ind} technicians lose billable hours manually writing estimates and chasing invoice approvals`,
        `Missed calls during active jobs cause immediate lead loss to faster-responding competitors`,
        `Enterprise dispatch suites are overly complex and expensive for small 1–15 person crews`,
      ],
      gap: (ind) =>
        `Voice-and-photo-to-estimate mobile co-pilot for ${ind} crews that generates itemized quotes on-site in 30 seconds.`,
      productPrefix: "FieldSnap",
      productDesc: (ind) =>
        `A zero-setup mobile quoting and missed-call capture engine built for independent ${ind} operators.`,
      features: ["Photo & Voice-to-Quote Generator", "Automated Missed-Call SMS Booking", "One-Tap Deposit Collection"],
      models: ["Flat-rate SMB SaaS ($79/month per crew)", "1.5% instant payout fee"],
    },
    {
      name: "Food & Hospitality",
      pattern: /(coffee|cafe|restaurant|bakery|food|bar|cater|pizza|kitchen|hospitality|hotel|brewery|diner)/,
      competitors: ["Toast", "Square for Restaurants", "Lightspeed", "7shifts"],
      painPoints: (ind) => [
        `Unpredictable perishable waste and over-ordering due to disconnected POS and supplier data in ${ind}`,
        `High staff turnover slows down onboarding for recipes, prep standards, and peak-hour workflows`,
        `Third-party delivery apps erode net margins by 15–30% without capturing repeat customer data`,
      ],
      gap: (ind) =>
        `Predictive micro-inventory and prep-forecasting layer synced directly with existing POS systems for ${ind}.`,
      productPrefix: "PantryPulse",
      productDesc: (ind) =>
        `An AI demand-forecasting and automated supplier reordering tool that cuts waste for ${ind} operators.`,
      features: ["POS-Synced Daily Prep Calculator", "Automated Supplier Reorder Alerts", "Direct SMS VIP Loyalty Loop"],
      models: ["Monthly location subscription ($89/location)", "Supplier marketplace rebate share"],
    },
    {
      name: "Health, Wellness & Appointments",
      pattern: /(dental|clinic|gym|fitness|physio|salon|barber|spa|health|vet|wellness|therapy|medical|yoga)/,
      competitors: ["Mindbody", "Jane App", "Fresha", "Vagaro"],
      painPoints: (ind) => [
        `Last-minute appointment cancellations leave high-margin daily ${ind} slots unfilled`,
        `Front-desk staff spend hours on repetitive intake forms, compliance checks, and rebooking calls`,
        `Client drop-off after initial visits due to lack of personalized post-session follow-up`,
      ],
      gap: (ind) =>
        `Autonomous waitlist-backfill and retention agent for ${ind} businesses that fills cancelled slots via SMS within minutes.`,
      productPrefix: "SlotFill",
      productDesc: (ind) =>
        `An automated schedule-recovery and client retention engine built for appointment-driven ${ind} studios.`,
      features: ["Instant Cancellation Waitlist Backfill", "Pre-Visit Digital Intake & Triage", "Automated Rebooking Cadence"],
      models: ["Base SaaS ($69/month) + per-recovered-slot fee", "Multi-practitioner tier pricing"],
    },
    {
      name: "Sports, Clubs & Athletics",
      pattern: /(football|soccer|basketball|rugby|tennis|cricket|sport|coach|league|club|academy|athletic|team|golf|swim)/,
      competitors: ["Hudl", "TeamSnap", "Catapult Sports", "PlayMetrics"],
      painPoints: (ind) => [
        `Grassroots and amateur ${ind} coaches spend hours manually clipping game film and tagging stats`,
        `Fragmented parent/player communication, roster availability, and dues collection across group chats`,
        `Pro-grade GPS and tactical analytics tools are priced far out of reach for local ${ind} clubs`,
      ],
      gap: (ind) =>
        `Smartphone-only computer vision scouting and automated highlight tagging for grassroots ${ind} clubs.`,
      productPrefix: "PitchVision",
      productDesc: (ind) =>
        `A sideline smartphone video analyzer that tracks positioning and clips recruitable highlights for ${ind} teams.`,
      features: ["Automated Smartphone Match Tagging", "Recruiting Highlight Reel Generator", "Unified Roster & Dues Hub"],
      models: ["Annual team license ($299/season)", "Freemium player recruiting upgrades ($15/month)"],
    },
    {
      name: "Education, Tutoring & EdTech",
      pattern: /(school|tutor|edu|course|teach|academy|training|learn|student|university|bootcamp|coaching)/,
      competitors: ["Coursera", "Teachable", "Kajabi", "Canvas LMS"],
      painPoints: (ind) => [
        `High student drop-off rates due to static, one-size-fits-all ${ind} curriculum pacing`,
        `Instructors spend excessive time grading repetitive assignments and answering identical questions`,
        `Difficulty proving measurable skill mastery and ROI to learners or parents`,
      ],
      gap: (ind) =>
        `Adaptive AI study companion that dynamically adjusts ${ind} practice exercises based on real-time error patterns.`,
      productPrefix: "MasteryLoop",
      productDesc: (ind) =>
        `An adaptive learning and automated feedback co-pilot tailored for ${ind} educators and cohort programs.`,
      features: ["Real-Time Knowledge Gap Diagnostics", "Automated Personalized Practice Drills", "Student Progress Analytics"],
      models: ["Per-seat educator SaaS ($39/month)", "Institutional cohort licensing"],
    },
    {
      name: "Real Estate, Property & Architecture",
      pattern: /(real estate|property|realtor|rental|airbnb|architect|interior|mortgage|housing|landlord|broker)/,
      competitors: ["Zillow Premier", "AppFolio", "Buildium", "Matterport"],
      painPoints: (ind) => [
        `Slow lead qualification and manual follow-up cause ${ind} agents to lose high-intent prospects`,
        `Fragmented document collection, inspection scheduling, and compliance checklists slow down closings`,
        `Property owners lack real-time visibility into maintenance costs and market yield benchmarks`,
      ],
      gap: (ind) =>
        `Instant AI buyer/tenant qualification and automated transaction coordinator built for independent ${ind} teams.`,
      productPrefix: "ClosingOS",
      productDesc: (ind) =>
        `An automated lead-to-close workflow assistant that qualifies inquiries and tracks milestones for ${ind} professionals.`,
      features: ["24/7 AI Inquiry Qualification", "Automated Document & Milestone Tracker", "Instant Comp & Yield Estimator"],
      models: ["Monthly agent subscription ($99/month)", "Per-transaction closing fee"],
    },
    {
      name: "Logistics, Supply Chain & Manufacturing",
      pattern: /(logistics|freight|shipping|warehouse|supply|manufactur|delivery|trucking|fleet|wholesale|import)/,
      competitors: ["Flexport", "Samsara", "ShipBob", "Project44"],
      painPoints: (ind) => [
        `Blind spots across multi-carrier shipments and supplier delays create costly ${ind} bottlenecks`,
        `Manual bill-of-lading entry, customs paperwork, and freight quoting rely heavily on error-prone emails`,
        `Small and mid-sized ${ind} operators lack predictive route and inventory optimization`,
      ],
      gap: (ind) =>
        `Zero-integration document parser and exception-alert layer for mid-market ${ind} operators.`,
      productPrefix: "RoutePulse",
      productDesc: (ind) =>
        `An AI shipment tracking and automated freight-document parser built for lean ${ind} operations teams.`,
      features: ["Automated BOL & Invoice OCR Parsing", "Proactive Delay Exception Alerts", "Carrier Rate Benchmarking"],
      models: ["Tiered monthly shipment volume SaaS ($199/month)", "Per-shipment API credit"],
    },
    {
      name: "Creative Agencies, Media & Marketing",
      pattern: /(agency|marketing|design|video|photo|media|content|pr|seo|creative|studio|gaming|esports|music)/,
      competitors: ["Frame.io", "Monday.com", "ClickUp", "Canva Enterprise"],
      painPoints: (ind) => [
        `Endless client revision loops and scope creep erode project profit margins in ${ind}`,
        `Disconnected asset approvals, time tracking, and invoicing create administrative bottlenecks`,
        `Difficulty scaling personalized creative output without linearly hiring more staff`,
      ],
      gap: (ind) =>
        `Client-facing approval portal with automated scope-creep detection and AI asset versioning for ${ind} studios.`,
      productPrefix: "ScopeGuard",
      productDesc: (ind) =>
        `An AI project scoping, client review, and margin-protection platform built for modern ${ind} teams.`,
      features: ["Automated Scope-Creep Alerts", "Timestamped Client Approval Portal", "Real-Time Project Margin Tracker"],
      models: ["Per-seat studio SaaS ($49/user/month)", "White-label client portal add-on"],
    },
    {
      name: "Software, FinTech & B2B Tech",
      pattern: /(saas|software|ai|fintech|crypto|cyber|cloud|data|app|tech|startup|developer|it|consulting)/,
      competitors: ["Linear", "Stripe", "Notion", "HubSpot"],
      painPoints: (ind) => [
        `Long enterprise onboarding cycles and complex configuration delay customer time-to-value in ${ind}`,
        `Rising cloud/AI inference costs squeeze gross margins at scale`,
        `Security compliance (SOC2, GDPR) and procurement reviews stall mid-market B2B deals`,
      ],
      gap: (ind) =>
        `Self-serve onboarding copilot and automated compliance readiness layer for fast-growing ${ind} companies.`,
      productPrefix: "LaunchStack",
      productDesc: (ind) =>
        `An automated customer onboarding and workflow orchestration layer designed for modern ${ind} teams.`,
      features: ["AI-Guided Customer Onboarding Flows", "Automated Security Questionnaire Copilot", "Usage & Margin Telemetry"],
      models: ["Usage-based PLG tier + Enterprise annual plan", "Monthly workspace subscription ($99/month)"],
    },
  ];

  // Match against the 10 archetypes
  const matched = archetypes.find((a) => a.pattern.test(lower));

  if (matched) {
    return {
      industry: clean,
      opportunityScore: score,
      topCompetitors: matched.competitors,
      customerPainPoints: matched.painPoints(lower),
      marketGaps: [matched.gap(lower)],
      productOpportunities: [
        {
          name: `${matched.productPrefix} ${clean} AI`,
          description: matched.productDesc(lower),
          coreFeatures: matched.features,
        },
      ],
      businessModels: matched.models,
      _meta: {
        source: "offline-fallback",
        modelUsed: "smart-archetype-engine",
        archetype: matched.name,
      },
    };
  }

  // Dynamic synthesis for ultra-niche industries (e.g., "Beekeeping", "3D Printing", "Watchmaking")
  const primaryNoun = clean.split(" ").pop() || clean;
  return {
    industry: clean,
    opportunityScore: score,
    topCompetitors: [
      `Shopify (Direct-to-Consumer ${primaryNoun})`,
      `Airtable (Custom ${primaryNoun} Ops)`,
      `Stripe (Billing & Subscriptions)`,
      `Square (Point of Sale)`,
    ],
    customerPainPoints: [
      `Specialized ${lower} operators rely on brittle spreadsheets and manual tracking because mainstream tools ignore niche workflows`,
      `Sourcing specialized supplies, managing custom orders, and quoting accurate lead times remain slow and manual`,
      `High customer education friction makes converting first-time ${lower} buyers expensive`,
    ],
    marketGaps: [
      `Purpose-built vertical operating system for ${lower} businesses that combines custom quoting, inventory/material tracking, and automated client updates.`,
    ],
    productOpportunities: [
      {
        name: `Pioneer ${primaryNoun} OS`,
        description: `An opinionated, AI-assisted workflow and quoting platform tailored specifically to the unique operational rules of ${lower} businesses.`,
        coreFeatures: [
          `Custom ${primaryNoun} Quoting & Spec Builder`,
          "Automated Client Status & Milestone Portal",
          "Supplier & Materials Forecasting Engine",
        ],
      },
    ],
    businessModels: [
      "Vertical SaaS Subscription ($69–$149/month)",
      "Embedded payment & supplier order fee (1.5%)",
    ],
    _meta: {
      source: "offline-fallback",
      modelUsed: "smart-archetype-engine",
      archetype: "Dynamic Niche Synthesis",
    },
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
    console.warn("⚠️ OPENROUTER_API_KEY missing — serving smart adaptive fallback.");
    return NextResponse.json(buildSmartAdaptiveReport(normalizedIndustry));
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

  console.warn("⚠️ All live models unavailable — serving smart adaptive fallback report.");
  return NextResponse.json(buildSmartAdaptiveReport(normalizedIndustry));
}