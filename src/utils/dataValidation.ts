/**
 * Data Validation & Sanitization System
 * Catches NaN, Infinity, out-of-range values, and missing data across the app.
 */

export interface DataIssue {
  field: string;
  value: unknown;
  issue: 'nan' | 'infinity' | 'out_of_range' | 'missing' | 'negative_where_positive' | 'mismatch';
  context?: string;
  fixedValue?: number | string;
}

const issues: DataIssue[] = [];
let issueLoggingEnabled = false;

export function enableIssueLogging(enabled: boolean) {
  issueLoggingEnabled = enabled;
}

function logIssue(issue: DataIssue) {
  if (issueLoggingEnabled) {
    issues.push(issue);
    console.warn(`[DataValidation] ${issue.issue}: ${issue.field} = ${issue.value}`, issue.context || '');
  }
}

export function getDataIssues(): DataIssue[] {
  return [...issues];
}

export function clearDataIssues() {
  issues.length = 0;
}

/**
 * Safe number: returns fallback if NaN, Infinity, null, or undefined
 */
export function safeNumber(value: unknown, fallback: number = 0, field?: string): number {
  if (value === null || value === undefined) {
    if (field) logIssue({ field, value, issue: 'missing', fixedValue: fallback });
    return fallback;
  }
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) {
    if (field) logIssue({ field, value, issue: isNaN(num) ? 'nan' : 'infinity', fixedValue: fallback });
    return fallback;
  }
  return num;
}

/**
 * Clamp a percentage to 0-100 range, handling NaN
 */
export function safePercentage(value: unknown, fallback: number = 0, field?: string): number {
  const num = safeNumber(value, fallback, field);
  if (num < 0 || num > 100) {
    if (field) logIssue({ field, value: num, issue: 'out_of_range', context: 'Expected 0-100%', fixedValue: Math.max(0, Math.min(100, num)) });
    return Math.max(0, Math.min(100, num));
  }
  return num;
}

/**
 * Format a percentage for display, with NaN protection
 */
export function formatPercentage(value: unknown, decimals: number = 1, fallback: string = '—'): string {
  const num = safeNumber(value, NaN);
  if (isNaN(num)) return fallback;
  const clamped = Math.max(0, Math.min(100, num));
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Format a number with sign prefix (+/-), NaN-safe
 */
export function formatSignedNumber(value: unknown, fallback: string = '—'): string {
  const num = safeNumber(value, NaN);
  if (isNaN(num)) return fallback;
  return num > 0 ? `+${num}` : `${num}`;
}

/**
 * Format currency, NaN-safe
 */
export function formatCurrency(value: unknown, decimals: number = 2, fallback: string = '$0.00'): string {
  const num = safeNumber(value, NaN);
  if (isNaN(num)) return fallback;
  const prefix = num >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(num).toFixed(decimals)}`;
}

/**
 * Safe division that returns fallback instead of NaN/Infinity
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Validate win/loss/total consistency
 */
export function validateWinLossTotal(
  wins: number, 
  losses: number, 
  pending: number, 
  total: number, 
  context?: string
): { isValid: boolean; issues: string[] } {
  const validationIssues: string[] = [];
  const settled = wins + losses;
  
  if (wins < 0) validationIssues.push(`Negative wins: ${wins}`);
  if (losses < 0) validationIssues.push(`Negative losses: ${losses}`);
  if (pending < 0) validationIssues.push(`Negative pending: ${pending}`);
  if (settled + pending !== total && total > 0) {
    validationIssues.push(`W(${wins}) + L(${losses}) + P(${pending}) = ${settled + pending} ≠ total(${total})`);
  }

  if (validationIssues.length > 0 && context) {
    validationIssues.forEach(issue => {
      logIssue({ field: context, value: { wins, losses, pending, total }, issue: 'mismatch', context: issue });
    });
  }

  return { isValid: validationIssues.length === 0, issues: validationIssues };
}

/**
 * Safe average calculation from an array
 */
export function safeAverage(values: number[], fallback: number = 0): number {
  const validValues = values.filter(v => !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return fallback;
  return validValues.reduce((a, b) => a + b, 0) / validValues.length;
}

/**
 * Round a spread to standard 0.5 increments
 */
export function roundSpread(value: unknown, fallback: number = 0): number {
  const num = safeNumber(value, fallback);
  return Math.round(num * 2) / 2;
}

/**
 * Format a label with its value, adding descriptive context
 */
export function formatStatLabel(value: unknown, label: string, fallback: string = '—'): string {
  const num = safeNumber(value, NaN);
  if (isNaN(num)) return `${label}: ${fallback}`;
  return `${label}: ${num}`;
}

/**
 * Batch validate an object's numeric fields
 */
export function validateNumericFields(
  obj: Record<string, unknown>, 
  fields: string[], 
  context: string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const field of fields) {
    result[field] = safeNumber(obj[field], 0, `${context}.${field}`);
  }
  return result;
}
