import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Trophy, 
  AlertTriangle, 
  BarChart2, 
  Wallet, 
  BookOpen, 
  History, 
  Settings, 
  Sparkles, 
  ChevronRight,
  Zap,
  TrendingUp,
  Shield,
  Mail,
  Twitter,
  Github
} from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { path: "/", label: "Home", icon: Home },
  { path: "/standings", label: "Standings", icon: Trophy },
  { path: "/injuries", label: "Injuries", icon: AlertTriangle },
  { path: "/algorithms", label: "Algorithms", icon: BarChart2 },
  { path: "/bankroll", label: "Bankroll", icon: Wallet },
  { path: "/scenarios", label: "Scenarios", icon: BookOpen },
  { path: "/bet-history", label: "Bet History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

const features = [
  { icon: Zap, label: "Real-time Odds" },
  { icon: TrendingUp, label: "AI Predictions" },
  { icon: Shield, label: "Sharp Money" },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Mail, label: "Contact", href: "#" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
};

const PageFooter = () => (
  <footer className="relative mt-12 pt-16 pb-8 border-t border-primary/10 bg-gradient-to-b from-card/90 via-background to-background overflow-hidden">
    {/* Animated gold accent line at top */}
    <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ 
          x: ["-100%", "100%"],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "linear",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
    
    {/* Animated glow orbs */}
    <motion.div 
      className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/3 blur-3xl pointer-events-none"
      animate={{ 
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Grid pattern overlay */}
    <div 
      className="absolute inset-0 opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                          linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
    
    <motion.div 
      className="container px-4 relative z-10"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {/* Top features bar */}
      <motion.div 
        className="flex flex-wrap justify-center gap-6 mb-12 pb-8 border-b border-border/20"
        variants={itemVariants}
      >
        {features.map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <Icon className="h-4 w-4 text-primary" />
              <div className="absolute inset-0 bg-primary/30 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <motion.div className="md:col-span-1" variants={itemVariants}>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2.5 mb-5 group"
          >
            <motion.div 
              className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 group-hover:border-primary/40 transition-all duration-300"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <Sparkles className="h-5 w-5 text-primary relative z-10" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                Edge
              </span>
              <span className="text-foreground">IQ</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            AI-powered sports analytics and predictions to help you make smarter betting decisions.
          </p>
          
          {/* Premium badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-medium bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              Premium Sports Intelligence
            </span>
          </motion.div>

          {/* Social links */}
          <div className="flex items-center gap-2 mt-5">
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <motion.a
                key={label}
                href={href}
                className="p-2 rounded-lg bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300 group"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={label}
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.a>
            ))}
          </div>
        </motion.div>
        
        {/* Quick Links */}
        <motion.div className="md:col-span-2" variants={itemVariants}>
          <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Quick Links
            </span>
          </h3>
          <nav role="navigation" aria-label="Footer navigation">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {footerLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.li 
                    key={link.path}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className="group text-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2.5 py-1"
                    >
                      <span className="p-1.5 rounded-md bg-muted/30 group-hover:bg-primary/10 border border-transparent group-hover:border-primary/20 transition-all duration-300">
                        <Icon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" aria-hidden="true" />
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                      <ChevronRight className="h-3 w-3 text-transparent group-hover:text-primary/50 transition-colors ml-auto" />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>
        </motion.div>
        
        {/* Legal */}
        <motion.div variants={itemVariants}>
          <h3 className="font-semibold mb-5 text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Legal
            </span>
          </h3>
          <ul className="space-y-3">
            {[
              { label: "Terms of Service", path: "/terms" },
              { label: "Privacy Policy", path: "/privacy" },
              { label: "Responsible Gaming", path: "/responsible-gambling" }
            ].map((item, index) => (
              <motion.li 
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={item.path} 
                  className="group text-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronRight className="h-3 w-3 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  <span>{item.label}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
          
          {/* Responsible gaming note */}
          <motion.div 
            className="mt-6 p-3.5 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/15"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-amber-500/90 leading-relaxed flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>Gambling involves risk. Please bet responsibly and within your means.</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Bottom bar */}
      <motion.div 
        className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-amber-400"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(var(--primary), 0)",
                "0 0 0 4px rgba(var(--primary), 0.1)",
                "0 0 0 0 rgba(var(--primary), 0)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <span className="font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              EdgeIQ
            </span>
            . All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/60">Powered by</span>
          <motion.div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/10"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-semibold bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              Advanced AI Analytics
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  </footer>
);

export default PageFooter;
