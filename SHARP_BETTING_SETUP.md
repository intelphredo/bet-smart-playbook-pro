# Sharp Betting Features Setup Guide

## Overview
This app now includes professional quantitative betting features including:
- **Kelly Criterion** for optimal stake sizing
- **Expected Value (EV)** calculation for identifying profitable bets
- **Closing Line Value (CLV)** tracking to measure prediction accuracy
- **Bankroll Management** system for tracking performance

## Database Setup

### Step 1: Run the Migration

You need to run the database migration to create the necessary tables. Follow these steps:

1. **Open the Database Migration Tool**:
   - Go to your Lovable Cloud dashboard
   - Navigate to the "Database" tab
   - Click on "Migrations"

2. **Create a New Migration**:
   - Click "New Migration"
   - Copy the contents from `supabase/migrations/20250121_sharp_betting_features.sql`
   - Paste it into the migration editor
   - Give it a name like "sharp_betting_features"
   - Click "Run Migration"

3. **Verify the Migration**:
   After running, you should see these new tables:
   - `closing_line_values` - Tracks CLV for each prediction
   - `kelly_calculations` - Stores Kelly Criterion calculations
   - `bankroll_history` - Complete history of bankroll changes
   - `user_bankroll_settings` - User-specific bankroll settings
   - `odds_movements` - Line movement tracking
   - `algorithm_performance_metrics` - Performance tracking

### Step 2: Initialize Your Bankroll

Once the migration is complete, you can initialize your bankroll settings:

1. **Sign up or log in** to your account
2. Your bankroll will be **automatically initialized** with default values:
   - Starting bankroll: $1,000
   - Unit size: $10 (1% of bankroll)
   - Kelly fraction: 0.25 (1/4 Kelly for safety)
   - Min EV threshold: 3% (only bet when EV > 3%)
   - Max bet percentage: 5% (cap bets at 5% of bankroll)
   - Risk tolerance: Conservative

3. **Customize your settings** (optional):
   - You can update these values based on your risk tolerance
   - Recommended ranges:
     - **Conservative**: Kelly 0.25, Max bet 3%
     - **Moderate**: Kelly 0.33, Max bet 5%
     - **Aggressive**: Kelly 0.50, Max bet 7%

## Features Explained

### 1. Expected Value (EV)
Shows how much you expect to profit (or lose) per dollar wagered, expressed as a percentage.

- **Positive EV (>0%)**: Profitable bet in the long run
- **3-5% EV**: Good bet, worth placing
- **>5% EV**: Excellent bet, strong edge
- **Negative EV (<0%)**: Skip this bet

**Example**: +4.5% EV means you expect to profit $4.50 for every $100 wagered over the long term.

### 2. Kelly Criterion Stake
Recommends the optimal bet size to maximize long-term bankroll growth while managing risk.

- Uses **1/4 Kelly** by default (conservative)
- Expressed in **units** (1 unit = your configured unit size)
- Automatically caps at max bet percentage for safety

**Example**: "2.5 units" means bet 2.5× your unit size (if unit = $10, bet $25)

### 3. Closing Line Value (CLV)
Measures how your prediction compares to the sharp closing line. **This is THE most important metric.**

- **Positive CLV**: You beat the closing line (good!)
- **>2% CLV**: Consistently beating by this much = you have an edge
- **>5% CLV**: Excellent, very sharp prediction
- **Negative CLV**: Your prediction was worse than the market

**Why it matters**: If you consistently beat the closing line, you WILL be profitable long-term, even if you have losing streaks.

### 4. Win Probability
Your model's true probability of the outcome occurring (0-100%).

- Derived from confidence score
- Used to calculate fair odds
- More accurate than just confidence level

**Example**: 65% win probability means your model thinks this bet wins 65 times out of 100.

## Using the Metrics

### Quick Decision Guide

**Should I bet?**
1. ✅ EV > 3%
2. ✅ CLV > 0% (preferably >2%)
3. ✅ Kelly stake > 0 units

**How much should I bet?**
- Follow the Kelly Criterion recommendation
- Never exceed your max bet percentage
- When in doubt, bet smaller

**Which bets are best?**
Sort by:
1. Highest EV first
2. Positive CLV second
3. Higher Kelly stake third

## Professional Betting Workflow

### Daily Routine
1. **Morning**: Review upcoming games, identify +EV opportunities
2. **Pre-game**: Check for line movements, compare to your predictions
3. **Place bets**: Follow Kelly recommendations, track all bets
4. **Post-game**: Review results, update CLV calculations
5. **Weekly**: Review algorithm performance, adjust if needed

### Key Metrics to Track
- **CLV %**: Are you beating the closing line consistently?
- **ROI**: Return on investment over time
- **Win Rate**: Should match your model's predicted probabilities
- **Sharpe Ratio**: Risk-adjusted returns (>1.5 is excellent)
- **Max Drawdown**: Largest losing streak (can you survive it?)

## Important Guidelines

### The Professional Mindset
1. **Think long-term**: One bet doesn't matter, 1000 bets do
2. **Embrace variance**: Losing streaks will happen, don't chase losses
3. **Follow the math**: Trust Kelly, even when it feels uncomfortable
4. **Track everything**: Data is your edge
5. **Stay disciplined**: Never deviate from your staking plan

### Risk Management
- Never bet more than Kelly recommends
- Set daily/weekly loss limits
- Keep 50-100 units in bankroll for cushion
- Adjust unit size as bankroll grows (if auto-compound enabled)

### Common Mistakes to Avoid
❌ Chasing losses by increasing bet sizes
❌ Ignoring EV and betting on "gut feelings"
❌ Over-betting (using full Kelly instead of fractional)
❌ Not tracking performance metrics
❌ Focusing on win rate instead of CLV and ROI

## Next Steps

After setup, you should:
1. ✅ Run the database migration
2. ✅ Initialize your bankroll settings
3. ✅ Start placing bets using the metrics
4. ✅ Track your performance over time
5. ✅ Adjust settings based on results

## Advanced Features (Coming Soon)
- Backtesting framework
- Monte Carlo simulations
- Real-time odds movement tracking
- Automated bet placement
- Performance dashboards

## Resources

### Recommended Reading
- "Fortune's Formula" by William Poundstone
- "Trading Bases" by Joe Peta
- "Sharp Sports Betting" by Stanford Wong

### Key Concepts
- **Kelly Criterion**: Optimal bet sizing formula
- **Expected Value**: Average profit per bet
- **Closing Line Value**: Measuring prediction accuracy
- **Sharpe Ratio**: Risk-adjusted performance metric

## Support

If you have questions or need help:
1. Check the tooltips in the app for metric explanations
2. Review this guide for best practices
3. Monitor your performance metrics regularly

**Remember**: Professional sports betting is a marathon, not a sprint. Focus on process, not results. If you consistently make +EV bets and beat the closing line, profits will follow over time.
