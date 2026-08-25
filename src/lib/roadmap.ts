import {
  Building2,
  ShieldCheck,
  FileText,
  Sparkles,
  Cog,
  Megaphone,
  TrendingUp,
  Lightbulb,
  ClipboardList,
  LucideIcon,
} from "lucide-react";

export type PhaseId = "concept" | "development" | "commercialisation";

export type StageId =
  | "validation"
  | "compliance"
  | "documents"
  | "branding"
  | "plan"
  | "operations"
  | "marketing"
  | "growth";

export interface Step {
  id: string;
  title: string;
  description: string;
  /** What the AI should draft when the founder taps "Draft this for me". */
  draft?: string;
}

export interface Stage {
  id: StageId;
  phase: PhaseId;
  title: string;
  tagline: string;
  icon: LucideIcon;
  steps: Step[];
}

export interface Phase {
  id: PhaseId;
  title: string;
  subtitle: string;
  accent: string;
}

export const PHASES: Phase[] = [
  { id: "concept", title: "Concept", subtitle: "Prove the problem is worth solving", accent: "accent" },
  { id: "development", title: "Build & Comply", subtitle: "Become a real, credible business", accent: "primary" },
  { id: "commercialisation", title: "Commercialise", subtitle: "Sell, deliver, and grow", accent: "primary" },
];

export const STAGES: Stage[] = [
  {
    id: "validation",
    phase: "concept",
    title: "Idea Validation",
    tagline: "Is the problem worth solving?",
    icon: Lightbulb,
    steps: [
      { id: "problem", title: "Write the problem statement", description: "One paragraph: who hurts, how often, how badly.", draft: "a sharp one-paragraph problem statement" },
      { id: "criteria", title: "Score it against the 6 criteria", description: "Popular, urgent, costly, mandatory, frequent, growing." },
      { id: "customers", title: "Talk to 10 potential customers", description: "Ask about the problem, never pitch the solution.", draft: "a 10-question customer discovery interview script" },
      { id: "canvas", title: "Fill your Lean Canvas", description: "All 9 blocks — problem, segments, UVP, solution, channels, revenue, costs, metrics, advantage." },
      { id: "competitors", title: "Map 5 competitors", description: "What they charge, who they serve, where they're weak.", draft: "a competitor analysis framework with 5 likely competitors in my market" },
    ],
  },
  {
    id: "compliance",
    phase: "development",
    title: "Compliance & Setup",
    tagline: "Make it official",
    icon: ShieldCheck,
    steps: [
      { id: "name", title: "Lock in your business name", description: "Check availability and reserve your name." },
      { id: "register", title: "Register the entity", description: "Choose a structure and register with the national registrar.", draft: "a step-by-step entity registration walkthrough for my country and business type, with the exact registrar, forms, fees and timeline" },
      { id: "tax", title: "Register for tax", description: "Income tax, VAT/GST and payroll registrations if required.", draft: "a tax registration checklist for my country, business type and expected turnover" },
      { id: "municipal", title: "Municipal / local compliance", description: "Zoning, trading licence, health and safety, signage.", draft: "a municipal compliance checklist for my city and industry, including which office to visit and what to bring" },
      { id: "industry", title: "Industry licences & permits", description: "Sector-specific bodies, certifications and standards.", draft: "the industry-specific licences, permits and regulatory bodies that apply to my business" },
      { id: "bank", title: "Open a business bank account", description: "Separate personal and business money from day one." },
    ],
  },
  {
    id: "documents",
    phase: "development",
    title: "Document Builder",
    tagline: "Paperwork, sorted",
    icon: FileText,
    steps: [
      { id: "profile", title: "Company profile", description: "A polished one-pager about your business.", draft: "a complete company profile document" },
      { id: "capability", title: "Capability statement", description: "For B2B clients and tenders.", draft: "a capability statement for tenders and B2B clients" },
      { id: "tos", title: "Terms of service", description: "Customer-facing terms for your offering.", draft: "customer terms of service" },
      { id: "privacy", title: "Privacy policy", description: "How you handle customer data.", draft: "a privacy policy compliant with my country's data protection law" },
      { id: "invoice", title: "Invoice & quote templates", description: "Professional, with tax details.", draft: "an invoice and quotation template with the legally required fields for my country" },
    ],
  },
  {
    id: "branding",
    phase: "development",
    title: "Brand Identity",
    tagline: "Your professional face",
    icon: Sparkles,
    steps: [
      { id: "positioning", title: "Positioning statement", description: "Who you serve, what you solve, why you.", draft: "a positioning statement plus three alternatives" },
      { id: "story", title: "Brand story", description: "Why this business exists, in your voice.", draft: "a brand story of about 200 words" },
      { id: "voice", title: "Brand voice & tone", description: "How your business sounds in writing.", draft: "a brand voice and tone guide with do's, don'ts and example sentences" },
      { id: "logo", title: "Logo & visual direction", description: "Pick a direction, then produce the mark.", draft: "three distinct logo and visual identity directions with colour palettes and font pairings" },
      { id: "social", title: "Handles & bios", description: "Reserve handles and write consistent bios.", draft: "social media bios for LinkedIn, Instagram and a Google Business profile" },
    ],
  },
  {
    id: "plan",
    phase: "development",
    title: "Business Plan",
    tagline: "The document that unlocks money",
    icon: ClipboardList,
    steps: [
      { id: "exec", title: "Executive summary", description: "The one page investors and banks actually read.", draft: "an executive summary for my business plan" },
      { id: "market", title: "Market analysis", description: "Size, trends, and your slice of it.", draft: "a market analysis section with realistic sizing for my market" },
      { id: "model", title: "Business model & pricing", description: "How money comes in and what it costs.", draft: "a business model and pricing section with three pricing options" },
      { id: "financials", title: "12-month financial projection", description: "Revenue, costs, break-even.", draft: "a simple 12-month financial projection table with assumptions" },
      { id: "funding", title: "Funding plan", description: "How much, what for, from where.", draft: "a funding plan naming realistic funding sources in my country" },
    ],
  },
  {
    id: "operations",
    phase: "commercialisation",
    title: "Operations",
    tagline: "Run it like a system",
    icon: Cog,
    steps: [
      { id: "tools", title: "Pick your core tools", description: "Email, calendar, accounting, project management.", draft: "a recommended low-cost tool stack for my business with prices" },
      { id: "sop-sales", title: "SOP: Sales pipeline", description: "How a lead becomes a paying customer.", draft: "a sales pipeline SOP with stages and actions" },
      { id: "sop-delivery", title: "SOP: Service delivery", description: "Standard steps for every order or project.", draft: "a service delivery SOP" },
      { id: "finance", title: "Bookkeeping rhythm", description: "Weekly and monthly money routines.", draft: "a weekly and monthly bookkeeping routine" },
      { id: "weekly", title: "Founder weekly cadence", description: "A repeating week structure.", draft: "a founder weekly operating cadence" },
    ],
  },
  {
    id: "marketing",
    phase: "commercialisation",
    title: "Marketing & Sales",
    tagline: "Get your first customers",
    icon: Megaphone,
    steps: [
      { id: "icp", title: "Define your ideal customer", description: "One sharp ICP beats a wide one.", draft: "a detailed ideal customer profile" },
      { id: "offer", title: "Package your offer", description: "Clear name, scope, price, outcome.", draft: "a packaged offer with name, scope, price and promised outcome" },
      { id: "channels", title: "Pick 2 channels", description: "Go where your customers already are.", draft: "the two best marketing channels for my business and a 30-day plan for each" },
      { id: "outreach", title: "Outreach scripts", description: "Short, human first messages.", draft: "cold outreach messages for email, WhatsApp and LinkedIn" },
      { id: "site", title: "Launch a simple site", description: "One page, one offer, one CTA.", draft: "landing page copy: headline, subhead, three benefits, FAQ and CTA" },
    ],
  },
  {
    id: "growth",
    phase: "commercialisation",
    title: "Growth & Scale",
    tagline: "From traction to scale",
    icon: TrendingUp,
    steps: [
      { id: "metrics", title: "Track the 5 metrics that matter", description: "Revenue, leads, conversion, retention, runway." },
      { id: "delegate", title: "Delegate or automate one task", description: "Reclaim 5+ hours a week.", draft: "a list of tasks I should delegate or automate first, with how" },
      { id: "pricing", title: "Review pricing", description: "Most founders underprice. Test a raise.", draft: "a pricing review with a recommended increase and how to communicate it" },
      { id: "funding", title: "Funding readiness check", description: "Deck, financials, data room basics.", draft: "a funding readiness checklist and pitch deck outline" },
      { id: "partnerships", title: "Build 1 strategic partnership", description: "A partner that brings ongoing leads.", draft: "five partnership targets for my business and an intro message" },
    ],
  },
];

