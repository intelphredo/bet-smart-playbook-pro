import { describe, it, expect } from 'vitest';
import {
  getTeamAbbreviation,
  getTeamNameFromAbbreviation,
  isKnownTeam,
  NBA_TEAMS,
  NFL_TEAMS,
  MLB_TEAMS,
  NHL_TEAMS,
} from '@/config/teamAbbreviations';
import type { League } from '@/types/sports';

describe('getTeamAbbreviation', () => {
  describe('NBA teams', () => {
    it('returns correct abbreviation for full team names', () => {
      expect(getTeamAbbreviation('Los Angeles Lakers', 'NBA')).toBe('LAL');
      expect(getTeamAbbreviation('Boston Celtics', 'NBA')).toBe('BOS');
      expect(getTeamAbbreviation('Golden State Warriors', 'NBA')).toBe('GSW');
      expect(getTeamAbbreviation('Philadelphia 76ers', 'NBA')).toBe('PHI');
    });

    it('returns correct abbreviation for nicknames', () => {
      expect(getTeamAbbreviation('Lakers', 'NBA')).toBe('LAL');
      expect(getTeamAbbreviation('Celtics', 'NBA')).toBe('BOS');
      expect(getTeamAbbreviation('Warriors', 'NBA')).toBe('GSW');
      expect(getTeamAbbreviation('Sixers', 'NBA')).toBe('PHI');
    });

    it('handles LA teams correctly', () => {
      expect(getTeamAbbreviation('LA Lakers', 'NBA')).toBe('LAL');
      expect(getTeamAbbreviation('LA Clippers', 'NBA')).toBe('LAC');
      expect(getTeamAbbreviation('Los Angeles Clippers', 'NBA')).toBe('LAC');
    });

    it('handles case-insensitive matching', () => {
      expect(getTeamAbbreviation('los angeles lakers', 'NBA')).toBe('LAL');
      expect(getTeamAbbreviation('BOSTON CELTICS', 'NBA')).toBe('BOS');
    });
  });

  describe('NFL teams', () => {
    it('returns correct abbreviation for full team names', () => {
      expect(getTeamAbbreviation('New England Patriots', 'NFL')).toBe('NE');
      expect(getTeamAbbreviation('Dallas Cowboys', 'NFL')).toBe('DAL');
      expect(getTeamAbbreviation('Kansas City Chiefs', 'NFL')).toBe('KC');
      expect(getTeamAbbreviation('San Francisco 49ers', 'NFL')).toBe('SF');
    });

    it('returns correct abbreviation for nicknames', () => {
      expect(getTeamAbbreviation('Patriots', 'NFL')).toBe('NE');
      expect(getTeamAbbreviation('Pats', 'NFL')).toBe('NE');
      expect(getTeamAbbreviation('Cowboys', 'NFL')).toBe('DAL');
      expect(getTeamAbbreviation('Niners', 'NFL')).toBe('SF');
    });

    it('handles Green Bay correctly', () => {
      expect(getTeamAbbreviation('Green Bay Packers', 'NFL')).toBe('GB');
      expect(getTeamAbbreviation('Packers', 'NFL')).toBe('GB');
    });
  });

  describe('MLB teams', () => {
    it('returns correct abbreviation for full team names', () => {
      expect(getTeamAbbreviation('New York Yankees', 'MLB')).toBe('NYY');
      expect(getTeamAbbreviation('Boston Red Sox', 'MLB')).toBe('BOS');
      expect(getTeamAbbreviation('Los Angeles Dodgers', 'MLB')).toBe('LAD');
    });

    it('handles Chicago teams correctly', () => {
      expect(getTeamAbbreviation('Chicago Cubs', 'MLB')).toBe('CHC');
      expect(getTeamAbbreviation('Chicago White Sox', 'MLB')).toBe('CWS');
    });

    it('returns correct abbreviation for nicknames', () => {
      expect(getTeamAbbreviation('Yankees', 'MLB')).toBe('NYY');
      expect(getTeamAbbreviation('Red Sox', 'MLB')).toBe('BOS');
      expect(getTeamAbbreviation('Dodgers', 'MLB')).toBe('LAD');
    });
  });

  describe('NHL teams', () => {
    it('returns correct abbreviation for full team names', () => {
      expect(getTeamAbbreviation('Toronto Maple Leafs', 'NHL')).toBe('TOR');
      expect(getTeamAbbreviation('Montreal Canadiens', 'NHL')).toBe('MTL');
      expect(getTeamAbbreviation('Vegas Golden Knights', 'NHL')).toBe('VGK');
    });

    it('returns correct abbreviation for nicknames', () => {
      expect(getTeamAbbreviation('Maple Leafs', 'NHL')).toBe('TOR');
      expect(getTeamAbbreviation('Leafs', 'NHL')).toBe('TOR');
      expect(getTeamAbbreviation('Habs', 'NHL')).toBe('MTL');
    });
  });

  describe('Soccer teams', () => {
    it('returns correct abbreviation for Premier League teams', () => {
      expect(getTeamAbbreviation('Arsenal', 'SOCCER')).toBe('ARS');
      expect(getTeamAbbreviation('Chelsea', 'SOCCER')).toBe('CHE');
      expect(getTeamAbbreviation('Liverpool', 'SOCCER')).toBe('LIV');
    });

    it('handles Manchester teams correctly', () => {
      expect(getTeamAbbreviation('Manchester City', 'SOCCER')).toBe('MCI');
      expect(getTeamAbbreviation('Man City', 'SOCCER')).toBe('MCI');
      expect(getTeamAbbreviation('Manchester United', 'SOCCER')).toBe('MUN');
      expect(getTeamAbbreviation('Man United', 'SOCCER')).toBe('MUN');
    });
  });

  describe('unknown teams', () => {
    it('generates abbreviation for unknown teams', () => {
      const abbr = getTeamAbbreviation('Unknown Team FC', 'NBA');
      expect(abbr).toBe('UTF');
    });

    it('handles single-word unknown teams', () => {
      const abbr = getTeamAbbreviation('Unicorns', 'NBA');
      expect(abbr).toBe('UNI');
    });

    it('handles two-word unknown teams', () => {
      const abbr = getTeamAbbreviation('Mystery Team', 'NBA');
      expect(abbr).toBe('MTE'); // First letter + first two of second
    });

    it('returns ??? for empty input', () => {
      expect(getTeamAbbreviation('', 'NBA')).toBe('???');
    });
  });

  describe('partial matching', () => {
    it('matches partial team names', () => {
      expect(getTeamAbbreviation('LA Lakers', 'NBA')).toBe('LAL');
      expect(getTeamAbbreviation('NY Knicks', 'NBA')).toBe('NYK');
    });
  });
});

