import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create job log entry
  const { data: jobLog, error: logError } = await supabase
    .from("scheduled_job_logs")
    .insert({
      job_name: "odds-recorder",
      status: "running",
    })
    .select()
    .single();

  if (logError) {
    console.error("Failed to create job log:", logError);
  }

  const jobId = jobLog?.id;

  try {
    console.log("Starting scheduled odds recording...");

    // Step 1: Fetch fresh odds from the API
    const fetchOddsUrl = `${supabaseUrl}/functions/v1/fetch-odds?league=ALL`;
    const fetchResponse = await fetch(fetchOddsUrl, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`fetch-odds failed: ${fetchResponse.status}`);
    }

    const oddsData = await fetchResponse.json();
    console.log(`Fetched ${oddsData.totalEvents || 0} events from odds API`);

    // Step 2: Record odds to database
    const recordOddsUrl = `${supabaseUrl}/functions/v1/record-odds?league=ALL`;
    const recordResponse = await fetch(recordOddsUrl, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!recordResponse.ok) {
      throw new Error(`record-odds failed: ${recordResponse.status}`);
    }

    const recordData = await recordResponse.json();
    console.log(`Recorded ${recordData.recordsInserted || 0} odds records`);

    // Update job log with success
    if (jobId) {
      await supabase
        .from("scheduled_job_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          records_processed: recordData.recordsInserted || 0,
          metadata: {
            events_fetched: oddsData.totalEvents || 0,
            api_usage: oddsData.apiUsage,
          },
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsFetched: oddsData.totalEvents || 0,
        recordsInserted: recordData.recordsInserted || 0,
        apiUsage: oddsData.apiUsage,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scheduled odds recording failed:", error);

    // Update job log with failure
    if (jobId) {
      await supabase
        .from("scheduled_job_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
