
import { SPORTSBOOK_LOGOS } from "@/utils/sportsbook";

interface Props {
  match: any;
  formatOdds: (odds: number | undefined) => string;
}

const OddsComparisonTable = ({ match, formatOdds }: Props) => {
  if (!match.liveOdds || match.liveOdds.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2 text-navy-600 dark:text-navy-200">
        Opening Odds vs Live Odds
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded text-xs">
          <thead>
            <tr className="bg-navy-50 dark:bg-navy-700">
              <th className="px-2 py-1 text-left font-normal">Sportsbook</th>
              <th className="px-2 py-1">Home</th>
              {match.odds.draw !== undefined && <th className="px-2 py-1">Draw</th>}
              <th className="px-2 py-1">Away</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 text-muted-foreground font-semibold">Opening</td>
              <td className="px-2 py-1">{formatOdds(match.odds.homeWin)}</td>
              {match.odds.draw !== undefined && (
                <td className="px-2 py-1">{formatOdds(match.odds.draw)}</td>
              )}
              <td className="px-2 py-1">{formatOdds(match.odds.awayWin)}</td>
            </tr>
            {match.liveOdds.map((odd: any) => (
              <tr key={odd.sportsbook.id} className="border-t">
                <td className="px-2 py-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-white dark:bg-gray-800 rounded p-0.5">
                    <img
                      src={odd.sportsbook.logo || SPORTSBOOK_LOGOS[odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS]}
                      alt={odd.sportsbook.name}
                      className="w-full h-full object-contain"
                    />
                  </span>
                  <span>{odd.sportsbook.name}</span>
                </td>
                <td className="px-2 py-1">{formatOdds(odd.homeWin)}</td>
                {odd.draw !== undefined && match.odds.draw !== undefined ? (
                  <td className="px-2 py-1">{formatOdds(odd.draw)}</td>
                ) : (match.odds.draw !== undefined ? <td className="px-2 py-1 text-muted-foreground">-</td> : null)}
                <td className="px-2 py-1">{formatOdds(odd.awayWin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OddsComparisonTable;
