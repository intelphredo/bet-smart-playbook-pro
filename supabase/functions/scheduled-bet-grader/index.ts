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
      job_name: "bet-grader",
      status: "running",
    })
    .select()
    .single();

  if (logError) {
    console.error("Failed to create job log:", logError);
  }

  const jobId = jobLog?.id;

  try {
    console.log("Starting scheduled bet grading...");

    let totalBetsGraded = 0;
    let totalSharpPredictionsGraded = 0;
    let totalAlertsCreated = 0;
    let clvCalculated = 0;

    // Step 1: Grade pending bets AND sharp money predictions
    const gradeBetsUrl = `${supabaseUrl}/functions/v1/grade-bets`;
    const gradeResponse = await fetch(gradeBetsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
    });

    if (gradeResponse.ok) {
      const gradeData = await gradeResponse.json();
      totalBetsGraded = gradeData.data?.betsGraded || 0;
      totalSharpPredictionsGraded = gradeData.data?.sharpPredictionsGraded || 0;
      totalAlertsCreated = gradeData.data?.alerts_created || 0;
      console.log(`Graded ${totalBetsGraded} bets, ${totalSharpPredictionsGraded} sharp predictions, created ${totalAlertsCreated} alerts`);
    } else {
      console.warn("grade-bets returned non-OK status:", gradeResponse.status);
    }

    // Step 2: Capture closing odds and calculate CLV
    const captureClvUrl = `${supabaseUrl}/functions/v1/capture-closing-odds`;
    const clvResponse = await fetch(captureClvUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
    });

    if (clvResponse.ok) {
      const clvData = await clvResponse.json();
      clvCalculated = clvData.betsUpdated || 0;
      totalAlertsCreated += clvData.alertsCreated || 0;
      console.log(`Calculated CLV for ${clvCalculated} bets`);
    } else {
      console.warn("capture-closing-odds returned non-OK status:", clvResponse.status);
    }

    // Update job log with success
    if (jobId) {
      await supabase
        .from("scheduled_job_logs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          records_processed: totalBetsGraded + totalSharpPredictionsGraded + clvCalculated,
          metadata: {
            bets_graded: totalBetsGraded,
            sharp_predictions_graded: totalSharpPredictionsGraded,
            clv_calculated: clvCalculated,
            alerts_created: totalAlertsCreated,
          },
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        betsGraded: totalBetsGraded,
        sharpPredictionsGraded: totalSharpPredictionsGraded,
        clvCalculated,
        alertsCreated: totalAlertsCreated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scheduled bet grading failed:", error);

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
