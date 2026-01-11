import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Odds API → ESPN mapping table
// You MUST maintain this table in your DB
// Example structure:
// match_id | espn_id
async function loadMatchMappings(supabase: any): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("match_mappings")
    .select("match_id, espn_id");

  if (error) {
    console.error("Failed to load match mappings:", error);
    return new Map();
  }

  const map = new Map<string, string>();
  data.forEach((row: any) => map.set(row.match_id, row.espn_id));
  return map;
}

async function fetchESPNStatuses(espnIds: string[]): Promise<Map<string, string>> {
  const statusMap = new Map<string, string>();

  // ESPN scoreboard endpoints
  const endpoints = [
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard",
    "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
  ];

  const fetches = endpoints.map(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const json = await res.json();
      const events = json.events || [];

      for (const ev of events) {
        const id = ev.id;
        if (!espnIds.includes(id)) continue;

        const state = ev.status?.type?.state;
        const completed = ev.status?.type?.completed;

        let status = "scheduled";
        if (state === "in") status = "live";
        if (state === "post" || completed) status = "finished";

        statusMap.set(id, status);
      }
    } catch (err) {
      console.error("ESPN fetch failed:", err);
    }
  });

  await Promise.all(fetches);
  return statusMap;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
