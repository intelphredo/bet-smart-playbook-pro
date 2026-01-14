import { motion } from "framer-motion";
import { TrendingUp, Zap, Target, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface PremiumHeroProps {
  liveGamesCount: number;
  upcomingGamesCount: number;
  highConfidencePicks: number;
}

const PremiumHero = ({ liveGamesCount, upcomingGamesCount, highConfidencePicks }: PremiumHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_90%_55%_/_0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(38_90%_55%_/_0.05),_transparent_50%)]" />
      
      {/* Floating glow orbs */}
      <div className="absolute top-20 left-[10%] w-32 h-32 glow-orb" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-[15%] w-24 h-24 glow-orb" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-[20%] w-20 h-20 glow-orb" style={{ animationDelay: '4s' }} />
      
      {/* Animated gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(38 90% 55% / 0.8), hsl(38 90% 55% / 0.2))`,
              boxShadow: '0 0 6px hsl(38 90% 55% / 0.4)',
            }}
            initial={{ 
              x: `${10 + Math.random() * 80}%`, 
              y: "110%",
              opacity: 0,
              scale: 0.5,
            }}
            animate={{ 
              y: "-10%",
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
            }}
            transition={{ 
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <div className="container relative px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge 
              variant="gold" 
              className="px-4 py-1.5 text-sm badge-glow"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-primary" />
              Premium Sports Intelligence
            </Badge>
          </motion.div>

          {/* Animated headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            <span className="block text-foreground mb-2">Smarter Betting with</span>
            <span className="relative inline-block">
              <span className="hero-gradient font-playfair">AI-Powered Insights</span>
              {/* Animated underline */}
              <motion.span
                className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Real-time odds analysis, sharp money tracking, and machine learning predictions 
            to give you the edge in sports betting.
          </motion.p>

          {/* Stats cards with glassmorphism and glow effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            {/* Live Games */}
            <div className={`glass rounded-2xl px-6 py-4 min-w-[140px] group transition-all duration-300 stat-glow ${liveGamesCount > 0 ? 'glow-border' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-colors relative">
                  <Target className="w-5 h-5 text-destructive" />
                  {liveGamesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full value-ring" />
                  )}
                </div>
                <div className="text-left">
                  <motion.p 
                    className="text-2xl font-bold text-foreground"
                    key={liveGamesCount}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {liveGamesCount}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Live Now</p>
                </div>
              </div>
            </div>

            {/* Upcoming Games */}
            <div className="glass rounded-2xl px-6 py-4 min-w-[140px] group transition-all duration-300 stat-glow glow-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <motion.p 
                    className="text-2xl font-bold text-foreground"
                    key={upcomingGamesCount}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {upcomingGamesCount}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </div>

            {/* High Confidence Picks */}
            <div className={`glass rounded-2xl px-6 py-4 min-w-[140px] group transition-all duration-300 stat-glow ${highConfidencePicks > 0 ? 'gold-glow-card' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <motion.p 
                    className={`text-2xl font-bold ${highConfidencePicks > 0 ? 'shimmer-text' : 'text-foreground'}`}
                    key={highConfidencePicks}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {highConfidencePicks}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Hot Picks</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Button 
              size="lg"
              className="btn-gold text-base px-8 h-12 rounded-xl group"
              onClick={() => navigate('/games')}
            >
              Explore Games
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-8 h-12 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => navigate('/ai-predictions')}
            >
              View AI Picks
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default PremiumHero;
