import { Building2, ShieldCheck, FileText, Sparkles, Cog, Megaphone, TrendingUp, LucideIcon } from "lucide-react";

export type StageId = "compliance" | "documents" | "branding" | "operations" | "marketing" | "growth";

export interface Step {
  id: string;
  title: string;
  description: string;
}

export interface Stage {
  id: StageId;
  title: string;
  tagline: string;
  icon: LucideIcon;
  steps: Step[];
}

export const STAGES: Stage[] = [
  {
    id: "compliance",
    title: "Compliance & Setup",
    tagline: "Make it official",
    icon: ShieldCheck,
    steps: [
      { id: "name", title: "Lock in your business name", description: "Check availability and reserve your name." },
      { id: "register", title: "Register the entity", description: "Choose a structure (sole trader, LLC, Pty Ltd) and register." },
      { id: "tax", title: "Apply for tax numbers", description: "Get your tax ID, VAT/GST registration if required." },
      { id: "bank", title: "Open a business bank account", description: "Separate personal and business finances from day one." },
      { id: "licenses", title: "Industry licenses & permits", description: "List and apply for industry-specific permits." },
    ],
  },
  {
    id: "documents",
    title: "Document Builder",
    tagline: "Paperwork, sorted",
    icon: FileText,
    steps: [
      { id: "profile", title: "Company profile", description: "A polished one-pager about your business." },
      { id: "capability", title: "Capability statement", description: "Showcase what you do for B2B clients and tenders." },
      { id: "tos", title: "Terms of service", description: "Customer-facing terms for your offering." },
      { id: "privacy", title: "Privacy policy", description: "Data handling policy for your website and app." },
      { id: "invoice", title: "Invoice template", description: "Professional invoice with your branding and tax details." },
    ],
  },
  {
    id: "branding",
    title: "Brand Identity",
    tagline: "Your professional face",
    icon: Sparkles,
    steps: [
      { id: "positioning", title: "Positioning statement", description: "Who you serve, what you solve, why you." },
      { id: "voice", title: "Brand voice & tone", description: "How your business sounds in writing." },
      { id: "logo", title: "Logo direction", description: "Choose a visual direction and produce a logo." },
      { id: "palette", title: "Color & typography", description: "Lock your palette and font pairings." },
      { id: "social", title: "Social handles & bios", description: "Reserve handles and write consistent bios." },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    tagline: "Run it like a system",
    icon: Cog,
    steps: [
      { id: "tools", title: "Pick your core tools", description: "Email, calendar, accounting, project management." },
      { id: "sop-sales", title: "SOP: Sales pipeline", description: "Document how a lead becomes a paying customer." },
      { id: "sop-delivery", title: "SOP: Service delivery", description: "Standard steps to deliver every order or project." },
      { id: "finance", title: "Bookkeeping rhythm", description: "Weekly and monthly money routines." },
      { id: "weekly", title: "Founder weekly cadence", description: "A repeating week structure for solo or team." },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Sales",
    tagline: "Get your first customers",
    icon: Megaphone,
    steps: [
      { id: "icp", title: "Define your ideal customer", description: "One sharp ICP beats a wide one." },
      { id: "offer", title: "Package your offer", description: "Clear name, scope, price, and outcome." },
      { id: "channels", title: "Pick 2 channels", description: "Don't go everywhere. Pick where your ICP lives." },
      { id: "outreach", title: "Cold outreach script", description: "Draft a short, human first message." },
      { id: "site", title: "Launch a simple site", description: "One landing page with the offer and a CTA." },
    ],
  },
  {
    id: "growth",
    title: "Growth & Scale",
    tagline: "From traction to scale",
    icon: TrendingUp,
    steps: [
      { id: "metrics", title: "Track the 5 metrics that matter", description: "Revenue, leads, conversion, retention, runway." },
      { id: "delegate", title: "Delegate or automate one task", description: "Reclaim 5+ hours a week." },
      { id: "pricing", title: "Review pricing", description: "Most founders underprice. Test a raise." },
      { id: "funding", title: "Funding readiness check", description: "Pitch deck, financials, data room basics." },
      { id: "partnerships", title: "Build 1 strategic partnership", description: "A channel partner that brings ongoing leads." },
    ],
  },
];

export const APP_NAME = "Foundry";
export { Building2 };
