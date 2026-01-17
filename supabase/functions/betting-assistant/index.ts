import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json() as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
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

    const systemPrompt = `You are EdgeIQ's AI Betting Assistant - an expert in sports betting strategy, odds analysis, and bankroll management. You help users make smarter betting decisions through education and analysis.

## Your Expertise Areas:
1. **Betting Strategies**: Explain value betting, arbitrage, hedging, parlays, teasers, and when to use each
2. **Odds Interpretation**: Convert between American/Decimal/Fractional odds, explain implied probability, identify value
3. **Bankroll Management**: Kelly Criterion, unit sizing, proper staking, avoiding tilt
4. **CLV (Closing Line Value)**: Explain why beating the closing line matters for long-term profitability
5. **Sharp vs Square**: Differences between professional and recreational betting approaches
6. **Line Shopping**: Why comparing odds across sportsbooks is crucial
7. **Expected Value (EV)**: How to calculate and think in terms of +EV decisions

## Response Guidelines:
- Be educational and explain concepts clearly
- Use specific examples with real numbers when helpful
- Always emphasize responsible gambling - betting should be entertainment
- Never guarantee outcomes or promise profits
- Keep responses concise but thorough (aim for 100-200 words unless a complex topic)
- Use markdown formatting for clarity (bold, bullets, etc.)
- If asked about specific games/picks, explain you provide strategy education, not specific predictions
- Remind users that the app's AI predictions are tools to inform, not guarantees

## Example Topics You Can Help With:
- "What is expected value in betting?"
- "How do I calculate implied probability from -150 odds?"
- "Explain the Kelly Criterion"
- "What's a good unit size for my bankroll?"
- "How does CLV show betting skill?"
- "When should I hedge a bet?"
- "What makes a sharp bettor different?"

Be friendly, helpful, and always promote responsible gambling practices.`;

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
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
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
        JSON.stringify({ error: "Failed to get response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("betting-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});