import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Bell,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: <Trophy className="w-8 h-8" />,
    title: "Welcome to BetSmart Pro",
    description:
      "Find your edge with AI-powered value bets and bankroll management. Let's show you around!",
    highlight: "Your Betting Edge",
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Spotlight Value Picks",
    description:
      "Look for the golden 'Spotlight' cards at the top of your dashboard. These are our highest-confidence picks with the best expected value — start here!",
    highlight: "Top AI Picks",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Sharp Money Tracker",
    description:
      "The 'Sharp Money' tab shows where professional bettors are placing their money. Follow the smart money to find hidden value.",
    highlight: "Pro Insights",
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Smart Score System",
    description:
      "Each pick has a Smart Score (0-100) combining odds value, algorithm confidence, and market signals. Higher scores = stronger plays.",
    highlight: "Data-Driven",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Bankroll Management",
    description:
      "Visit the Bankroll tab to set your bankroll size and risk limits. Our Kelly Calculator helps you size bets optimally.",
    highlight: "Risk Control",
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: "Stay Informed",
    description:
      "Use the tabs to switch between Scores, Favorites, Picks, and Analytics. The 'Picks' tab is your go-to for actionable bets!",
    highlight: "Navigate Like a Pro",
  },
];

const STORAGE_KEY = "betsmart_onboarding_complete";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasCompletedOnboarding) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        {/* Premium gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        {/* Animated background shimmer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse" />
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <div className="relative p-6 pt-8">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-12 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-8">
            {onboardingSteps.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-1.5 bg-primary/60"
                    : "w-1.5 bg-muted-foreground/30"
                )}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-center"
            >
              {/* Icon with glow effect */}
              <div className="relative inline-flex mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30">
                  <motion.div
                    className="text-primary"
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    {currentStepData.icon}
                  </motion.div>
                </div>
                {/* Sparkle decorations */}
                <motion.div
                  className="absolute -top-1 -right-1 text-primary"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>

              {/* Highlight badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                <Sparkles className="w-3 h-3" />
                {currentStepData.highlight}
              </motion.div>

              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                  {currentStepData.title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {currentStepData.description}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={cn(
                "gap-1.5 transition-all",
                currentStep === 0 && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {onboardingSteps.length}
            </span>

            <Button
              onClick={handleNext}
              className={cn(
                "gap-1.5 min-w-[120px] transition-all",
                isLastStep
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                  : ""
              )}
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feature preview cards for last step */}
        {isLastStep && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-6 pb-6"
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Target, label: "Picks" },
                { icon: TrendingUp, label: "Analytics" },
                { icon: Bell, label: "Alerts" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;
