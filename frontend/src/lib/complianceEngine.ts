export interface ComplianceStep {
  id: string;
  tier: 1 | 2;
  title: string;
  department: string;
  description: string;
  automatedServiceAvailable: boolean;
  actionEndpoint?: string;
  requiredDocuments: string[];
}

export const getIndustryCompliance = (
  industry: string,
  province: string
): ComplianceStep[] => {
  // Tier 1: Ground Foundation (Mandatory for all SA Businesses)
  const foundationSteps: ComplianceStep[] = [
    {
      id: 'cipc-reg',
      tier: 1,
      title: 'Company Name & CIPC Registration',
      department: 'CIPC (Companies & Intellectual Property Commission)',
      description:
        'Reserve business name and issue CoR14.3 registration certificate.',
      automatedServiceAvailable: true,
      actionEndpoint: '/api/cipc/register',
      requiredDocuments: ['ID Document', 'Proof of Address'],
    },
    {
      id: 'sars-tax',
      tier: 1,
      title: 'SARS Tax Clearance & eFiling Registration',
      department: 'SARS (South African Revenue Service)',
      description: 'Obtain Income Tax registration and TCS PIN.',
      automatedServiceAvailable: true,
      actionEndpoint: '/api/sars/verify',
      requiredDocuments: ['CIPC Certificate', 'Bank Statement'],
    },
    {
      id: 'bbbee-affidavit',
      tier: 1,
      title: 'B-BBEE EME Level 1/2 Affidavit Generation',
      department: 'DTI (Department of Trade, Industry and Competition)',
      description: 'Auto-generate sworn affidavit for turnover under R10m.',
      automatedServiceAvailable: true,
      actionEndpoint: '/api/documents/bbbee-generate',
      requiredDocuments: ['ID Document'],
    },
  ];

  // Tier 2: Industry Specific Regulations
  const tier2Map: Record<string, ComplianceStep[]> = {
    food_beverage: [
      {
        id: 'health-permit',
        tier: 2,
        title: 'Certificate of Acceptability for Food Handling',
        department: `${province} Municipal Health Services`,
        description:
          'Inspection and licensing by local Environmental Health Practitioner (EHP).',
        automatedServiceAvailable: false,
        requiredDocuments: ['Floor Plan', 'Pest Control Agreement'],
      },
    ],
    mining: [
      {
        id: 'dmre-permit',
        tier: 2,
        title: 'Mining Permit / Environmental Authorisation',
        department: 'DMRE (Dept of Mineral Resources and Energy)',
        description:
          'Submit NEMA Environmental Impact Assessment & Social and Labour Plan.',
        automatedServiceAvailable: false,
        requiredDocuments: [
          'Environmental Impact Report',
          'Water Use License',
        ],
      },
    ],
    construction: [
      {
        id: 'cidb-registration',
        tier: 2,
        title: 'CIDB Contractor Registration',
        department: 'CIDB (Construction Industry Development Board)',
        description: 'Register as Grade 1-9 contractor based on turnover.',
        automatedServiceAvailable: true,
        actionEndpoint: '/api/cidb/register',
        requiredDocuments: ['CIPC Certificate', 'Financial Statements'],
      },
    ],
    tech_saas: [
      {
        id: 'data-protection',
        tier: 2,
        title: 'POPIA Compliance Registration',
        department: 'POPIA (Protection of Personal Information Act)',
        description:
          'Register as Information Officer and implement privacy policies.',
        automatedServiceAvailable: true,
        actionEndpoint: '/api/compliance/popia-register',
        requiredDocuments: ['Privacy Policy', 'Data Processing Agreement'],
      },
    ],
    health_beauty: [
      {
        id: 'health-registration',
        tier: 2,
        title: 'Health Facility License & Permits',
        department: `${province} Department of Health`,
        description: 'Registration with provincial health department.',
        automatedServiceAvailable: false,
        requiredDocuments: ['Floor Plan', 'Equipment List', 'Staff Qualifications'],
      },
    ],
    retail: [
      {
        id: 'business-license',
        tier: 2,
        title: 'Business License & Trading Permit',
        department: `${province} Municipal Services`,
        description: 'Municipal business license and trading permit.',
        automatedServiceAvailable: false,
        requiredDocuments: ['CIPC Certificate', 'Lease Agreement'],
      },
    ],
  };

  return [...foundationSteps, ...(tier2Map[industry] || [])];
};

export const getComplianceStatus = (
  completedSteps: string[],
  industry: string,
  province: string
): { completed: number; total: number; percentage: number } => {
  const allSteps = getIndustryCompliance(industry, province);
  const completed = allSteps.filter((step) =>
    completedSteps.includes(step.id)
  ).length;

  return {
    completed,
    total: allSteps.length,
    percentage: Math.round((completed / allSteps.length) * 100),
  };
};
