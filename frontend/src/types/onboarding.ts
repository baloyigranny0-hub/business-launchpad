export type IndustryCategory =
  | 'mining'
  | 'health_beauty'
  | 'food_beverage'
  | 'tech_saas'
  | 'construction'
  | 'retail';

export interface OnboardingData {
  businessName: string;
  industry: IndustryCategory;
  subIndustry: string;
  province: string;
  city: string;
  stage: 'idea' | 'pre_revenue' | 'operating';
  cipcRegistered: boolean;
  cipcNumber?: string;
  taxRegistered: boolean;
  sarsPin?: string;
  bbbeeLevel?: string;
}

export interface ComplianceCheckpoint {
  id: string;
  label: string;
  completed: boolean;
  completedDate?: string;
}

export interface OnboardingProgress {
  userId: string;
  data: OnboardingData;
  checkpoints: ComplianceCheckpoint[];
  currentStep: number;
  completedAt?: string;
}