describe('getTeamNameFromAbbreviation', () => {
  it('returns full team name for known abbreviations', () => {
    expect(getTeamNameFromAbbreviation('LAL', 'NBA')).toBe('Los Angeles Lakers');
    expect(getTeamNameFromAbbreviation('BOS', 'NBA')).toBe('Boston Celtics');
  });

  it('handles lowercase abbreviations', () => {
    expect(getTeamNameFromAbbreviation('lal', 'NBA')).toBe('Los Angeles Lakers');
  });

  it('returns abbreviation when not found', () => {
    expect(getTeamNameFromAbbreviation('XYZ', 'NBA')).toBe('XYZ');
  });

  it('works across different leagues', () => {
    expect(getTeamNameFromAbbreviation('NE', 'NFL')).toBe('New England Patriots');
    expect(getTeamNameFromAbbreviation('NYY', 'MLB')).toBe('New York Yankees');
    expect(getTeamNameFromAbbreviation('TOR', 'NHL')).toBe('Toronto Maple Leafs');
  });
});

describe('isKnownTeam', () => {
  it('returns true for known teams', () => {
    expect(isKnownTeam('Los Angeles Lakers', 'NBA')).toBe(true);
    expect(isKnownTeam('Lakers', 'NBA')).toBe(true);
    expect(isKnownTeam('Dallas Cowboys', 'NFL')).toBe(true);
  });

  it('returns false for unknown teams', () => {
    expect(isKnownTeam('Fake Team', 'NBA')).toBe(false);
    expect(isKnownTeam('Unknown FC', 'SOCCER')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isKnownTeam('los angeles lakers', 'NBA')).toBe(true);
    expect(isKnownTeam('BOSTON CELTICS', 'NBA')).toBe(true);
  });
});

describe('League team coverage', () => {
  it('has all 30 NBA teams', () => {
    const uniqueAbbreviations = new Set(Object.values(NBA_TEAMS));
    expect(uniqueAbbreviations.size).toBe(30);
  });

  it('has all 32 NFL teams', () => {
    const uniqueAbbreviations = new Set(Object.values(NFL_TEAMS));
    expect(uniqueAbbreviations.size).toBe(32);
  });

  it('has all 30 MLB teams', () => {
    const uniqueAbbreviations = new Set(Object.values(MLB_TEAMS));
    expect(uniqueAbbreviations.size).toBe(30);
  });

  it('has all 32 NHL teams', () => {
    const uniqueAbbreviations = new Set(Object.values(NHL_TEAMS));
    expect(uniqueAbbreviations.size).toBe(32);
  });
});

describe('Edge cases', () => {
  it('handles teams with special characters', () => {
    expect(getTeamAbbreviation("St. Louis Cardinals", 'MLB')).toBe('STL');
    expect(getTeamAbbreviation("St. Louis Blues", 'NHL')).toBe('STL');
  });

  it('handles teams with numbers', () => {
    expect(getTeamAbbreviation('Philadelphia 76ers', 'NBA')).toBe('PHI');
    expect(getTeamAbbreviation('San Francisco 49ers', 'NFL')).toBe('SF');
  });

  it('handles whitespace variations', () => {
    expect(getTeamAbbreviation('  Los Angeles Lakers  ', 'NBA')).toBe('LAL');
    expect(getTeamAbbreviation('Los  Angeles  Lakers', 'NBA')).toBe('LAL');
  });
});
