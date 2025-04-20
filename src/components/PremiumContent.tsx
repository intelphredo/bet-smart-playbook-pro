
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isPremium, setIsPremium] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = () => {
    // Simulate premium upgrade
    setIsPremium(true);
    setIsOpen(false);
    toast({
      title: "Premium Unlocked 🎉",
      description: "You now have access to all premium features!",
      variant: "success"
    });
  };
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg">
        <Lock className="h-8 w-8 mb-2 text-gold-500" />
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/80 mb-3 px-4 text-center">{description}</p>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
              Unlock Premium
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
                    <li className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-green-500" />
                      Arbitrage Betting Opportunities
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-green-500" />
                      Advanced Analytics
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded-full bg-green-500" />
                      Priority Customer Support
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
                  Subscribe Now
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default PremiumContent;
