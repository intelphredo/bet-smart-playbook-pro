import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ChevronDown } from "lucide-react";

const HeroHeader = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="text-center py-8 md:py-12 fade-in relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary/5 via-accent/5 to-transparent rounded-full blur-3xl" />
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-4">
        <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary animate-scale-subtle" aria-hidden="true" />
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold hero-gradient tracking-tight">
          Smart Betting
        </h1>
        <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-primary animate-scale-subtle" aria-hidden="true" />
      </div>
      
      <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed px-4">
        Real-time sports data with AI-powered predictions to maximize your winning potential
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button 
          variant="premium" 
          size="lg" 
          className="font-semibold uppercase tracking-wider px-8 shadow-lg hover:shadow-xl transition-all"
          onClick={() => scrollToSection("confident-picks")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get Started Free
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="font-medium px-6"
          onClick={() => scrollToSection("live-matches")}
        >
          View Live Data
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default HeroHeader;
