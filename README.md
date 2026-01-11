# BetSmart Playbook Pro

A comprehensive sports betting analytics platform with AI-powered predictions, real-time odds tracking, and professional bankroll management tools.

## Features

### 🎯 Smart Score Predictions
- AI-powered prediction algorithms (ML Power Index, Statistical Edge, Value Pick Finder)
- Confidence ratings with detailed reasoning
- Multi-factor analysis including injuries, weather, and momentum

### 📊 Live Data Integration
- Real-time ESPN scoreboard data (NBA, NFL, MLB, NHL, Soccer, College)
- Live odds from major sportsbooks via The Odds API
- MLB-specific data from MLB Stats API

### 📈 Sharp Line Movements
- Track significant line changes indicating professional betting action
- Steam move detection across spreads, totals, and moneylines
- Historical line movement analysis

### 💰 Arbitrage Detection
- Identify guaranteed profit opportunities across sportsbooks
- Real-time arbitrage percentage calculations
- Multi-way arbitrage support

### 🏥 Injury Impact Analysis
- Position-weighted injury impact scores
- Line adjustment predictions based on player availability
- Integration with Sportradar injury data

### 🎰 Professional Betting Tools
- **Kelly Criterion Calculator**: Optimal bet sizing based on edge
- **CLV Tracking**: Closing Line Value performance metrics
- **Bankroll Management**: Track units, ROI, and betting streaks
- **Bet Slip**: Track and manage your pending bets

### 🌤️ Weather Integration
- Real-time weather data for outdoor venues
- Weather impact scoring for game predictions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── BetSlip/        # Bet slip functionality
│   ├── Bankroll/       # Bankroll management
│   ├── MatchCard/      # Match display components
│   └── ...
├── hooks/              # Custom React hooks
├── pages/              # Route pages
├── services/           # API service layers
├── utils/              # Utility functions
│   ├── predictions/    # Prediction algorithms
│   ├── smartScore/     # Smart Score calculations
│   └── betting/        # Betting utilities
├── types/              # TypeScript definitions
└── data/               # Mock/static data

supabase/
├── functions/          # Edge Functions
│   ├── fetch-odds/     # Odds API integration
│   ├── fetch-weather/  # Weather data
│   ├── grade-bets/     # Bet grading
│   └── ...
└── migrations/         # Database migrations
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with live matches and predictions |
| `/algorithms` | Algorithm performance comparison |
| `/bankroll` | Bankroll management dashboard |
| `/bet-history` | Historical bet tracking |
| `/standings` | League standings |
| `/injuries` | Injury reports and impact analysis |
| `/settings` | User preferences |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `fetch-odds` | Retrieve live odds from The Odds API |
| `fetch-weather` | Get weather data for venues |
| `fetch-sportradar` | Sportradar data integration |
| `record-odds` | Store historical odds snapshots |
| `detect-line-movements` | Identify significant line changes |
| `capture-closing-odds` | Record closing lines for CLV |
| `grade-bets` | Automatically grade settled bets |

## Database Tables

- `user_bets` - User bet tracking with CLV metrics
- `user_betting_stats` - Aggregated betting statistics
- `odds_history` - Historical odds snapshots
- `line_movement_tracking` - Sharp line movement records
- `algorithm_predictions` - Algorithm prediction history
- `weather_cache` - Cached weather data
- `venue_coordinates` - Stadium location data

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Environment Variables

The following are automatically configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE for details
