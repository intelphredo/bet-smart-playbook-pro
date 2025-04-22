
import { Sportsbook } from "@/types";
import { SportsbookLogos, BetLinkBuilder } from "@/types/utilities";

export const SPORTSBOOK_LOGOS: SportsbookLogos = {
  "draftkings": "/sportsbooks/draftkings-logo.png",
  "fanduel": "/sportsbooks/fanduel-logo.png",
  "betmgm": "/sportsbooks/betmgm-logo.png",
  "caesars": "/sportsbooks/caesars-logo.png",
  "pointsbet": "/sportsbooks/pointsbet-logo.png",
  "espnbet": "/sportsbooks/espnbet-logo.png",
  "bet365": "/sportsbooks/bet365-logo.png",
  "betrivers": "/sportsbooks/betrivers-logo.png"
};

export const SPORTSBOOKS: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: SPORTSBOOK_LOGOS.draftkings,
    isAvailable: true,
    bonusOffer: "$1,000 No Sweat Bet",
    rating: 4.8
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: SPORTSBOOK_LOGOS.fanduel,
    isAvailable: true,
    bonusOffer: "$1,000 No Sweat First Bet",
    rating: 4.9
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: SPORTSBOOK_LOGOS.betmgm,
    isAvailable: true,
    bonusOffer: "$1,500 First Bet Offer",
    rating: 4.6
  },
  {
    id: "caesars",
    name: "Caesars",
    logo: SPORTSBOOK_LOGOS.caesars,
    isAvailable: true,
    bonusOffer: "$1,000 First Bet on Caesars",
    rating: 4.5
  },
  {
    id: "pointsbet",
    name: "PointsBet",
    logo: SPORTSBOOK_LOGOS.pointsbet,
    isAvailable: true,
    bonusOffer: "2 Risk Free Bets up to $2,000",
    rating: 4.3
  },
  {
    id: "espnbet",
    name: "ESPNBet",
    logo: SPORTSBOOK_LOGOS.espnbet,
    isAvailable: true,
    bonusOffer: "$1,000 First Bet Reset",
    rating: 4.4
  },
  {
    id: "bet365",
    name: "Bet365",
    logo: SPORTSBOOK_LOGOS.bet365,
    isAvailable: false,
    bonusOffer: "Bet $5, Get $150 in Bonus Bets",
    rating: 4.7
  },
  {
    id: "betrivers",
    name: "BetRivers",
    logo: SPORTSBOOK_LOGOS.betrivers,
    isAvailable: false,
    bonusOffer: "2nd Chance Bet up to $500",
    rating: 4.2
  }
];

export const getBetLink: BetLinkBuilder = (sportsbookId, matchId) => {
  // This would be integrated with actual deep linking to the sportsbooks
  // For demo purposes, just returns a placeholder URL
  const baseLinks: {[key: string]: string} = {
    "draftkings": "https://sportsbook.draftkings.com/event/",
    "fanduel": "https://sportsbook.fanduel.com/event/",
    "betmgm": "https://sports.betmgm.com/en/sports/events/",
    "caesars": "https://sportsbook.caesars.com/event/",
    "pointsbet": "https://pointsbet.com/sports/event/",
    "espnbet": "https://espnbet.com/event/",
    "bet365": "https://www.bet365.com/event/",
    "betrivers": "https://betrivers.com/event/"
  };
  
  return baseLinks[sportsbookId] ? `${baseLinks[sportsbookId]}${matchId}` : null;
};
