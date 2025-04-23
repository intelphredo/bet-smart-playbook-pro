
import { Button } from "@/components/ui/button";

const HeroHeader = () => (
  <div className="text-center mb-4 animate-fade-in">
    <h1 className="text-3xl md:text-4xl font-bold mb-2">
      <span className="text-navy-500 dark:text-navy-200">Smart Betting.</span>{" "}
      <span className="text-gold-500">Live ESPN Data.</span>
    </h1>
    <p className="text-md md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
      Real-time sports data from ESPN with data-driven predictions to maximize your winning potential.
    </p>
    <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white">
      Get Started
    </Button>
  </div>
);

export default HeroHeader;
