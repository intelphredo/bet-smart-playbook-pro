
import { Button } from "@/components/ui/button";

const HeroHeader = () => (
  <div className="text-center mb-4 animate-fade-in">
    <h1 className="text-3xl md:text-5xl font-bold mb-2 hero-gradient">
      Smart Betting.<span className="inline-block"> Live ESPN Data.</span>
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
      Real-time sports data from ESPN with data-driven predictions to maximize your winning potential.
    </p>
    <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-200/50 shadow-xl font-semibold uppercase tracking-wider px-8 py-3 rounded-xl transition-transform duration-200 hover:scale-105">
      Get Started
    </Button>
  </div>
);

export default HeroHeader;
