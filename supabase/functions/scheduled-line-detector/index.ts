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
      job_name: "line-detector",
      status: "running",
    })
    .select()
    .single();

  if (logError) {
    console.error("Failed to create job log:", logError);
  }

  const jobId = jobLog?.id;

  try {
    console.log("Starting scheduled line movement detection...");

    // Call the detect-line-movements function
    const detectUrl = `${supabaseUrl}/functions/v1/detect-line-movements`;
    const detectResponse = await fetch(detectUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!detectResponse.ok) {
      throw new Error(`detect-line-movements failed: ${detectResponse.status}`);
    }

    const detectData = await detectResponse.json();
    const movementsDetected = detectData.movementsDetected || 0;
    const alertsCreated = detectData.alertsCreated || 0;

    console.log(`Detected ${movementsDetected} line movements, created ${alertsCreated} alerts`);

    // Update job log with success
    if (jobId) {
      await supabase
        .from("scheduled_job_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          records_processed: movementsDetected,
          metadata: {
            movements_detected: movementsDetected,
            alerts_created: alertsCreated,
          },
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        movementsDetected,
        alertsCreated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scheduled line detection failed:", error);

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
