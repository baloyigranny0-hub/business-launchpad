export interface CompliancePack {
  id: string;
  label: string;
  matches: string[];
  focus: string[];
}

export const COMPLIANCE_PACKS: CompliancePack[] = [
  { id: "food-hospitality", label: "Food & hospitality", matches: ["food", "restaurant", "catering", "bakery", "hospitality", "accommodation"], focus: ["food-premises approval", "health inspections", "liquor and entertainment permissions", "fire and occupancy safety"] },
  { id: "beauty-wellness", label: "Beauty & wellness", matches: ["beauty", "salon", "spa", "barber", "wellness", "cosmetic"], focus: ["premises hygiene", "waste and chemical handling", "practitioner qualifications", "customer health records"] },
  { id: "retail-ecommerce", label: "Retail & e-commerce", matches: ["retail", "ecommerce", "e-commerce", "shop", "store"], focus: ["consumer protection", "product labelling", "returns and warranties", "online privacy and payments"] },
  { id: "professional-services", label: "Professional services", matches: ["consult", "account", "legal", "agency", "professional", "advisory"], focus: ["professional-body rules", "engagement letters", "data protection", "professional indemnity"] },
  { id: "construction-trades", label: "Construction & trades", matches: ["construction", "builder", "electrical", "plumbing", "trade", "engineering"], focus: ["contractor registration", "site safety", "trade certifications", "public liability"] },
  { id: "transport-logistics", label: "Transport & logistics", matches: ["transport", "logistics", "courier", "delivery", "freight"], focus: ["operator permits", "vehicle roadworthiness", "driver credentials", "goods-in-transit cover"] },
  { id: "manufacturing", label: "Manufacturing", matches: ["manufactur", "factory", "production"], focus: ["factory approvals", "worker safety", "environmental controls", "product standards"] },
  { id: "agriculture", label: "Agriculture", matches: ["agric", "farm", "livestock", "crop", "agri"], focus: ["land-use permissions", "animal or plant health", "water and environmental permits", "food-chain traceability"] },
  { id: "healthcare", label: "Healthcare", matches: ["health", "clinic", "medical", "pharmacy", "therapy"], focus: ["facility licensing", "practitioner registration", "patient records", "clinical waste"] },
  { id: "education", label: "Education & training", matches: ["education", "school", "training", "tutor", "academy"], focus: ["provider accreditation", "child safeguarding", "qualification standards", "learner records"] },
  { id: "technology", label: "Technology & software", matches: ["technology", "software", "saas", "app", "tech", "digital"], focus: ["data protection", "cybersecurity", "electronic contracting", "software and IP ownership"] },
];

export const CUSTOM_PACK: CompliancePack = {
  id: "custom",
  label: "My specific industry",
  matches: [],
  focus: ["sector regulator", "operating permits", "professional standards", "customer and worker protection"],
};

export function suggestedPack(industry: string) {
  const normalized = industry.toLowerCase();
  return COMPLIANCE_PACKS.find((pack) => pack.matches.some((match) => normalized.includes(match))) ?? CUSTOM_PACK;
}