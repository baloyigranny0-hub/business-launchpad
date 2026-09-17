export interface GovForm {
  id: string;
  org: string;
  label: string;
  purpose: string;
  sections: string[];
}

/** South African government forms founders get stuck on most often. */
export const GOV_FORMS: GovForm[] = [
  {
    id: "sars-itr14",
    org: "SARS eFiling",
    label: "ITR14 — Company income tax return",
    purpose: "Annual income tax return for a registered company.",
    sections: ["Company information", "Dormant / trading declaration", "Financial statements (balance sheet)", "Income statement", "Tax computation", "Provisional tax credits", "Declaration & submit"],
  },
  {
    id: "sars-vat201",
    org: "SARS eFiling",
    label: "VAT201 — VAT return",
    purpose: "Periodic VAT declaration for a VAT-registered vendor.",
    sections: ["Standard rate supplies (Field 1)", "Zero rated supplies (Field 2)", "Exempt & non-supplies (Field 3)", "Capital goods input tax (Field 14)", "Other input tax (Field 15)", "Payable / refundable (Field 20)", "Declaration & payment"],
  },
  {
    id: "sars-rav01",
    org: "SARS eFiling",
    label: "RAV01 — Registration, amendments & verification",
    purpose: "Maintain company details, tax types, bank details and public officer.",
    sections: ["My registered particulars", "Contact details", "Physical & postal address", "Bank account details", "Tax types (Income tax, VAT, PAYE)", "Registered representative / public officer"],
  },
  {
    id: "sars-emp201",
    org: "SARS eFiling",
    label: "EMP201 — Monthly employer declaration",
    purpose: "Monthly PAYE, UIF and SDL declaration and payment reference.",
    sections: ["PAYE", "SDL", "UIF", "ETI (employment tax incentive)", "Payment reference number (PRN)"],
  },
  {
    id: "cipc-cor141",
    org: "CIPC",
    label: "CoR14.1 — Notice of incorporation",
    purpose: "Register a new company with the CIPC.",
    sections: ["Company details & type", "Financial year end", "Registered address", "Directors & incorporators", "Name reservation (CoR9.1)", "Supporting certified IDs"],
  },
  {
    id: "bizportal-reg",
    org: "BizPortal",
    label: "Company registration bundle",
    purpose: "One-stop company registration with SARS, UIF, COIDA add-ons.",
    sections: ["Name choices", "Company type & directors", "Standard MOI options", "B-BBEE affidavit", "SARS income tax registration", "UIF & Compensation Fund add-ons", "Domain & bank account options"],
  },
  {
    id: "labour-ui19",
    org: "Department of Employment & Labour",
    label: "UI-19 — Employer declaration of employees",
    purpose: "Declare employees and terminations for UIF purposes.",
    sections: ["Employer UIF reference", "Employee details", "Remuneration & period employed", "Reason for termination code", "Employer declaration & signature"],
  },
  {
    id: "coida-was8",
    org: "Compensation Fund (COIDA)",
    label: "W.As.8 — Registration of employer",
    purpose: "Register as an employer with the Compensation Fund for injury-on-duty cover.",
    sections: ["Employer particulars", "Nature of business & class", "Number of employees", "Estimated annual earnings", "Commencement date", "Declaration"],
  },
  {
    id: "coida-ros",
    org: "Compensation Fund (COIDA)",
    label: "Return of Earnings (W.As.8 ROE)",
    purpose: "Annual earnings declaration to get a Letter of Good Standing.",
    sections: ["Actual earnings for past year", "Provisional earnings for coming year", "Directors' earnings", "Assessment & payment", "Letter of Good Standing"],
  },
];

export function formById(id: string) {
  return GOV_FORMS.find((f) => f.id === id);
}
