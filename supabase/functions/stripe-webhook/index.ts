import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      console.error("Stripe configuration missing");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No signature provided");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received webhook event: ${event.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await updateSubscription(supabase, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscription(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);
        
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating canceled subscription:", error);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);
        
        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            console.error("Error updating subscription after payment:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);
        
        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            console.error("Error updating subscription after failed payment:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook handler failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateSubscription(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const planTier = subscription.metadata.plan_tier || getPlanTierFromPrice(subscription);
  
  console.log(`Updating subscription for customer ${customerId}: status=${subscription.status}, tier=${planTier}`);

  // Find user by customer ID
  const { data: existingSub, error: findError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError || !existingSub) {
    console.error("Could not find subscription record:", findError);
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    canceled: "canceled",
    past_due: "past_due",
    incomplete: "incomplete",
    incomplete_expired: "inactive",
    unpaid: "past_due",
  };

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      plan_tier: planTier,
      status: statusMap[subscription.status] || "inactive",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("user_id", existingSub.user_id);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
  } else {
    console.log("Subscription updated successfully");
    
    // Also update the profiles table for backward compatibility
    await supabase
      .from("profiles")
      .update({ 
        subscription_status: subscription.status === "active" || subscription.status === "trialing" 
          ? "premium" 
          : "free" 
      })
      .eq("id", existingSub.user_id);
  }
}

function getPlanTierFromPrice(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id;
  
  const basicPriceId = Deno.env.get("STRIPE_BASIC_PRICE_ID");
  const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
  const elitePriceId = Deno.env.get("STRIPE_ELITE_PRICE_ID");

  if (priceId === basicPriceId) return "basic";
  if (priceId === proPriceId) return "pro";
  if (priceId === elitePriceId) return "elite";
  
  return "basic"; // Default fallback
}
