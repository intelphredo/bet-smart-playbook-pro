import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ChevronDown, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HeroHeader = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="text-center py-10 md:py-14 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Main gradient */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/8 via-primary/4 to-transparent rounded-full blur-3xl" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-10 left-[20%] w-32 h-32 rounded-full bg-primary/5 blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-20 right-[25%] w-24 h-24 rounded-full bg-primary/5 blur-2xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/60"
            style={{
              left: `${15 + i * 15}%`,
            }}
            initial={{ y: "100vh", opacity: 0 }}
            animate={{ 
              y: "-10vh",
              opacity: [0, 1, 1, 0],
            }}
            transition={{ 
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}
      </div>
      
      {/* Premium badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5"
      >
        <Badge variant="gold" className="px-4 py-1.5 gap-1.5 badge-glow">
          <Zap className="w-3.5 h-3.5 fill-current" />
          AI-Powered Analytics
        </Badge>
      </motion.div>
      
      {/* Main heading */}
      <motion.div 
        className="flex items-center justify-center gap-3 mb-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" aria-hidden="true" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="hero-gradient font-playfair">Smart Betting</span>
        </h1>
        
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        >
          <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" aria-hidden="true" />
        </motion.div>
      </motion.div>
      
      {/* Subheading */}
      <motion.p 
        className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed px-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Real-time sports data with{" "}
        <span className="text-primary font-medium">machine learning predictions</span>{" "}
        to maximize your winning potential
      </motion.p>
      
      {/* CTA Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button 
          variant="premium" 
          size="lg" 
          className="font-semibold uppercase tracking-wider px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group"
          onClick={() => scrollToSection("confident-picks")}
        >
          <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          Get Started Free
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="font-medium px-6 border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          onClick={() => scrollToSection("live-matches")}
        >
          View Live Data
          <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
        </Button>
      </motion.div>
      
      {/* Trust indicators */}
      <motion.div
        className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {[
          { icon: Star, label: "85%+ Accuracy" },
          { icon: Zap, label: "Real-time Updates" },
          { icon: TrendingUp, label: "Sharp Money Tracking" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroHeader;