export const PWS_CRITERIA = [
  { key: "popular", label: "Popular", hint: "Does it affect a wide market segment?" },
  { key: "urgent", label: "Urgent", hint: "Must it be solved quickly?" },
  { key: "costly", label: "Costly", hint: "Is it a real financial drain?" },
  { key: "mandatory", label: "Mandatory", hint: "Is solving it a legal requirement?" },
  { key: "frequent", label: "Frequent", hint: "How often does it occur?" },
  { key: "growing", label: "Growing", hint: "Is the problem getting bigger?" },
] as const;

export const CANVAS_BLOCKS = [
  { key: "problem", label: "Problem", hint: "Top 3 real problems you address." },
  { key: "segments", label: "Customer Segments", hint: "Who feels this most acutely?" },
  { key: "uvp", label: "Unique Value Proposition", hint: "Why you, why different?" },
  { key: "solution", label: "Solution", hint: "Your product or process, concisely." },
  { key: "channels", label: "Channels", hint: "How you reach and deliver value." },
  { key: "revenue", label: "Revenue Streams", hint: "How the money comes in." },
  { key: "costs", label: "Cost Structure", hint: "Your key costs." },
  { key: "metrics", label: "Key Metrics", hint: "What proves it's working." },
  { key: "advantage", label: "Unfair Advantage", hint: "What makes you hard to copy." },
] as const;

export const READINESS_BLOCKS = [
  { key: "fit", label: "Problem-Solution Fit" },
  { key: "model", label: "Business Model" },
  { key: "prototype", label: "Prototype" },
  { key: "market", label: "Market Readiness" },
] as const;

export const APP_NAME = "Foundry";
export { Building2 };

export const getStage = (id: string) => STAGES.find((s) => s.id === id);
export const stagesOfPhase = (p: PhaseId) => STAGES.filter((s) => s.phase === p);
