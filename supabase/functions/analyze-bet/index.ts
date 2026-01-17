import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
  prediction: {
    recommended: 'home' | 'away' | 'draw';
    confidence: number;
    projectedScore: {
      home: number;
      away: number;
    };
    algorithmId?: string;
    expectedValue?: number;
    evPercentage?: number;
    keyFactors?: string[];
  };
  spread?: {
    home: number;
    away: number;
  };
  total?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { match } = await req.json() as { match: MatchData };

    if (!match) {
      return new Response(
        JSON.stringify({ error: "Match data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the analysis prompt
    const systemPrompt = `You are an expert sports betting analyst with deep knowledge of statistics, team dynamics, and betting markets. Your role is to provide insightful, educational analysis of sports matchups to help bettors make informed decisions.

Key guidelines:
- Be objective and balanced in your analysis
- Highlight both strengths and weaknesses of each side
- Consider multiple factors: recent form, head-to-head, injuries, home advantage, motivation
- Explain the reasoning behind the AI prediction
- Identify potential risks and value opportunities
- Keep language accessible but informative
- Never guarantee outcomes - betting involves risk
- Format with clear sections using markdown`;

    const keyFactorsText = match.prediction.keyFactors?.length 
      ? `Key factors identified: ${match.prediction.keyFactors.join(', ')}`
      : '';

    const evInfo = match.prediction.evPercentage 
      ? `Expected Value: ${match.prediction.evPercentage > 0 ? '+' : ''}${match.prediction.evPercentage.toFixed(1)}%`
      : '';

    const userPrompt = `Analyze this ${match.league} matchup and explain the AI prediction:

**${match.homeTeam} vs ${match.awayTeam}**
- Game Time: ${new Date(match.startTime).toLocaleString()}
- League: ${match.league}

**Current Odds:**
- ${match.homeTeam}: ${match.odds.homeWin > 0 ? '+' : ''}${match.odds.homeWin}
- ${match.awayTeam}: ${match.odds.awayWin > 0 ? '+' : ''}${match.odds.awayWin}
${match.odds.draw ? `- Draw: ${match.odds.draw > 0 ? '+' : ''}${match.odds.draw}` : ''}

**AI Prediction:**
- Recommended: ${match.prediction.recommended === 'home' ? match.homeTeam : match.prediction.recommended === 'away' ? match.awayTeam : 'Draw'}
- Confidence: ${match.prediction.confidence}%
- Projected Score: ${match.homeTeam} ${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away} ${match.awayTeam}
${evInfo}
${keyFactorsText}

Please provide:
1. **Matchup Overview** - Brief context about both teams
2. **Why This Pick** - Explain the reasoning behind the AI recommendation
3. **Key Factors** - 3-4 most important factors influencing this prediction
4. **Risks to Consider** - What could go wrong with this pick
5. **Value Assessment** - Is there betting value here and why
6. **Bottom Line** - One sentence summary recommendation

Keep the total response under 400 words.`;

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
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        matchId: match.id,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("analyze-bet error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});