
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Star, Trophy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Basic",
    price: "$9.99",
    icon: Star,
    features: [
      "Smart Algorithm Picks",
      "Basic Match Analysis",
      "Daily Predictions",
      "Email Notifications"
    ]
  },
  {
    name: "Pro",
    price: "$19.99",
    icon: Crown,
    features: [
      "All Basic Features",
      "Arbitrage Opportunities",
      "Advanced Analytics",
      "Historical Performance Data",
      "Priority Support"
    ]
  },
  {
    name: "Elite",
    price: "$29.99",
    icon: Trophy,
    features: [
      "All Pro Features",
      "VIP Expert Picks",
      "Real-time Alerts",
      "1-on-1 Strategy Sessions",
      "API Access",
      "Custom Analysis Reports"
    ]
  }
];

const PremiumSubscribeCard = () => {
  const { toast } = useToast();

  const handleSubscribe = (plan: string) => {
    toast({
      title: "Coming Soon",
      description: `${plan} subscription will be available shortly. Stay tuned!`,
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Unlock Premium Features</h2>
        <p className="text-muted-foreground">
          Choose the plan that best fits your betting strategy
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`${
            plan.name === "Pro" ? "border-2 border-gold-500" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full ${
                  plan.name === "Pro" ? "bg-gold-500" : "bg-navy-500"
                } text-white mb-4`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                
                <ul className="space-y-3 text-sm mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full ${
                    plan.name === "Pro" 
                      ? "bg-gold-500 hover:bg-gold-600 text-navy-900" 
                      : "bg-navy-500"
                  }`}
                >
                  Subscribe Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground mt-6">
        <p>All plans include a 7-day free trial. Cancel anytime.</p>
      </div>
    </div>
  );
};

export default PremiumSubscribeCard;
