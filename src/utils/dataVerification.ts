import { Match, DataVerificationResult } from "@/types";

export function verifyMatchData(match: Match, sources: { name: string; data: Match }[]): DataVerificationResult {
  const result: DataVerificationResult = {
    isVerified: false,
    confidenceScore: 0,
    lastUpdated: new Date().toISOString(),
    sources: sources.map(s => s.name),
    discrepancies: []
  };

  // Compare core match data across sources
  const fields = ['startTime', 'status', 'score'] as const;
  
  fields.forEach(field => {
    const values: Record<string, any> = {};
    sources.forEach(source => {
      if (source.data[field]) {
        values[source.name] = source.data[field];
      }
    });

    // Check for discrepancies
    const uniqueValues = new Set(Object.values(values).map(v => JSON.stringify(v)));
    if (uniqueValues.size > 1) {
      result.discrepancies?.push({
        field,
        values
      });
    }
  });

  // Calculate confidence score based on agreement between sources
  const totalFields = fields.length;
  const fieldsWithDiscrepancies = result.discrepancies?.length || 0;
  result.confidenceScore = Math.round(((totalFields - fieldsWithDiscrepancies) / totalFields) * 100);
  
  // Mark as verified if confidence score is above threshold
  result.isVerified = result.confidenceScore >= 80;

  return result;
}
