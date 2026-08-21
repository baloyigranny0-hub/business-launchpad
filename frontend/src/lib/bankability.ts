export interface BankabilityScore {
  score: number; // 0 to 100
  tier: 'Low' | 'Medium' | 'High' | 'Bankable';
  status: string[];
  recommendations: string[];
}

export const calculateBankability = (data: {
  hasCIPC: boolean;
  hasSARS: boolean;
  hasBusinessAccount: boolean;
  monthlyRevenue: number;
  hasFinancialRecords: boolean;
  yearsInOperation?: number;
}): BankabilityScore => {
  let score = 0;
  const recommendations: string[] = [];
  const status: string[] = [];

  // CIPC Registration - 20 points
  if (data.hasCIPC) {
    score += 20;
    status.push('✓ CIPC registered');
  } else {
    recommendations.push('Complete CIPC registration for legal business status');
  }

  // SARS Tax Registration - 20 points
  if (data.hasSARS) {
    score += 20;
    status.push('✓ SARS registered');
  } else {
    recommendations.push('Obtain SARS Tax Clearance PIN for tax compliance');
  }

  // Business Account - 20 points
  if (data.hasBusinessAccount) {
    score += 20;
    status.push('✓ Business account linked');
  } else {
    recommendations.push('Link or open a dedicated business account');
  }

  // Monthly Revenue - 20 points
  if (data.monthlyRevenue > 15000) {
    score += 20;
    status.push(`✓ Monthly revenue R${data.monthlyRevenue.toLocaleString()}`);
  } else {
    recommendations.push(
      'Demonstrate consistent 3-month operational cash flow above R15,000'
    );
  }

  // Financial Records - 10 points
  if (data.hasFinancialRecords) {
    score += 10;
    status.push('✓ Financial records maintained');
  } else {
    recommendations.push('Maintain organized financial records and invoices');
  }

  // Years in Operation - 10 points
  if (data.yearsInOperation && data.yearsInOperation >= 1) {
    score += 10;
    status.push(`✓ ${data.yearsInOperation} year(s) in operation`);
  }

  // Determine tier
  let tier: 'Low' | 'Medium' | 'High' | 'Bankable';
  if (score >= 80) {
    tier = 'Bankable';
    status.push('💰 Eligible for SMB funding & credit facilities');
  } else if (score >= 60) {
    tier = 'High';
    status.push('📈 Strong foundation for funding applications');
  } else if (score >= 40) {
    tier = 'Medium';
    status.push('⏳ Work in progress - follow recommendations');
  } else {
    tier = 'Low';
    status.push('🔴 Additional compliance steps required');
  }

  return {
    score: Math.min(score, 100),
    tier,
    status,
    recommendations,
  };
};

export const getBankabilityFeedback = (
  bankabilityScore: BankabilityScore
): string => {
  const { tier, score, recommendations } = bankabilityScore;

  let feedback = '';

  switch (tier) {
    case 'Bankable':
      feedback = `Outstanding! Your business has a strong bankability score of ${score}/100. You're well-positioned to approach financial institutions for funding, credit facilities, and growth capital.`;
      break;
    case 'High':
      feedback = `Great progress! Your bankability score of ${score}/100 shows strong fundamentals. ${recommendations.length > 0 ? 'Address the following to maximize your funding potential:' : 'Continue maintaining your compliance standards.'}`;
      break;
    case 'Medium':
      feedback = `Good foundation. Your bankability score of ${score}/100 indicates you're on the right track. ${recommendations.length > 0 ? 'Complete these steps to improve your financial standing:' : ''}`;
      break;
    case 'Low':
      feedback = `Your current bankability score is ${score}/100. Focus on the recommended compliance steps below to become eligible for formal funding and credit facilities.`;
      break;
  }

  return feedback;
};
