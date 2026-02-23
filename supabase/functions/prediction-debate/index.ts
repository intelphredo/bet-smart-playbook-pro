import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchWithTimeout } from "../_shared/fetch-utils.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlgorithmPrediction {
  algorithmName: string;
  recommended: string;
  confidence: number;
  projectedScore: { home: number; away: number };
  evPercentage: number;
  kellyStakeUnits: number;
  trueProbability: number;
}

interface TemporalContext {
  seasonSegment: string;
  homeFormWeighted: number;
  awayFormWeighted: number;
  homeMomentumDecay: number;
  awayMomentumDecay: number;
  homeTrajectory: string;
  awayTrajectory: string;
}

interface DebateRequest {
  matchTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  predictions: AlgorithmPrediction[];
  weights: { algorithmName: string; weight: number; winRate: number }[];
  temporal?: TemporalContext;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rl = await checkRateLimit(req, { ...RATE_LIMITS.WRITE, endpoint: "prediction-debate" });
  if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

  try {
    const body: DebateRequest = await req.json();
    const { matchTitle, league, homeTeam, awayTeam, predictions, weights, temporal } = body;

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Predictions array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the debate prompt
    const algorithmSummaries = predictions.map((p, i) => {
      const w = weights?.find(w => w.algorithmName === p.algorithmName);
      return `**${p.algorithmName}** (historical win rate: ${w?.winRate?.toFixed(1) ?? '?'}%, weight: ${((w?.weight ?? 0.33) * 100).toFixed(0)}%):
  - Pick: ${p.recommended === 'home' ? homeTeam : p.recommended === 'away' ? awayTeam : p.recommended}
  - Confidence: ${p.confidence}%
  - Projected Score: ${homeTeam} ${p.projectedScore.home} - ${awayTeam} ${p.projectedScore.away}
  - EV: ${p.evPercentage > 0 ? '+' : ''}${p.evPercentage.toFixed(1)}%
  - Kelly Stake: ${p.kellyStakeUnits.toFixed(1)} units
  - True Probability: ${(p.trueProbability * 100).toFixed(1)}%`;
    }).join('\n\n');

    const allAgree = new Set(predictions.map(p => p.recommended)).size === 1;

    const systemPrompt = `You are EdgeIQ's AI Debate Moderator — an expert sports analyst who synthesizes multiple quantitative model predictions into a final recommendation through structured debate reasoning.

Your role: Analyze each algorithm's prediction, identify potential biases, find areas of agreement and disagreement, and produce a final synthesized recommendation with reasoning.

## Debate Protocol:
1. **Identify Agreement**: What do all models agree on? This is your strongest signal.
2. **Analyze Disagreements**: Where models disagree, determine WHY based on their methodology:
   - ML Power Index: Momentum and trend-heavy — may overreact to recent form
   - Value Pick Finder: EV-focused — may see value others miss but can be contrarian
   - Statistical Edge: Historical matchup heavy — may miss recent context changes
3. **Temporal Analysis**: Use the temporal context to:
   - Adjust trust in recent form based on season segment (early season form is noisy)
   - Identify momentum decay — is a hot streak sustainable or fading?
   - Detect trajectory mismatches (ascending team vs descending team)
   - Flag when models may be overweighting stale momentum
4. **Check for Biases**: Flag when a model's known bias might be affecting its prediction
5. **Synthesize**: Produce a final recommendation that accounts for all perspectives + temporal patterns

## Output Format (STRICT JSON):
{
  "finalPick": "home" | "away" | "skip",
  "adjustedConfidence": <number 40-95>,
  "reasoning": "<2-3 sentence synthesis explaining the debate outcome>",
  "biasesIdentified": ["<bias 1>", "<bias 2>"],
  "keyFactor": "<single most important factor driving the prediction>",
  "agreementLevel": "unanimous" | "strong" | "split" | "contested",
  "temporalInsight": "<1 sentence about how timing/form trends affect this pick>",
  "riskFlag": "<optional: any concern about this pick>"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

    // Build temporal context section
    let temporalSection = '';
    if (temporal) {
      temporalSection = `

## Temporal Context:
- **Season Segment:** ${temporal.seasonSegment} (${temporal.seasonSegment === 'early' ? 'small sample — trust form less' : temporal.seasonSegment === 'postseason' ? 'high stakes — form is amplified' : 'mid-season — balanced trust'})
- **${homeTeam} Recency-Weighted Form:** ${temporal.homeFormWeighted}% | Momentum Decay: ${(temporal.homeMomentumDecay * 100).toFixed(0)}% sustained | Trajectory: ${temporal.homeTrajectory}
- **${awayTeam} Recency-Weighted Form:** ${temporal.awayFormWeighted}% | Momentum Decay: ${(temporal.awayMomentumDecay * 100).toFixed(0)}% sustained | Trajectory: ${temporal.awayTrajectory}`;
    }

    const userPrompt = `## Match: ${matchTitle}
**League:** ${league}
**${homeTeam} vs ${awayTeam}**

## Algorithm Predictions:

${algorithmSummaries}
${temporalSection}

## Current Status: ${allAgree ? 'UNANIMOUS AGREEMENT' : 'DISAGREEMENT DETECTED — debate required'}

Analyze these predictions through the debate framework (including temporal patterns) and return your synthesized JSON recommendation.`;

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      timeout: 30000,
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
        temperature: 0.3, // Low temp for analytical consistency
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI debate service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response (strip markdown fences if present)
    let debateResult;
    try {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      debateResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI debate response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse debate result", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(debateResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("prediction-debate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
