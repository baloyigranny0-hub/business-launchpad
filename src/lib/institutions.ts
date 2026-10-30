export interface Institution {
  id: string;
  name: string;
  handles: string;
  url: string;
  forms: string[];
  bring: string[];
  when: string;
}

/**
 * Direct routing to the South African institutions founders must deal with.
 * Foundry prepares the context; the founder always approves and submits themselves.
 */
export const INSTITUTIONS: Institution[] = [
  {
    id: "cipc",
    name: "CIPC — BizPortal",
    handles: "Register your company (private company or close corporation), reserve a name, and update director details.",
    url: "https://bizportal.gov.za",
    forms: ["CoR14.1 — registration notice", "CoR9.1 — name reservation"],
    bring: [
      "Certified copy of your ID",
      "Two proposed company names (in case the first is taken)",
      "Your physical and postal address",
      "Full names, ID numbers and contact details of every director",
    ],
    when: "First — before you trade, invoice or open a business bank account",
  },
  {
    id: "sars",
    name: "SARS eFiling",
    handles: "Register for income tax and get your tax number. VAT registration becomes mandatory once turnover passes R1 million; PAYE applies once you employ staff.",
    url: "https://secure.sarsefiling.co.za",
    forms: ["ITR14 / ITR12 — annual returns", "VAT101 — VAT registration", "EMP101 — PAYE registration"],
    bring: [
      "Company registration number",
      "Existing tax reference number, if you have one",
      "Business address and business bank details",
      "A rough estimate of your yearly turnover",
    ],
    when: "Right after registration — a registered company is a taxpayer from day one",
  },
  {
    id: "uif",
    name: "Department of Employment & Labour — UIF",
    handles: "Register as an employer and declare your workers for unemployment insurance. UI-19 reports worker details; monthly declarations run through uFiling.",
    url: "https://ufiling.labour.gov.za",
    forms: ["UI-8 — employer registration", "UI-19 — worker details declaration"],
    bring: [
      "Company registration number",
      "Each worker's ID number and start date",
      "Your monthly salary totals",
    ],
    when: "As soon as you hire your first worker — even part-time",
  },
  {
    id: "coida",
    name: "COIDA — Compensation Fund",
    handles: "Register as an employer for injury-on-duty cover, then submit your annual Return of Earnings.",
    url: "https://cfonline.labour.gov.za",
    forms: ["W.As.8 — employer registration", "W.As.2 — Return of Earnings"],
    bring: [
      "Company registration number",
      "How many people work for you",
      "Your annual wage bill estimate",
    ],
    when: "When you employ people — register before or shortly after hiring",
  },
  {
    id: "csd",
    name: "Central Supplier Database (CSD)",
    handles: "Get your CSD number so you can tender for government work and contract with large buyers.",
    url: "https://secure.csd.gov.za",
    forms: ["CSD supplier registration"],
    bring: [
      "Company registration documents",
      "SARS tax compliance status",
      "Business bank account details",
      "Proof of business address",
    ],
    when: "If you plan to sell to government or large corporates",
  },
  {
    id: "municipal",
    name: "Your municipality",
    handles: "Business licence, informal/mobile trading permits, zoning, signage and environmental approvals — these differ by city, so Foundry matches them to your municipality in your compliance pack.",
    url: "https://www.gov.za/services/register-business-municipal-business-licence",
    forms: ["Municipal business licence application", "Informal trading / mobile trading permit"],
    bring: [
      "ID and company registration documents",
      "A clear description of exactly what you sell, and where",
      "Premises address or the locations you trade from",
      "Food-handling or health certificates, if your industry needs them",
    ],
    when: "Before trading from premises or in public spaces",
  },
];

export function institutionById(id: string) {
  return INSTITUTIONS.find((i) => i.id === id);
}
