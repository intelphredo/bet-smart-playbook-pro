import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";

const HeroHeader = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="text-center mb-8 fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Sparkles className="w-8 h-8 text-primary animate-scale-subtle" aria-hidden="true" />
        <h1 className="text-4xl md:text-6xl font-bold hero-gradient">
          Smart Betting
        </h1>
        <TrendingUp className="w-8 h-8 text-primary animate-scale-subtle" aria-hidden="true" />
      </div>
      <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
        Real-time sports data from ESPN with AI-powered predictions to maximize your winning potential
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          variant="premium" 
          size="xl" 
          className="font-semibold uppercase tracking-wider"
          onClick={() => scrollToSection("confident-picks")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get Started Free
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="font-medium px-8 py-4"
          onClick={() => scrollToSection("live-matches")}
        >
          View Live Data
        </Button>
      </div>
    </div>
  );
};

export default HeroHeader;
