import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { BacktestResult, BacktestBet } from "@/hooks/useBacktestSimulator";
import { format } from "date-fns";

interface BacktestExportProps {
  result: BacktestResult;
  strategyName: string;
  config: {
    startingBankroll: number;
    stakeType: string;
    stakeAmount: number;
    minConfidence: number;
    days: number;
    league?: string;
  };
}

export function BacktestExport({ result, strategyName, config }: BacktestExportProps) {
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Match',
      'League',
      'Prediction',
      'Confidence',
      'Stake',
      'Odds',
      'Result',
      'Profit/Loss',
      'Bankroll After',
      'Algorithms Agreed',
    ];

    const rows = result.betHistory.map((bet) => [
      bet.date,
      bet.matchTitle.replace(/,/g, ';'), // Escape commas
      bet.league,
      bet.prediction.replace(/,/g, ';'),
      `${bet.confidence}%`,
      `$${bet.stake.toFixed(2)}`,
      bet.odds,
      bet.result,
      bet.profit >= 0 ? `+$${bet.profit.toFixed(2)}` : `-$${Math.abs(bet.profit).toFixed(2)}`,
      `$${bet.bankrollAfter.toFixed(2)}`,
      bet.algorithmsAgreed,
    ]);

    // Add summary at the top
    const summary = [
      ['Backtest Summary'],
      ['Strategy', strategyName],
      ['Date Range', `Last ${config.days} days`],
      ['League', config.league || 'All'],
      ['Starting Bankroll', `$${config.startingBankroll}`],
      ['Stake Type', config.stakeType],
      ['Stake Amount', config.stakeType === 'flat' ? `$${config.stakeAmount}` : `${config.stakeAmount}%`],
      ['Min Confidence', `${config.minConfidence}%`],
      [''],
      ['Results'],
      ['Total Bets', result.totalBets],
      ['Wins', result.wins],
      ['Losses', result.losses],
      ['Win Rate', `${result.winRate.toFixed(1)}%`],
      ['Total Profit/Loss', result.totalProfit >= 0 ? `+$${result.totalProfit.toFixed(2)}` : `-$${Math.abs(result.totalProfit).toFixed(2)}`],
      ['ROI', `${result.roi >= 0 ? '+' : ''}${result.roi.toFixed(1)}%`],
      ['Final Bankroll', `$${result.finalBankroll.toFixed(2)}`],
      ['Max Drawdown', `-$${result.maxDrawdown.toFixed(2)} (${result.maxDrawdownPct.toFixed(1)}%)`],
      ['Best Day', `${result.bestDay.date}: +$${result.bestDay.profit.toFixed(2)}`],
      ['Worst Day', `${result.worstDay.date}: ${result.worstDay.profit >= 0 ? '+' : '-'}$${Math.abs(result.worstDay.profit).toFixed(2)}`],
      ['Longest Win Streak', result.longestWinStreak],
      ['Longest Lose Streak', result.longestLoseStreak],
      [''],
      ['Bet History'],
    ];

    const csvContent = [
      ...summary.map(row => row.join(',')),
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_${strategyName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        strategy: strategyName,
        config: {
          startingBankroll: config.startingBankroll,
          stakeType: config.stakeType,
          stakeAmount: config.stakeAmount,
          minConfidence: config.minConfidence,
          days: config.days,
          league: config.league || 'All',
        },
      },
      summary: {
        totalBets: result.totalBets,
        wins: result.wins,
        losses: result.losses,
        winRate: result.winRate,
        totalProfit: result.totalProfit,
        roi: result.roi,
        finalBankroll: result.finalBankroll,
        maxDrawdown: result.maxDrawdown,
        maxDrawdownPct: result.maxDrawdownPct,
        bestDay: result.bestDay,
        worstDay: result.worstDay,
        longestWinStreak: result.longestWinStreak,
        longestLoseStreak: result.longestLoseStreak,
        avgBetSize: result.avgBetSize,
      },
      profitByDay: result.profitByDay,
      betHistory: result.betHistory,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_${strategyName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
