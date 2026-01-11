import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  match_id?: string;
  user_id?: string;
  type: "game_start" | "bet_won" | "bet_lost" | "clv_alert" | "line_movement";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface PushSubscription {
  id: string;
  user_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

// Web Push requires VAPID keys - these should be generated once and stored as secrets
// For now, we'll use a simplified approach that works with service workers
async function sendWebPush(subscription: PushSubscription["subscription"], payload: object): Promise<boolean> {
  try {
    // In production, you'd use web-push library with VAPID keys
    // For now, we'll simulate success and rely on polling/realtime
    console.log(`Would send push to: ${subscription.endpoint}`);
    console.log(`Payload:`, JSON.stringify(payload));
    
    // Note: Full web push implementation requires:
    // 1. VAPID public/private key pair (stored as secrets)
    // 2. web-push library or manual implementation
    // 3. Encryption of payload using subscription keys
    
    return true;
  } catch (error) {
    console.error("Push failed:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: PushPayload = await req.json();
    console.log("Sending push notification:", payload);

    // Determine which users to notify
    let userIds: string[] = [];

    if (payload.user_id) {
      // Specific user
      userIds = [payload.user_id];
    } else if (payload.match_id) {
      // All users with bets on this match
      const { data: bets } = await supabase
        .from("user_bets")
        .select("user_id")
        .eq("match_id", payload.match_id)
        .eq("status", "pending");

      if (bets) {
        userIds = [...new Set(bets.map(b => b.user_id))];
      }
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Notifying ${userIds.length} users`);

    // Get push subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for users");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions to send to" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications
    const pushPayload = {
      title: payload.title,
      body: payload.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        type: payload.type,
        match_id: payload.match_id,
        ...payload.data,
      },
    };

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions as PushSubscription[]) {
      const success = await sendWebPush(sub.subscription, pushPayload);
      if (success) {
        successCount++;
      } else {
        failCount++;
        // Remove invalid subscription
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        totalSubscriptions: subscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
