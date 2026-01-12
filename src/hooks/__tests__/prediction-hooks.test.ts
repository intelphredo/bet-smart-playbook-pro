// Unit tests for prediction hooks logic
// These tests verify core logic without external dependencies

// ============================================
// Status Normalization Tests
// ============================================

function normalizeStatus(status: string | null): 'pending' | 'win' | 'loss' {
  if (status === 'won' || status === 'win') return 'win';
  if (status === 'lost' || status === 'loss') return 'loss';
  return 'pending';
}

function toDbStatus(status: 'pending' | 'win' | 'loss'): string {
  if (status === 'win') return 'won';
  if (status === 'loss') return 'lost';
  return 'pending';
}

// Simple test runner
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${(e as Error).message}`);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be < ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} to be <= ${expected}`);
      }
    },
  };
}

// ============================================
// Run Tests
// ============================================

export function runPredictionHookTests() {
  console.log('\n🧪 Running Prediction Hook Tests...\n');
  console.log('--- Status Normalization ---');

  test('normalizes "won" to "win"', () => {
    expect(normalizeStatus('won')).toBe('win');
  });

  test('normalizes "lost" to "loss"', () => {
    expect(normalizeStatus('lost')).toBe('loss');
  });

  test('normalizes "win" to "win"', () => {
    expect(normalizeStatus('win')).toBe('win');
  });

  test('normalizes "loss" to "loss"', () => {
    expect(normalizeStatus('loss')).toBe('loss');
  });

  test('normalizes null to "pending"', () => {
    expect(normalizeStatus(null)).toBe('pending');
  });

  test('normalizes unknown values to "pending"', () => {
    expect(normalizeStatus('unknown')).toBe('pending');
    expect(normalizeStatus('')).toBe('pending');
  });

  console.log('\n--- DB Status Conversion ---');

  test('converts "win" to "won"', () => {
    expect(toDbStatus('win')).toBe('won');
  });

  test('converts "loss" to "lost"', () => {
    expect(toDbStatus('loss')).toBe('lost');
  });

  test('keeps "pending" as "pending"', () => {
    expect(toDbStatus('pending')).toBe('pending');
  });

  console.log('\n--- Accuracy Calculation ---');

  function calculateAccuracyFromScores(
    prediction: string,
    actualHome: number,
    actualAway: number
  ): number {
    const actualDiff = Math.abs(actualHome - actualAway);
    const predictionLower = prediction.toLowerCase();

    const actualWinner =
      actualHome > actualAway ? 'home' :
      actualHome < actualAway ? 'away' : 'draw';

    const predictedHome = predictionLower.includes('home') ||
      (!predictionLower.includes('away') && !predictionLower.includes('draw'));
    const predictedAway = predictionLower.includes('away');
    const predictedDraw = predictionLower.includes('draw') || predictionLower.includes('tie');

    const isCorrect =
      (predictedHome && actualWinner === 'home') ||
      (predictedAway && actualWinner === 'away') ||
      (predictedDraw && actualWinner === 'draw');

    const winnerAccuracy = isCorrect ? 50 : 0;
    const marginAccuracy = Math.max(0, 50 - actualDiff * 3);

    return Math.min(100, winnerAccuracy + marginAccuracy);
  }

  test('gives 50+ points for correct winner prediction', () => {
    const score = calculateAccuracyFromScores('home', 100, 90);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  test('gives <50 points for incorrect prediction', () => {
    const score = calculateAccuracyFromScores('away', 100, 90);
    expect(score).toBeLessThan(50);
  });

  test('caps score at 100', () => {
    const score = calculateAccuracyFromScores('home', 100, 100);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('handles draw predictions', () => {
    const score = calculateAccuracyFromScores('draw', 100, 100);
    expect(score).toBe(100);
  });

  console.log('\n--- Prediction Matching ---');

  function isPredictionCorrect(
    predictionText: string,
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number
  ): boolean {
    const predictionLower = predictionText.toLowerCase();
    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;

    const predictedHome =
      predictionLower.includes(homeTeam.toLowerCase()) ||
      predictionLower.includes('home');
    const predictedAway =
      predictionLower.includes(awayTeam.toLowerCase()) ||
      predictionLower.includes('away');

    if (predictedHome && homeWon) return true;
    if (predictedAway && awayWon) return true;
    if (!predictedHome && !predictedAway && homeWon) return true;

    return false;
  }

  test('matches team name in prediction (home wins)', () => {
    expect(isPredictionCorrect('Lakers Win', 'Lakers', 'Celtics', 110, 100)).toBe(true);
  });

  test('matches team name in prediction (away wins)', () => {
    expect(isPredictionCorrect('Celtics Win', 'Lakers', 'Celtics', 100, 110)).toBe(true);
  });

  test('matches home keyword', () => {
    expect(isPredictionCorrect('home', 'Lakers', 'Celtics', 110, 100)).toBe(true);
  });

  test('matches away keyword', () => {
    expect(isPredictionCorrect('away', 'Lakers', 'Celtics', 100, 110)).toBe(true);
  });

  test('returns false for incorrect predictions', () => {
    expect(isPredictionCorrect('Lakers Win', 'Lakers', 'Celtics', 100, 110)).toBe(false);
  });

  console.log('\n--- Bulk Processing ---');

  test('batches correctly with BATCH_SIZE of 10', () => {
    const items = Array(25).fill({ id: 'test' });
    const BATCH_SIZE = 10;
    const batches: unknown[][] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    expect(batches.length).toBe(3);
    expect(batches[0].length).toBe(10);
    expect(batches[1].length).toBe(10);
    expect(batches[2].length).toBe(5);
  });

  test('handles empty array', () => {
    const items: unknown[] = [];
    const BATCH_SIZE = 10;
    const batches: unknown[][] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }

    expect(batches.length).toBe(0);
  });

  console.log('\n--- Confidence Validation ---');

  function validateConfidence(confidence: number): number {
    return Math.max(0, Math.min(100, confidence));
  }

  test('clamps negative confidence to 0', () => {
    expect(validateConfidence(-10)).toBe(0);
  });

  test('clamps confidence over 100 to 100', () => {
    expect(validateConfidence(150)).toBe(100);
  });

  test('keeps valid confidence unchanged', () => {
    expect(validateConfidence(75)).toBe(75);
  });

  console.log('\n✅ All tests completed!\n');
}

// Export for use in components if needed
export { normalizeStatus, toDbStatus };
