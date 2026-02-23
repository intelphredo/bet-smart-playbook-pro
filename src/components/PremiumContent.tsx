
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PremiumContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const PremiumContent = ({ 
  children, 
  title = "Premium Feature", 
  description = "This feature is only available to premium subscribers."
}: PremiumContentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "premium" })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to upgrade to premium. Please try again.");
      return;
    }

    setIsOpen(false);
    toast.success("Welcome to Premium! 🎉", {
      description: "You now have access to all premium features. Enjoy!",
    });
  };
  
  if (profile?.subscription_status === "premium") {
    return <>{children}</>;
  }
  
  return (
    <div className="relative group">
      <div className="filter blur-sm pointer-events-none transition-all duration-200">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg transition-all duration-200">
        <Crown className="h-8 w-8 mb-2 text-gold-500" />
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/80 mb-3 px-4 text-center">{description}</p>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900 group-hover:scale-105 transition-transform">
              {user ? "Unlock Premium" : "Sign In to Unlock"}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Upgrade to Premium</SheetTitle>
              <SheetDescription>
                Get access to exclusive features including arbitrage betting opportunities, advanced analytics, and more.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <div className="space-y-4">
                <div className="bg-navy-50 dark:bg-navy-800 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Premium Plan</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      Smart Score Analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      Advanced Analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      Priority Support
                    </li>
                  </ul>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">$19.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleUpgrade} 
                  className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900"
                >
                  {user ? "Start Free Trial" : "Sign In to Start"}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Try Premium free for 7 days. Cancel anytime.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default PremiumContent;
