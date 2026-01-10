
import { BankrollScenario } from "@/types/bankroll";

export const BANKROLL_SCENARIOS: BankrollScenario[] = [
  {
    id: 'conservative-grinder',
    name: 'Conservative Grinder',
    description: 'Slow and steady approach focusing on capital preservation. Ideal for beginners or after significant losses.',
    riskLevel: 'very-low',
    unitSizePercent: 1,
    kellyFraction: 0.15,
    evThreshold: 5,
    expectedMonthlyGrowth: 3,
    maxDrawdownTolerance: 10,
    winRateRequired: 52,
    advantages: [
      'Minimal risk of ruin (<1%)',
      'Sustainable long-term growth',
      'Lower emotional stress',
      'Survives extended losing streaks'
    ],
    disadvantages: [
      'Slow bankroll growth',
      'May miss +EV opportunities',
      'Requires patience',
      'Lower profit potential'
    ],
    whenToUse: [
      'Starting with limited bankroll',
      'After 15%+ drawdown',
      'Learning new betting strategies',
      'During volatile market conditions'
    ],
    whenToSwitch: [
      'Bankroll grows 50%+',
      'Consistent 55%+ win rate over 200 bets',
      'Developed strong edge identification'
    ]
  },
  {
    id: 'balanced-approach',
    name: 'Balanced Approach',
    description: 'Moderate risk-reward balance suitable for experienced bettors with proven edge.',
    riskLevel: 'medium',
    unitSizePercent: 2,
    kellyFraction: 0.25,
    evThreshold: 3,
    expectedMonthlyGrowth: 8,
    maxDrawdownTolerance: 20,
    winRateRequired: 53,
    advantages: [
      'Good growth potential',
      'Manageable drawdowns',
      'Captures more opportunities',
      'Balanced risk-reward'
    ],
    disadvantages: [
      'Requires proven track record',
      'Can feel slow during losing streaks',
      'Needs discipline to maintain'
    ],
    whenToUse: [
      'Have 6+ months betting experience',
      'Consistent 53%+ win rate',
      'Comfortable with 20% drawdowns',
      'Mid-sized bankroll ($1k-$10k)'
    ],
    whenToSwitch: [
      'Win rate drops below 52% over 100 bets',
      'Drawdown exceeds 25%',
      'Ready to scale up with larger edge'
    ]
  },
  {
    id: 'aggressive-growth',
    name: 'Aggressive Growth',
    description: 'High-risk approach for experienced bettors with strong edge and risk tolerance.',
    riskLevel: 'high',
    unitSizePercent: 3,
    kellyFraction: 0.4,
    evThreshold: 2,
    expectedMonthlyGrowth: 15,
    maxDrawdownTolerance: 35,
    winRateRequired: 55,
    advantages: [
      'Rapid bankroll growth',
      'Maximizes proven edge',
      'Compounds gains quickly',
      'Higher profit potential'
    ],
    disadvantages: [
      'Higher variance',
      'Larger drawdowns expected',
      'Emotionally challenging',
      'Requires strong discipline'
    ],
    whenToUse: [
      'Proven 55%+ win rate over 500+ bets',
      'Can handle 30%+ drawdowns emotionally',
      'Strong bankroll ($10k+)',
      'Clear edge identification system'
    ],
    whenToSwitch: [
      'Drawdown hits 35%',
      'Win rate drops below 54%',
      'Emotional decision-making increases'
    ]
  },
  {
    id: 'bankroll-recovery',
    name: 'Bankroll Recovery',
    description: 'Strategic approach for recovering from significant losses while minimizing further risk.',
    riskLevel: 'low',
    unitSizePercent: 0.5,
    kellyFraction: 0.1,
    evThreshold: 7,
    expectedMonthlyGrowth: 2,
    maxDrawdownTolerance: 5,
    winRateRequired: 55,
    advantages: [
      'Prevents further losses',
      'Rebuilds confidence',
      'Focuses on best opportunities only',
      'Reduces tilt decisions'
    ],
    disadvantages: [
      'Very slow recovery',
      'Limited betting action',
      'May miss good opportunities',
      'Tests patience'
    ],
    whenToUse: [
      'After 30%+ drawdown',
      'Experiencing tilt or emotional betting',
      'Questioning your edge',
      'Need to rebuild confidence'
    ],
    whenToSwitch: [
      'Bankroll recovers 20%+',
      'Win rate stabilizes above 54%',
      'Emotional control restored'
    ]
  },
  {
    id: 'compounding-master',
    name: 'Compounding Master',
    description: 'Dynamic approach that adjusts unit size as bankroll grows, maximizing compound growth.',
    riskLevel: 'medium',
    unitSizePercent: 2.5,
    kellyFraction: 0.3,
    evThreshold: 3,
    expectedMonthlyGrowth: 12,
    maxDrawdownTolerance: 25,
    winRateRequired: 54,
    advantages: [
      'Optimal compound growth',
      'Scales with success',
      'Protects during drawdowns',
      'Maximizes long-term returns'
    ],
    disadvantages: [
      'Requires frequent recalculation',
      'Can be complex to manage',
      'Drawdowns affect unit size'
    ],
    whenToUse: [
      'Steady 54%+ win rate',
      'Understand Kelly Criterion well',
      'Bankroll growing consistently',
      'Can track and adjust frequently'
    ],
    whenToSwitch: [
      'Drawdown exceeds 20%',
      'Unable to maintain calculations',
      'Win rate becomes inconsistent'
    ]
  },
  {
    id: 'value-hunter',
    name: 'Value Hunter',
    description: 'Selective approach focusing only on high-value opportunities with significant edge.',
    riskLevel: 'medium',
    unitSizePercent: 3,
    kellyFraction: 0.35,
    evThreshold: 8,
    expectedMonthlyGrowth: 10,
    maxDrawdownTolerance: 20,
    winRateRequired: 56,
    advantages: [
      'Highest quality bets only',
      'Strong expected returns per bet',
      'Lower volume, higher edge',
      'Reduced variance per bet'
    ],
    disadvantages: [
      'Fewer betting opportunities',
      'Requires patience',
      'May miss moderate +EV bets',
      'Income less predictable'
    ],
    whenToUse: [
      'Strong edge identification skills',
      'Limited time for betting',
      'Prefer quality over quantity',
      'Comfortable with fewer bets'
    ],
    whenToSwitch: [
      'Missing too many good opportunities',
      'Bankroll stagnating',
      'Ready to increase volume'
    ]
  }
];

export function getScenarioById(id: string): BankrollScenario | undefined {
  return BANKROLL_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByRisk(risk: string): BankrollScenario[] {
  return BANKROLL_SCENARIOS.filter(s => s.riskLevel === risk);
}

export function getRecommendedScenario(
  currentDrawdown: number,
  winRate: number,
  experience: 'beginner' | 'intermediate' | 'advanced'
): BankrollScenario {
  // After significant drawdown
  if (currentDrawdown > 0.25) {
    return BANKROLL_SCENARIOS.find(s => s.id === 'bankroll-recovery')!;
  }
  
  // Based on experience and win rate
  if (experience === 'beginner' || winRate < 0.52) {
    return BANKROLL_SCENARIOS.find(s => s.id === 'conservative-grinder')!;
  }
  
  if (experience === 'intermediate' && winRate >= 0.53 && winRate < 0.55) {
    return BANKROLL_SCENARIOS.find(s => s.id === 'balanced-approach')!;
  }
  
  if (experience === 'advanced' && winRate >= 0.55) {
    return BANKROLL_SCENARIOS.find(s => s.id === 'aggressive-growth')!;
  }
  
  return BANKROLL_SCENARIOS.find(s => s.id === 'balanced-approach')!;
}
