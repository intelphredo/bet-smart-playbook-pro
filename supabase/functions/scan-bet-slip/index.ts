import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a bet slip extraction assistant. Your job is to read sportsbook bet slip screenshots and extract structured bet data precisely.

Extract the following fields from the image:
- stake: the dollar amount wagered (number, no currency symbol)
- odds: the odds shown (American format like +150 or -110, as a number)
- matchTitle: the game or match name (e.g. "Lakers vs Celtics")
- homeTeam: the home team name
- awayTeam: the away team name  
- league: the league (NBA, NFL, MLB, NHL, NCAAB, NCAAF, MLS, EPL, etc.)
- sportsbook: which sportsbook (FanDuel, DraftKings, BetMGM, Caesars, etc.)
- betType: moneyline, spread, total, parlay, prop, etc.
- selection: what they bet on (e.g. "Lakers -5.5" or "Over 215.5")
- potentialPayout: potential total payout amount if shown (number)

Return ONLY a JSON object with these fields. Use null for any field you cannot determine. Be precise with numbers — never guess stakes or odds if they're not clearly visible.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Please extract the bet details from this bet slip screenshot and return them as a JSON object.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_bet_details",
              description: "Extract structured bet details from a sportsbook bet slip image",
              parameters: {
                type: "object",
                properties: {
                  stake: { type: "number", description: "Dollar amount wagered" },
                  odds: { type: "number", description: "American odds (e.g. -110, +150)" },
                  matchTitle: { type: "string", description: "Full match name" },
                  homeTeam: { type: "string", description: "Home team name" },
                  awayTeam: { type: "string", description: "Away team name" },
                  league: { type: "string", description: "Sport league acronym" },
                  sportsbook: { type: "string", description: "Sportsbook name" },
                  betType: { type: "string", description: "Type of bet" },
                  selection: { type: "string", description: "What was selected to bet on" },
                  potentialPayout: { type: "number", description: "Potential payout amount" },
                  confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence in extraction accuracy" },
                },
                required: ["confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_bet_details" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not extract bet details from the image" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted;
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse extracted bet data" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-bet-slip error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
