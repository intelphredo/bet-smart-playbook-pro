import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TaskName = "odds-recorder" | "bet-grader" | "line-detector" | "game-monitor" | "all";

interface TaskResult {
  task: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

const TASK_FUNCTIONS: Record<string, string> = {
  "odds-recorder": "scheduled-odds-recorder",
  "bet-grader": "scheduled-bet-grader",
  "line-detector": "scheduled-line-detector",
  "game-monitor": "detect-game-starts",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request to determine which task(s) to run
    const url = new URL(req.url);
    const taskParam = url.searchParams.get("task") || "all";
    
    let body: { task?: TaskName } = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        // Empty body is fine
      }
    }

    const task: TaskName = (body.task || taskParam) as TaskName;
    console.log(`Scheduler master running task: ${task}`);

    // Determine which tasks to execute
    const tasksToRun = task === "all" 
      ? Object.keys(TASK_FUNCTIONS)
      : [task];

    // Validate task names
    for (const t of tasksToRun) {
      if (!TASK_FUNCTIONS[t]) {
        return new Response(
          JSON.stringify({ error: `Unknown task: ${t}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create master job log
    const { data: masterLog } = await supabase
      .from("scheduled_job_logs")
      .insert({
        job_name: `master-${task}`,
        status: "running",
        metadata: { tasks: tasksToRun },
      })
      .select()
      .single();

    const results: TaskResult[] = [];
    let hasErrors = false;

    // Execute tasks sequentially to avoid overwhelming resources
    for (const taskName of tasksToRun) {
      const functionName = TASK_FUNCTIONS[taskName];
      const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

      console.log(`Executing: ${taskName} -> ${functionName}`);

      try {
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          results.push({
            task: taskName,
            success: true,
            data,
          });
          console.log(`✓ ${taskName} completed successfully`);
        } else {
          hasErrors = true;
          results.push({
            task: taskName,
            success: false,
            error: data.error || `HTTP ${response.status}`,
          });
          console.error(`✗ ${taskName} failed:`, data.error);
        }
      } catch (error) {
        hasErrors = true;
        results.push({
          task: taskName,
          success: false,
          error: error.message,
        });
        console.error(`✗ ${taskName} threw error:`, error.message);
      }

      // Small delay between tasks
      if (tasksToRun.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update master log
    if (masterLog?.id) {
      await supabase
        .from("scheduled_job_logs")
        .update({
          status: hasErrors ? "failed" : "success",
          completed_at: new Date().toISOString(),
          records_processed: results.filter(r => r.success).length,
          metadata: {
            tasks: tasksToRun,
            results: results.map(r => ({
              task: r.task,
              success: r.success,
              error: r.error,
            })),
          },
        })
        .eq("id", masterLog.id);
    }

    // Cleanup old logs
    try {
      await supabase.rpc("cleanup_old_job_logs");
      console.log("Cleaned up old job logs");
    } catch (cleanupError) {
      console.warn("Failed to cleanup old logs:", cleanupError);
    }

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        task,
        results,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: hasErrors ? 207 : 200, // 207 Multi-Status if partial failure
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Scheduler master error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
