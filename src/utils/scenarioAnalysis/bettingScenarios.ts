
import { BettingScenario } from './types';

export const BETTING_SCENARIOS: BettingScenario[] = [
  // ========================
  // MONEYLINE SCENARIOS
  // ========================
  {
    id: 'heavy-favorite',
    name: 'Heavy Favorites (-300+)',
    shortName: 'Heavy Fav',
    category: 'moneyline',
    riskLevel: 'medium',
    description: 'Betting on teams with odds of -300 or worse (implied probability 75%+)',
    historicalWinRate: 76,
    expectedROI: -2.1,
    variance: 'medium',
    advantages: [
      {
        title: 'High Win Probability',
        description: 'These teams win approximately 75%+ of the time, providing consistent winning outcomes',
        impact: 'high'
      },
      {
        title: 'Psychological Confidence',
        description: 'Betting on clear favorites provides mental comfort and reduces second-guessing',
        impact: 'low'
      },
      {
        title: 'Parlay Foundation',
        description: 'Can serve as anchor legs in parlays when combined with other value plays',
        impact: 'medium'
      },
      {
        title: 'Reduced Research',
        description: 'Clear mismatches require less in-depth analysis for decision making',
        impact: 'low'
      }
    ],
    disadvantages: [
      {
        title: 'Terrible Risk/Reward',
        description: 'Risking $300+ to win $100 means one loss wipes out 3+ wins. This is the #1 killer of recreational bankrolls.',
        severity: 'critical'
      },
      {
        title: 'Sharpest Lines',
        description: 'Sportsbooks price these most accurately. The "juice" is highest here, with minimal value available.',
        severity: 'major'
      },
      {
        title: 'Trap Game Vulnerability',
        description: 'Heavy favorites often overlook opponents, leading to shocking upsets. Books know this and bait public bettors.',
        severity: 'major'
      },
      {
        title: 'Devastating Variance',
        description: 'A single upset can destroy weeks of grinding small wins. Recovery requires multiple consecutive wins.',
        severity: 'critical'
      },
      {
        title: 'Bankroll Drain',
        description: 'Needing to bet large amounts to win small creates unsustainable bankroll pressure',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Your model shows true probability exceeds 80% when market implies 75%',
      'Significant situational edge exists (opponent on B2B, key injuries)',
      'Line has moved toward the favorite (sharp money confirmation)',
      'Part of a calculated parlay with other +EV legs'
    ],
    whenToAvoid: [
      'Chasing losses or trying to "lock in" wins',
      'Without calculated edge confirmation from your model',
      'When line has moved toward underdog (sharp money disagreement)',
      'High-stakes games where favorites face extra pressure',
      'Division/rivalry games where records matter less'
    ],
    recommendedKellyFraction: 0.25,
    maxBankrollPercentage: 3,
    proTips: [
      'The public loves heavy favorites - when you see -350 or worse, ask why the line is so high',
      'Track your heavy favorite ROI separately - most bettors are shocked to see negative returns',
      'Consider live betting instead - if favorites fall behind early, odds improve dramatically',
      'Never bet heavy favorites to "feel good" - this is emotional betting that destroys bankrolls'
    ],
    detectionCriteria: {
      oddsRange: { max: -300 }
    }
  },
  
  {
    id: 'heavy-underdog',
    name: 'Heavy Underdogs (+300+)',
    shortName: 'Heavy Dog',
    category: 'moneyline',
    riskLevel: 'high',
    description: 'Betting on teams with odds of +300 or better (implied probability 25% or less)',
    historicalWinRate: 22,
    expectedROI: 3.5,
    variance: 'extreme',
    advantages: [
      {
        title: 'Asymmetric Returns',
        description: 'Win once and you profit enough to cover 3+ losses. The math favors the patient.',
        impact: 'high'
      },
      {
        title: 'Market Overreaction',
        description: 'Public money floods favorites, creating artificially inflated underdog odds',
        impact: 'high'
      },
      {
        title: 'Low Risk Per Bet',
        description: 'Small wagers can yield significant returns, preserving bankroll for more opportunities',
        impact: 'medium'
      },
      {
        title: 'Sharp Money Follows',
        description: 'Professional bettors often target undervalued underdogs - look for reverse line movement',
        impact: 'high'
      },
      {
        title: 'Upset Frequency',
        description: 'In competitive leagues, 20-25% upset rates are common - variance works for you over time',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Extended Losing Streaks',
        description: 'Expect 5-10+ consecutive losses regularly. Can you handle 2 weeks without a win?',
        severity: 'critical'
      },
      {
        title: 'Psychological Torture',
        description: 'Watching your team lose game after game destroys confidence and leads to abandoning strategy',
        severity: 'major'
      },
      {
        title: 'Poor Timing = Ruin',
        description: 'Starting an underdog strategy during a cold streak can wipe out bankroll before variance evens out',
        severity: 'critical'
      },
      {
        title: 'Requires Large Sample',
        description: 'Need 100+ bets before expected value materializes. Most bettors quit too early.',
        severity: 'major'
      },
      {
        title: 'Game Selection Critical',
        description: 'Not all underdogs are equal - blind underdog betting is a losing strategy',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Your model identifies significant positive expected value (+5% or more)',
      'Reverse line movement indicates sharp money on the underdog',
      'Key situational factors favor upset (rest advantage, travel, motivation)',
      'Public is heavily on the favorite (80%+ of bets)',
      'Underdog has style matchup advantages the market undervalues'
    ],
    whenToAvoid: [
      'Betting blindly on any underdog without analysis',
      'After multiple losses (emotional chasing)',
      'When you cannot afford the variance (inadequate bankroll)',
      'Primetime games where favorites are extra motivated',
      'Playoff/elimination games where experience matters'
    ],
    recommendedKellyFraction: 0.15,
    maxBankrollPercentage: 1.5,
    proTips: [
      'Track ROI by underdog range: +300 to +400 often outperforms +600+',
      'Look for underdogs with strong defenses - they keep games close',
      'Monday/Thursday NFL underdogs historically outperform',
      'Never increase bet size after losses - trust the process or abandon it'
    ],
    detectionCriteria: {
      oddsRange: { min: 300 }
    }
  },

  {
    id: 'small-favorite',
    name: 'Small Favorites (-150 to -200)',
    shortName: 'Small Fav',
    category: 'moneyline',
    riskLevel: 'low',
    description: 'Betting on teams with moderate favorite status',
    historicalWinRate: 62,
    expectedROI: 1.2,
    variance: 'low',
    advantages: [
      {
        title: 'Balanced Risk/Reward',
        description: 'More reasonable returns relative to risk compared to heavy favorites',
        impact: 'high'
      },
      {
        title: 'Market Efficiency Zone',
        description: 'This range often contains the most value as lines are less obvious',
        impact: 'high'
      },
      {
        title: 'Sustainable Betting',
        description: 'Lower variance allows for consistent bankroll growth over time',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Still Negative Juice',
        description: 'You still need 52-54% win rate to break even at these odds',
        severity: 'minor'
      },
      {
        title: 'Competitive Matchups',
        description: 'These games are often close, making outcomes less predictable',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Model shows edge of 3% or more over implied probability',
      'Home team with strong recent form',
      'Clear tactical advantages exist'
    ],
    whenToAvoid: [
      'Road favorites in tough environments',
      'Teams on rest disadvantage',
      'Without confirmed edge'
    ],
    recommendedKellyFraction: 0.35,
    maxBankrollPercentage: 4,
    proTips: [
      'This is often the "sweet spot" for professional bettors',
      'Look for small favorites getting line movement in their direction',
      'Focus on home favorites in this range for slightly better edges'
    ],
    detectionCriteria: {
      oddsRange: { min: -200, max: -150 }
    }
  },

  // ========================
  // SPREAD SCENARIOS
  // ========================
  {
    id: 'large-spread',
    name: 'Large Spreads (7+ Points)',
    shortName: 'Big Spread',
    category: 'spread',
    riskLevel: 'high',
    description: 'Spread bets where one team is favored by 7 or more points',
    historicalWinRate: 50,
    expectedROI: -1.8,
    variance: 'high',
    advantages: [
      {
        title: 'Garbage Time Value',
        description: 'Large favorites often ease up, allowing backdoor covers for underdog bettors',
        impact: 'high'
      },
      {
        title: 'Blowout Protection',
        description: 'When favorites dominate, spreads provide profit opportunity unavailable on moneyline',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Unpredictable Margins',
        description: 'Covering 10+ points requires everything to go right - one garbage time TD changes outcome',
        severity: 'critical'
      },
      {
        title: 'Coach Decisions',
        description: 'Late game decisions (kneel downs, prevent defense) often swing spread outcomes arbitrarily',
        severity: 'major'
      },
      {
        title: 'Public Trap',
        description: 'Large spreads attract public money on favorites, moving lines against value',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Taking underdog getting points (backdoor cover opportunity)',
      'Total suggests blowout potential (high-scoring mismatch)',
      'Historical cover rates favor your side in similar situations'
    ],
    whenToAvoid: [
      'Laying large spreads in conference games',
      'Playoff/primetime games with high motivation',
      'Against teams with nothing to lose'
    ],
    recommendedKellyFraction: 0.2,
    maxBankrollPercentage: 2,
    proTips: [
      'Track cover rates by spread size - tendencies vary significantly',
      'NFL: 7+ point underdogs cover at elevated rates historically',
      'Watch for "look-ahead" spots where favorites may not cover'
    ],
    detectionCriteria: {
      spreadRange: { min: 7 }
    }
  },

  {
    id: 'key-numbers',
    name: 'Key Numbers (3, 7 in NFL)',
    shortName: 'Key #s',
    category: 'spread',
    riskLevel: 'low',
    description: 'Spreads at crucial scoring differentials (3 and 7 in NFL)',
    historicalWinRate: 52,
    expectedROI: 2.8,
    variance: 'low',
    advantages: [
      {
        title: 'Statistical Edge',
        description: 'NFL games end on 3 and 7 point margins more than any other numbers',
        impact: 'high'
      },
      {
        title: 'Push Protection',
        description: 'Being on the right side of key numbers avoids costly pushes',
        impact: 'high'
      },
      {
        title: 'Line Shopping Value',
        description: 'Half-point movements across key numbers are worth significant juice',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Books Know This',
        description: 'Key numbers are priced aggressively - expect -115 or worse',
        severity: 'minor'
      },
      {
        title: 'Limited Opportunities',
        description: 'Not every game lands on key numbers, limiting bet volume',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Can buy through 3 or 7 for reasonable juice (-120 or less)',
      'Line shopping finds better number on key number games',
      'Model confirms edge exists independent of key number value'
    ],
    whenToAvoid: [
      'Paying excessive juice just to get the "magic" number',
      'Without understanding why the number matters for that specific game'
    ],
    recommendedKellyFraction: 0.4,
    maxBankrollPercentage: 5,
    proTips: [
      'In NFL, always line shop on games at 3 or 7',
      'Track outcomes by number - know which side of key numbers historically wins',
      'Buying a half point from 3 to 2.5 is worth about 2% in expected value'
    ],
    detectionCriteria: {
      spreadRange: { min: 2.5, max: 7.5 }
    }
  },

  // ========================
  // PARLAY SCENARIOS
  // ========================
  {
    id: 'parlay-2leg',
    name: 'Two-Leg Parlays',
    shortName: '2-Leg Parlay',
    category: 'parlay',
    riskLevel: 'high',
    description: 'Combining two bets into a single wager with multiplied odds',
    historicalWinRate: 27,
    expectedROI: -8.5,
    variance: 'high',
    advantages: [
      {
        title: 'Amplified Returns',
        description: 'Turn +100 bets into +300 payouts, maximizing winners',
        impact: 'high'
      },
      {
        title: 'Correlated Opportunities',
        description: 'Some books allow correlated parlays that offer genuine edge',
        impact: 'medium'
      },
      {
        title: 'Bankroll Leverage',
        description: 'Small stakes can yield significant profits on winning days',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Mathematical Disadvantage',
        description: 'Parlay payouts are always less than true odds - the house edge compounds',
        severity: 'critical'
      },
      {
        title: 'All-or-Nothing',
        description: 'One leg loses, entire bet loses. No partial credit for being mostly right.',
        severity: 'major'
      },
      {
        title: 'Variance Squared',
        description: 'Already volatile bets become exponentially more volatile',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Both legs have positive expected value independently',
      'Correlation exists between legs (same game, related outcomes)',
      'Using as small percentage of bankroll for entertainment'
    ],
    whenToAvoid: [
      'As primary betting strategy',
      'When chasing losses',
      'Combining random favorites for "safe" parlays'
    ],
    recommendedKellyFraction: 0.1,
    maxBankrollPercentage: 1,
    proTips: [
      'Only parlay +EV bets - parlaying -EV bets guarantees losses',
      'Same-game parlays often have better value than cross-game',
      'Track parlay performance separately - most bettors are shocked'
    ]
  },

  {
    id: 'parlay-3plus',
    name: 'Multi-Leg Parlays (3+ Legs)',
    shortName: '3+ Parlay',
    category: 'parlay',
    riskLevel: 'very-high',
    description: 'Combining three or more bets with exponentially multiplied odds',
    historicalWinRate: 8,
    expectedROI: -22.5,
    variance: 'extreme',
    advantages: [
      {
        title: 'Lottery-Style Payouts',
        description: 'Small bets can return 10x-100x+ for entertainment value',
        impact: 'low'
      },
      {
        title: 'Dream Chasing',
        description: 'Provides excitement and hope - gambling as entertainment',
        impact: 'low'
      }
    ],
    disadvantages: [
      {
        title: 'Near-Guaranteed Losses',
        description: 'Expected ROI of -20% or worse. This is how sportsbooks make money.',
        severity: 'critical'
      },
      {
        title: 'False Confidence',
        description: 'Occasional big wins mask massive long-term losses',
        severity: 'critical'
      },
      {
        title: 'Addictive Pattern',
        description: 'The intermittent reinforcement creates gambling addiction patterns',
        severity: 'critical'
      },
      {
        title: 'Professional Suicide',
        description: 'No professional bettor uses 3+ leg parlays as strategy - this is recreational gambling',
        severity: 'critical'
      }
    ],
    whenToUse: [
      'Entertainment only with money you expect to lose',
      'Never - if your goal is profit'
    ],
    whenToAvoid: [
      'Always - if you want to be a winning bettor',
      'As any meaningful part of your strategy',
      'When you cannot afford to lose the entire stake'
    ],
    recommendedKellyFraction: 0.02,
    maxBankrollPercentage: 0.25,
    proTips: [
      'If you must parlay, treat it as entertainment expense, not investment',
      'The bigger the parlay, the bigger the house edge',
      'That "12-leg parlay winner" you saw? Selection bias - you dont see the millions of losers'
    ]
  },

  // ========================
  // LIVE BETTING SCENARIOS
  // ========================
  {
    id: 'live-betting',
    name: 'Live/In-Game Betting',
    shortName: 'Live',
    category: 'live',
    riskLevel: 'high',
    description: 'Placing bets during an ongoing game with dynamic odds',
    historicalWinRate: 48,
    expectedROI: -5.2,
    variance: 'high',
    advantages: [
      {
        title: 'Information Advantage',
        description: 'See how game is actually playing out before betting - injuries, form, momentum',
        impact: 'high'
      },
      {
        title: 'Odds Overreaction',
        description: 'Markets overreact to early events - early 7-0 deficits create value on favorites',
        impact: 'high'
      },
      {
        title: 'Hedging Opportunities',
        description: 'Hedge pre-game bets in real-time to guarantee profit or minimize losses',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Speed Requirements',
        description: 'Sharp live bettors have algorithms and APIs. You cannot compete manually.',
        severity: 'critical'
      },
      {
        title: 'Emotional Decisions',
        description: 'Fast-paced action leads to impulse betting and poor judgment',
        severity: 'critical'
      },
      {
        title: 'Wider Spreads',
        description: 'Live betting juice is higher - books know they have information advantage',
        severity: 'major'
      },
      {
        title: 'Delayed Information',
        description: 'By the time you see a play, books have already adjusted lines',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Hedging existing positions strategically',
      'When favorite falls behind early for no fundamental reason',
      'You have automated systems with API access',
      'Specific game-state situations you have studied and tracked'
    ],
    whenToAvoid: [
      'Impulse betting on games you are watching',
      'Without pre-defined entry criteria',
      'When drinking or emotionally invested',
      'Trying to "fix" bad pre-game bets'
    ],
    recommendedKellyFraction: 0.15,
    maxBankrollPercentage: 2,
    proTips: [
      'If you live bet, pre-define exact scenarios where you will bet BEFORE the game starts',
      'Favorites down 7+ in first quarter often present best live value',
      'Never chase losses with live bets - this is how bankrolls die'
    ],
    detectionCriteria: {
      isLive: true
    }
  },

  // ========================
  // VALUE/STRATEGIC SCENARIOS
  // ========================
  {
    id: 'positive-ev',
    name: 'Positive Expected Value Bets',
    shortName: '+EV Bet',
    category: 'strategic',
    riskLevel: 'low',
    description: 'Bets where calculated true probability exceeds implied probability',
    historicalWinRate: 54,
    expectedROI: 5.8,
    variance: 'medium',
    advantages: [
      {
        title: 'Mathematical Edge',
        description: 'Long-term guaranteed profit when bet consistently with proper sizing',
        impact: 'high'
      },
      {
        title: 'Professional Foundation',
        description: 'This is THE strategy used by every successful professional bettor',
        impact: 'high'
      },
      {
        title: 'Process Over Outcome',
        description: 'Removes emotion - you are right to bet even if individual bets lose',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Requires Accurate Model',
        description: 'Your probability estimates MUST be accurate. Garbage in = garbage out.',
        severity: 'critical'
      },
      {
        title: 'Edge is Small',
        description: 'Even great bettors only have 2-5% edge. Requires large volume to profit.',
        severity: 'major'
      },
      {
        title: 'Gets You Limited',
        description: 'Consistent +EV betting gets your accounts limited or banned',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Always - this should be your only betting approach',
      'When model shows 3%+ edge over market implied probability',
      'Combined with proper Kelly sizing'
    ],
    whenToAvoid: [
      'When you havent verified your models accuracy',
      'If EV edge is under 2% (transaction costs eat profits)'
    ],
    recommendedKellyFraction: 0.25,
    maxBankrollPercentage: 5,
    proTips: [
      'If you cannot calculate EV, you should not bet',
      'Track every bet and compare actual results to expected - this validates your model',
      'Even +EV betting has losing days/weeks. Trust the math, not the emotions.'
    ],
    detectionCriteria: {
      // This would be detected based on calculated EV
    }
  },

  {
    id: 'closing-line-value',
    name: 'Closing Line Value Plays',
    shortName: 'CLV',
    category: 'strategic',
    riskLevel: 'low',
    description: 'Betting when your odds beat the eventual closing line',
    historicalWinRate: 55,
    expectedROI: 6.2,
    variance: 'low',
    advantages: [
      {
        title: 'Ultimate Validation',
        description: 'Consistently beating closing line is the ONLY reliable predictor of long-term success',
        impact: 'high'
      },
      {
        title: 'Sharp Agreement',
        description: 'Closing line reflects all information. Beating it means you spotted value before sharps.',
        impact: 'high'
      },
      {
        title: 'Luck-Proof Metric',
        description: 'Win/loss has variance. CLV removes variance - its pure skill measurement.',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Requires Early Betting',
        description: 'Must bet when lines open, not when convenient',
        severity: 'minor'
      },
      {
        title: 'Tracking Complexity',
        description: 'Need to record opening and closing lines for every bet',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Focus all betting on achieving positive CLV',
      'Bet early when you identify value before market corrects',
      'Track CLV religiously as your primary performance metric'
    ],
    whenToAvoid: [
      'Betting just before game time (lines are sharpest)',
      'When you cannot track closing lines'
    ],
    recommendedKellyFraction: 0.3,
    maxBankrollPercentage: 5,
    proTips: [
      'CLV > Win Rate as a skill metric. A 45% win rate with +3% CLV beats 55% with -2% CLV long-term.',
      'If your CLV is consistently negative, your edge does not exist',
      'Professional bettors obsess over CLV - you should too'
    ],
    detectionCriteria: {
      // Detected by comparing current odds to projected closing
    }
  },

  {
    id: 'arbitrage',
    name: 'Arbitrage Opportunities',
    shortName: 'Arb',
    category: 'strategic',
    riskLevel: 'very-low',
    description: 'Guaranteed profit by betting all outcomes across different books',
    historicalWinRate: 100,
    expectedROI: 1.5,
    variance: 'low',
    advantages: [
      {
        title: 'Guaranteed Profit',
        description: 'Literally cannot lose when executed correctly',
        impact: 'high'
      },
      {
        title: 'Risk-Free Returns',
        description: '1-3% returns with zero risk beats any savings account',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Account Limiting',
        description: 'Arbing is the fastest way to get limited/banned. Expect it within weeks.',
        severity: 'critical'
      },
      {
        title: 'Small Margins',
        description: '1-2% profit requires large bankroll for meaningful returns',
        severity: 'major'
      },
      {
        title: 'Execution Risk',
        description: 'Lines change fast. One side can be bet before the other is available.',
        severity: 'major'
      },
      {
        title: 'Requires Multiple Accounts',
        description: 'Need accounts at 10+ books with funded bankroll in each',
        severity: 'major'
      }
    ],
    whenToUse: [
      'Fresh accounts with high limits',
      'When arb percentage exceeds 2%',
      'You have automated detection systems'
    ],
    whenToAvoid: [
      'If you value your sportsbook accounts for +EV betting',
      'Without sufficient bankroll across multiple books',
      'Arbs under 1% (not worth the account heat)'
    ],
    recommendedKellyFraction: 1.0,
    maxBankrollPercentage: 100,
    proTips: [
      'Arb for a few months to build bankroll, then pivot to +EV before getting limited',
      'Mix in some recreational-looking bets to disguise arbing',
      'Round bet amounts to look more recreational'
    ]
  },

  // ========================
  // SITUATIONAL SCENARIOS
  // ========================
  {
    id: 'revenge-game',
    name: 'Revenge Games',
    shortName: 'Revenge',
    category: 'situational',
    riskLevel: 'medium',
    description: 'Team facing opponent that recently beat them or former team of key player',
    historicalWinRate: 54,
    expectedROI: 1.2,
    variance: 'medium',
    advantages: [
      {
        title: 'Extra Motivation',
        description: 'Emotional investment can translate to increased effort and focus',
        impact: 'medium'
      },
      {
        title: 'Narrative Value',
        description: 'Media attention creates line movement that may overcorrect',
        impact: 'low'
      }
    ],
    disadvantages: [
      {
        title: 'Already Priced In',
        description: 'Obvious revenge narratives are known by books and priced accordingly',
        severity: 'major'
      },
      {
        title: 'Overrated Factor',
        description: 'Statistical analysis shows revenge games dont outperform expectations significantly',
        severity: 'major'
      },
      {
        title: 'Emotion ≠ Performance',
        description: 'Too much emotion can hurt performance. Anger leads to mistakes.',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Combined with other edges (home advantage, rest advantage)',
      'When narrative is NOT being hyped by media (less priced in)',
      'Star player returns against former team early in contract'
    ],
    whenToAvoid: [
      'As standalone reason to bet',
      'Heavily hyped revenge narratives (Super Bowl rematches, etc.)',
      'When revenge team has other disadvantages'
    ],
    recommendedKellyFraction: 0.2,
    maxBankrollPercentage: 2,
    proTips: [
      'Revenge games against former coaches tend to matter more than former players',
      'The value is in under-hyped revenge spots, not ESPN features',
      'Track your revenge game bets separately to see if the edge is real for you'
    ],
    detectionCriteria: {
      situational: ['revenge', 'former_team', 'rematch']
    }
  },

  {
    id: 'back-to-back',
    name: 'Back-to-Back Games',
    shortName: 'B2B',
    category: 'situational',
    riskLevel: 'medium',
    description: 'Team playing second game in two days (common in NBA)',
    historicalWinRate: 43,
    expectedROI: -3.5,
    variance: 'medium',
    advantages: [
      {
        title: 'Predictable Fatigue',
        description: 'B2B teams statistically underperform, especially on the road',
        impact: 'high'
      },
      {
        title: 'Sharp Money Agreement',
        description: 'B2B fade is a well-documented profitable angle for professionals',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Already Priced',
        description: 'Books adjust lines for B2B - the obvious ones have no value',
        severity: 'major'
      },
      {
        title: 'Load Management Era',
        description: 'Star rest makes outcomes even more unpredictable',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Fading road B2B teams, especially when traveling significant distance',
      'B2B after overtime game (extra fatigue)',
      'B2B spot is less obvious (not heavily discussed)'
    ],
    whenToAvoid: [
      'Home B2B with superior talent',
      'When line has already moved against B2B team significantly'
    ],
    recommendedKellyFraction: 0.25,
    maxBankrollPercentage: 3,
    proTips: [
      'NBA road B2B against well-rested home team is historically profitable',
      'Track B2B performance by team - some teams handle it better',
      'Consider under totals for B2B games (slower pace, less energy)'
    ],
    detectionCriteria: {
      situational: ['back_to_back', 'rest_disadvantage']
    }
  },

  {
    id: 'weather-impact',
    name: 'Weather-Affected Games',
    shortName: 'Weather',
    category: 'situational',
    riskLevel: 'medium',
    description: 'Outdoor games with significant weather factors (wind, rain, cold)',
    historicalWinRate: 51,
    expectedROI: 2.1,
    variance: 'medium',
    advantages: [
      {
        title: 'Affects Scoring',
        description: 'High winds and cold significantly impact passing and kicking games',
        impact: 'high'
      },
      {
        title: 'Totals Edge',
        description: 'Weather impacts are often underpriced in totals markets',
        impact: 'high'
      }
    ],
    disadvantages: [
      {
        title: 'Forecast Uncertainty',
        description: 'Weather can change. Betting based on 3-day forecast is risky.',
        severity: 'major'
      },
      {
        title: 'Books Adjust',
        description: 'Obvious weather games (snow games) are adjusted by books',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'High winds (15+ mph) for under totals',
      'Cold weather playoff games',
      'Dome team playing in extreme outdoor conditions'
    ],
    whenToAvoid: [
      'Rain alone (affects both teams equally, priced in)',
      'When weather is uncertain closer to game time'
    ],
    recommendedKellyFraction: 0.25,
    maxBankrollPercentage: 3,
    proTips: [
      'Wind over 15 mph is the most reliable weather factor - unders hit frequently',
      'Track team performance in cold weather - huge variance by team',
      'Bet close to game time when weather forecast is more certain'
    ],
    detectionCriteria: {
      situational: ['wind', 'rain', 'snow', 'cold', 'extreme_weather']
    }
  },

  // ========================
  // TIMING SCENARIOS
  // ========================
  {
    id: 'early-season',
    name: 'Early Season Betting',
    shortName: 'Early Szn',
    category: 'situational',
    riskLevel: 'high',
    description: 'Betting in first 2-4 weeks of a season',
    historicalWinRate: 48,
    expectedROI: -2.5,
    variance: 'high',
    advantages: [
      {
        title: 'Market Inefficiency',
        description: 'Lines are less sharp - books and bettors both working with limited data',
        impact: 'medium'
      },
      {
        title: 'Roster Knowledge Edge',
        description: 'If you closely follow offseason moves, you may know more than casual market',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Extreme Variance',
        description: 'Small sample + new rosters + unknown chemistry = unpredictable outcomes',
        severity: 'critical'
      },
      {
        title: 'Your Model is Blind',
        description: 'Models trained on last season may not apply to new season',
        severity: 'critical'
      },
      {
        title: 'Overreaction to Preseason',
        description: 'Preseason results mean nothing but influence early lines',
        severity: 'major'
      }
    ],
    whenToUse: [
      'You have genuine informational edge on roster changes',
      'Small bet sizes to calibrate model to new season',
      'Looking for coaching/scheme changes market hasnt adapted to'
    ],
    whenToAvoid: [
      'Standard bet sizing - reduce by 50% minimum',
      'Heavy model reliance on previous season data',
      'Overconfidence in week 1-2 trends'
    ],
    recommendedKellyFraction: 0.1,
    maxBankrollPercentage: 1,
    proTips: [
      'Use early season to gather data, not make money',
      'Wait until week 4+ to bet with confidence',
      'Track how your model performs vs. actual early season results'
    ],
    detectionCriteria: {
      situational: ['early_season', 'week_1', 'week_2', 'opening_week']
    }
  },

  {
    id: 'playoffs',
    name: 'Playoff/Tournament Games',
    shortName: 'Playoffs',
    category: 'situational',
    riskLevel: 'medium',
    description: 'High-stakes elimination or championship games',
    historicalWinRate: 50,
    expectedROI: -1.2,
    variance: 'medium',
    advantages: [
      {
        title: 'Maximum Effort',
        description: 'Regular season rest/tanking disappears - all players fully engaged',
        impact: 'high'
      },
      {
        title: 'Public Money Influx',
        description: 'Casual bettors flood in, potentially creating line value',
        impact: 'medium'
      },
      {
        title: 'Known Matchups',
        description: 'Series adjustments become predictable after game 1-2',
        impact: 'medium'
      }
    ],
    disadvantages: [
      {
        title: 'Sharpest Lines',
        description: 'Books devote maximum attention to playoff games',
        severity: 'major'
      },
      {
        title: 'Veteran Factor',
        description: 'Experience matters more - models miss intangible factors',
        severity: 'minor'
      },
      {
        title: 'Coaching Adjustments',
        description: 'Series allow for adjustments that can flip advantages',
        severity: 'minor'
      }
    ],
    whenToUse: [
      'Home underdogs in elimination games',
      'After game 1 upset reveals market mispricing',
      'Team-specific edges you have tracked all season'
    ],
    whenToAvoid: [
      'Betting based on narrative/momentum alone',
      'Heavy favorite series sweeps (already priced)',
      'Without specific playoff-adjusted model'
    ],
    recommendedKellyFraction: 0.2,
    maxBankrollPercentage: 3,
    proTips: [
      'Playoff unders historically hit at elevated rates',
      'Home teams in elimination games perform above regular season rates',
      'Wait for game 1 before heavy series investment'
    ],
    detectionCriteria: {
      situational: ['playoffs', 'elimination', 'championship', 'finals']
    }
  }
];

export const getScenarioById = (id: string): BettingScenario | undefined => {
  return BETTING_SCENARIOS.find(s => s.id === id);
};

export const getScenariosByCategory = (category: string): BettingScenario[] => {
  return BETTING_SCENARIOS.filter(s => s.category === category);
};

export const getScenariosByRisk = (riskLevel: string): BettingScenario[] => {
  return BETTING_SCENARIOS.filter(s => s.riskLevel === riskLevel);
};

export const getLowRiskScenarios = (): BettingScenario[] => {
  return BETTING_SCENARIOS.filter(s => s.riskLevel === 'very-low' || s.riskLevel === 'low');
};

export const getHighROIScenarios = (): BettingScenario[] => {
  return BETTING_SCENARIOS.filter(s => s.expectedROI > 0).sort((a, b) => b.expectedROI - a.expectedROI);
};
