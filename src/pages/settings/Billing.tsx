import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PlanTier } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Star, 
  Trophy, 
  Check, 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const plans = [
  {
    tier: "basic" as PlanTier,
    name: "Basic",
    price: "$9.99",
    icon: Star,
    features: [
      "Smart Algorithm Picks",
      "Basic Match Analysis",
      "Unlimited Daily Predictions",
      "Email Notifications",
      "30-Day Historical Data",
    ],
  },
  {
    tier: "pro" as PlanTier,
    name: "Pro",
    price: "$19.99",
    icon: Crown,
    popular: true,
    features: [
      "All Basic Features",
      "Full Arbitrage Opportunities",
      "Advanced Analytics",
      "90-Day Historical Data",
      "Push Notifications",
      "Priority Support",
    ],
  },
  {
    tier: "elite" as PlanTier,
    name: "Elite",
    price: "$29.99",
    icon: Trophy,
    features: [
      "All Pro Features",
      "VIP Expert Picks",
      "Real-time Priority Alerts",
      "Unlimited Historical Data",
      "1-on-1 Strategy Sessions",
      "API Access",
    ],
  },
];

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { 
    subscription, 
    tier, 
    isActive, 
    isTrialing, 
    loading: subLoading, 
    getDaysUntilRenewal,
    createCheckoutSession,
    openCustomerPortal,
  } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Subscription Activated!",
        description: "Welcome to premium! Your subscription is now active.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Checkout Canceled",
        description: "No worries! You can subscribe anytime.",
        variant: "default",
      });
    }
  }, [searchParams, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSubscribe = async (planTier: "basic" | "pro" | "elite") => {
    setCheckoutLoading(planTier);
    try {
      await createCheckoutSession(planTier);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="container max-w-6xl py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>
      </div>

      {/* Current Plan Card */}
      {isActive && subscription && (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  {tier === "elite" ? (
                    <Trophy className="h-5 w-5 text-primary" />
                  ) : tier === "pro" ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <Star className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="capitalize">{tier} Plan</CardTitle>
                  <CardDescription>
                    {isTrialing ? "Trial Period" : "Active Subscription"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={isTrialing ? "secondary" : "default"}>
                {isTrialing ? "Trial" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {isTrialing ? "Trial Ends" : "Next Billing Date"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.current_period_end 
                      ? format(new Date(subscription.current_period_end), "MMMM d, yyyy")
                      : "N/A"}
                    {daysUntilRenewal !== null && (
                      <span className="ml-1">({daysUntilRenewal} days)</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Billing</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.cancel_at_period_end 
                      ? "Cancels at period end" 
                      : "Renews automatically"}
                  </p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Your subscription will end on {subscription.current_period_end 
                    ? format(new Date(subscription.current_period_end), "MMMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
            )}

            <Button 
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="w-full sm:w-auto"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Free Plan Prompt */}
      {tier === "free" && !isActive && (
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-semibold text-lg">Upgrade to Premium</h3>
                <p className="text-muted-foreground">
                  Get unlimited predictions, arbitrage opportunities, and advanced analytics
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                7-Day Free Trial
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {isActive ? "Change Your Plan" : "Choose Your Plan"}
        </h2>
        <p className="text-muted-foreground">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = isActive && tier === plan.tier;
          const Icon = plan.icon;
          
          return (
            <Card 
              key={plan.tier}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${
                isCurrentPlan ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <div className={`mx-auto p-3 rounded-full w-fit ${
                  plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || checkoutLoading !== null}
                  onClick={() => plan.tier !== "free" && handleSubscribe(plan.tier)}
                >
                  {checkoutLoading === plan.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isCurrentPlan 
                    ? "Current Plan" 
                    : isActive 
                      ? "Switch Plan" 
                      : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ / Help */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Questions about billing?{" "}
          <Button variant="link" className="p-0 h-auto text-sm">
            Contact Support
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Billing;
