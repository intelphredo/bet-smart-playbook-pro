import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      matchTitle,
      league,
      homeTeam,
      awayTeam,
      predictions,
      ensembleMetadata,
      temporal,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an advanced sports prediction meta-learner. You combine insights from multiple ensemble layers to produce a final synthesized prediction.

Your analysis framework:
1. BASE LEARNER ANALYSIS: Review individual algorithm predictions for biases and strengths
2. GRADIENT BOOSTING REVIEW: Assess the boosting corrections — are they overcorrecting or undercorrecting?
3. SEQUENTIAL PATTERN VALIDATION: Evaluate detected patterns — are streaks sustainable or due for regression?
4. DIVERSITY ASSESSMENT: Higher diversity means more robust predictions; low diversity means potential blind spots
5. META-SYNTHESIS: Combine all signals into a final calibrated recommendation

Key principles:
- Streaks of 5+ games almost always regress — dampen confidence
- Breakout patterns need at least 3 data points to trust
- When all base learners agree AND diversity is low, there may be a shared blind spot
- Early season data (small samples) should have wider confidence intervals
- Gradient boosting adjustments above ±5 suggest significant model disagreement

Return JSON with:
{
  "metaPick": "home" | "away" | "skip",
  "metaConfidence": number (40-95),
  "synthesis": string (2-3 sentence meta-analysis),
  "boostingAssessment": string (1 sentence on whether gradient corrections are appropriate),
  "patternReliability": "high" | "moderate" | "low" | "unreliable",
  "blindSpots": string[] (potential gaps in the analysis),
  "edgeStrength": "strong" | "moderate" | "slight" | "none",
  "regressionRisk": "high" | "moderate" | "low"
}`;

    const userPrompt = `Match: ${matchTitle}
League: ${league}
Home: ${homeTeam} | Away: ${awayTeam}

BASE LEARNER PREDICTIONS:
${predictions.map((p: any) => `- ${p.algorithmName}: ${p.recommended} (confidence: ${p.confidence}%, EV: ${p.evPercentage}%, Kelly: ${p.kellyStakeUnits}u)`).join('\n')}

ENSEMBLE METADATA:
- Diversity Score: ${ensembleMetadata?.diversityScore ?? 'N/A'}
- Sequential Pattern: ${ensembleMetadata?.sequentialPattern?.type ?? 'none'} (strength: ${ensembleMetadata?.sequentialPattern?.strength ?? 0}, desc: ${ensembleMetadata?.sequentialPattern?.description ?? 'N/A'})
- Gradient Boosting Adjustments: ${JSON.stringify(ensembleMetadata?.boostingAdjustments ?? {})}
- Layer Contributions: Base=${ensembleMetadata?.layerContributions?.baseLearners ?? 0}, Boost=${ensembleMetadata?.layerContributions?.gradientBoosting ?? 0}, Pattern=${ensembleMetadata?.layerContributions?.sequentialPattern ?? 0}, Diversity=${ensembleMetadata?.layerContributions?.diversityBonus ?? 0}
- Calibration Delta: ${ensembleMetadata?.calibrationDelta ?? 0}
- Stacked Confidence: ${ensembleMetadata?.stackedConfidence ?? 'N/A'}

${temporal ? `TEMPORAL CONTEXT:
- Season Segment: ${temporal.seasonSegment}
- Home Form (weighted): ${temporal.homeFormWeighted}% | Away: ${temporal.awayFormWeighted}%
- Home Momentum Decay: ${temporal.homeMomentumDecay} | Away: ${temporal.awayMomentumDecay}
- Home Trajectory: ${temporal.homeTrajectory} | Away: ${temporal.awayTrajectory}` : ''}

Synthesize all layers into your meta-analysis. Return only valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI synthesis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse synthesis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Ensemble synthesis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
