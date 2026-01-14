/**
 * Test data fixtures for E2E tests
 */

export const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

export const testBet = {
  stake: 100,
  matchTitle: 'Test Match',
  selection: 'Home Team',
  odds: -110,
};

export const leagues = [
  'NFL',
  'NBA',
  'NHL',
  'MLB',
  'NCAAF',
  'NCAAB',
  'Soccer',
] as const;

export const betTypes = [
  'moneyline',
  'spread',
  'total',
] as const;

export const oddsFormats = [
  'american',
  'decimal',
  'fractional',
] as const;
