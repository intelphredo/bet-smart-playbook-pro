
import { PlayerHistoricalData } from "@/types/playerAnalytics";

export const playerHistoricalData: PlayerHistoricalData[] = [
  {
    playerId: "jokic-1",
    playerName: "Nikola Jokic",
    matchups: [
      {
        teamId: "lal-1",
        teamName: "Los Angeles Lakers",
        games: [
          {
            date: "2025-01-15",
            stats: { points: 31, assists: 12, rebounds: 14 },
            result: "W"
          },
          {
            date: "2024-11-20",
            stats: { points: 36, assists: 9, rebounds: 16 },
            result: "W"
          },
          {
            date: "2024-02-25",
            stats: { points: 25, assists: 10, rebounds: 12 },
            result: "L"
          }
        ],
        averagePerformance: {
          points: 30.7,
          assists: 10.3,
          rebounds: 14.0
        },
        struggles: false
      },
      {
        teamId: "bos-1",
        teamName: "Boston Celtics",
        games: [
          {
            date: "2025-01-10",
            stats: { points: 19, assists: 8, rebounds: 12 },
            result: "L"
          },
          {
            date: "2024-12-05",
            stats: { points: 22, assists: 9, rebounds: 11 },
            result: "L"
          },
          {
            date: "2024-03-15",
            stats: { points: 21, assists: 7, rebounds: 9 },
            result: "L"
          }
        ],
        averagePerformance: {
          points: 20.7,
          assists: 8.0,
          rebounds: 10.7
        },
        struggles: true
      }
    ],
    currentStreak: {
      type: "hot",
      length: 5,
      stats: {
        points: {
          average: 29.6,
          trend: "increasing"
        },
        assists: {
          average: 11.2,
          trend: "stable"
        },
        rebounds: {
          average: 14.8,
          trend: "increasing"
        }
      }
    },
    seasonStats: {
      games: 56,
      points: 28.2,
      assists: 9.8,
      rebounds: 13.4
    }
  },
  {
    playerId: "mahomes-1",
    playerName: "Patrick Mahomes",
    matchups: [
      {
        teamId: "cin-1",
        teamName: "Cincinnati Bengals",
        games: [
          {
            date: "2025-01-08",
            stats: { touchdowns: 4, goals: 0 },
            result: "W"
          },
          {
            date: "2024-10-15",
            stats: { touchdowns: 3, goals: 0 },
            result: "W"
          },
          {
            date: "2024-01-20",
            stats: { touchdowns: 2, goals: 0 },
            result: "L"
          }
        ],
        averagePerformance: {
          touchdowns: 3.0
        },
        struggles: false
      },
      {
        teamId: "sf-1",
        teamName: "San Francisco 49ers",
        games: [
          {
            date: "2025-02-11",
            stats: { touchdowns: 1, goals: 0 },
            result: "L"
          },
          {
            date: "2024-09-30",
            stats: { touchdowns: 2, goals: 0 },
            result: "W"
          },
          {
            date: "2023-11-15",
            stats: { touchdowns: 1, goals: 0 },
            result: "L"
          }
        ],
        averagePerformance: {
          touchdowns: 1.3
        },
        struggles: true
      }
    ],
    currentStreak: {
      type: "cold",
      length: 3,
      stats: {
        touchdowns: {
          average: 1.7,
          trend: "decreasing"
        }
      }
    },
    seasonStats: {
      games: 15,
      touchdowns: 2.8
    }
  },
  {
    playerId: "haaland-1",
    playerName: "Erling Haaland",
    matchups: [
      {
        teamId: "ars-1",
        teamName: "Arsenal",
        games: [
          {
            date: "2025-03-01",
            stats: { goals: 0 },
            result: "L"
          },
          {
            date: "2024-12-03",
            stats: { goals: 1 },
            result: "W"
          },
          {
            date: "2024-04-17",
            stats: { goals: 0 },
            result: "L"
          }
        ],
        averagePerformance: {
          goals: 0.33
        },
        struggles: true
      },
      {
        teamId: "liv-1",
        teamName: "Liverpool",
        games: [
          {
            date: "2025-02-14",
            stats: { goals: 2 },
            result: "W"
          },
          {
            date: "2024-10-29",
            stats: { goals: 1 },
            result: "W"
          },
          {
            date: "2024-03-10",
            stats: { goals: 2 },
            result: "W"
          }
        ],
        averagePerformance: {
          goals: 1.67
        },
        struggles: false
      }
    ],
    currentStreak: {
      type: "hot",
      length: 4,
      stats: {
        goals: {
          average: 1.5,
          trend: "stable"
        }
      }
    },
    seasonStats: {
      games: 29,
      goals: 1.1
    }
  }
];
