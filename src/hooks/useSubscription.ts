import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PlanTier = "free" | "basic" | "pro" | "elite";
export type SubscriptionStatus = "trialing" | "active" | "canceled" | "past_due" | "incomplete" | "inactive";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
}

export interface FeatureAccess {
  predictions: number | "unlimited";
  arbitrage: boolean | "basic" | "full";
  historicalData: number | "unlimited";
  realTimeAlerts: boolean | "email" | "push" | "priority";
  apiAccess: boolean;
  advancedAnalytics: boolean;
  expertPicks: boolean;
}

const FEATURE_ACCESS: Record<PlanTier, FeatureAccess> = {
  free: {
    predictions: 3,
    arbitrage: false,
    historicalData: 7,
    realTimeAlerts: false,
    apiAccess: false,
    advancedAnalytics: false,
    expertPicks: false,
  },
  basic: {
    predictions: "unlimited",
    arbitrage: "basic",
    historicalData: 30,
    realTimeAlerts: "email",
    apiAccess: false,
    advancedAnalytics: false,
    expertPicks: false,
  },
  pro: {
    predictions: "unlimited",
    arbitrage: "full",
    historicalData: 90,
    realTimeAlerts: "push",
    apiAccess: false,
    advancedAnalytics: true,
    expertPicks: false,
  },
  elite: {
    predictions: "unlimited",
    arbitrage: "full",
    historicalData: "unlimited",
    realTimeAlerts: "priority",
    apiAccess: true,
    advancedAnalytics: true,
    expertPicks: true,
  },
};

const PLAN_PRICES = {
  basic: 9.99,
  pro: 19.99,
  elite: 29.99,
};

export const useSubscription = () => {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageCount, setUsageCount] = useState<Record<string, number>>({});

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching subscription:", error);
        }

        setSubscription(data as Subscription | null);
      } catch (err) {
        console.error("Subscription fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Get current tier (from subscription or fallback to free)
  const tier: PlanTier = subscription?.status === "active" || subscription?.status === "trialing"
    ? subscription.plan_tier
    : "free";

  // Check if subscription is active
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  // Check if in trial period
  const isTrialing = subscription?.status === "trialing";

  // Get days until renewal/trial end
  const getDaysUntilRenewal = useCallback(() => {
    if (!subscription?.current_period_end) return null;
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [subscription]);

  // Get feature access for current tier
  const features = FEATURE_ACCESS[tier];

  // Check if user can access a specific feature
  const canAccess = useCallback((feature: keyof FeatureAccess): boolean => {
    const access = features[feature];
    return access !== false && access !== 0;
  }, [features]);

  // Get usage limit for a feature
  const getLimit = useCallback((feature: keyof FeatureAccess): number | "unlimited" | null => {
    const access = features[feature];
    if (typeof access === "number") return access;
    if (access === "unlimited" || access === true || access === "full" || access === "priority" || access === "push" || access === "email" || access === "basic") {
      return "unlimited";
    }
    return null;
  }, [features]);

  // Track usage for a feature
  const trackUsage = useCallback(async (featureName: string): Promise<{ allowed: boolean; remaining: number | "unlimited" }> => {
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    // If user has unlimited access, always allow
    const limit = getLimit(featureName as keyof FeatureAccess);
    if (limit === "unlimited" || limit === null) {
      return { allowed: true, remaining: "unlimited" };
    }

    try {
      // Call the increment function and get new count
      const { data, error } = await supabase.rpc("increment_usage", {
        p_user_id: user.id,
        p_feature_name: featureName,
      });

      if (error) {
        console.error("Usage tracking error:", error);
        return { allowed: true, remaining: limit }; // Fail open
      }

      const currentCount = data as number;
      const remaining = Math.max(0, limit - currentCount);
      const allowed = currentCount <= limit;

      setUsageCount(prev => ({ ...prev, [featureName]: currentCount }));

      if (!allowed) {
        toast.error("Daily Limit Reached", {
          description: `You've used all ${limit} ${featureName} for today. Upgrade for unlimited access.`,
        });
      }

      return { allowed, remaining };
    } catch (err) {
      console.error("Usage tracking error:", err);
      return { allowed: true, remaining: limit }; // Fail open
    }
  }, [user, getLimit]);

  // Get remaining usage for a feature
  const getRemainingUsage = useCallback(async (featureName: string): Promise<number | "unlimited"> => {
    if (!user) return 0;

    const limit = getLimit(featureName as keyof FeatureAccess);
    if (limit === "unlimited" || limit === null) return "unlimited";

    try {
      const { data, error } = await supabase.rpc("get_daily_usage", {
        p_user_id: user.id,
        p_feature_name: featureName,
      });

      if (error) {
        console.error("Error getting usage:", error);
        return limit;
      }

      return Math.max(0, limit - (data as number || 0));
    } catch (err) {
      console.error("Error getting usage:", err);
      return limit;
    }
  }, [user, getLimit]);

  // Create checkout session
  const createCheckoutSession = useCallback(async (planTier: "basic" | "pro" | "elite") => {
    if (!user) {
      toast.error("Sign In Required", {
        description: "Please sign in to subscribe to a plan.",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planTier },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Checkout Error", {
        description: "Unable to start checkout. Please try again.",
      });
      return null;
    }
  }, [user]);

  // Open customer portal
  const openCustomerPortal = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("create-customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      console.error("Portal error:", err);
      toast.error("Error", {
        description: "Unable to open billing portal. Please try again.",
      });
      return null;
    }
  }, [user]);

  return {
    subscription,
    tier,
    isActive,
    isTrialing,
    loading,
    features,
    canAccess,
    getLimit,
    trackUsage,
    getRemainingUsage,
    getDaysUntilRenewal,
    createCheckoutSession,
    openCustomerPortal,
    planPrices: PLAN_PRICES,
    usageCount,
  };
};
