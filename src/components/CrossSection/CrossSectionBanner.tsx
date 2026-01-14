// Cross-Section Alert Banner
// Compact banner for high-priority cross-section insights

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  AlertTriangle,
  Zap,
  CheckCircle2,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CrossSectionData, CrossSectionInsight } from "@/hooks/useCrossSectionData";

interface CrossSectionBannerProps {
  crossSectionData: CrossSectionData;
  onClick?: () => void;
  className?: string;
}

export function CrossSectionBanner({ crossSectionData, onClick, className }: CrossSectionBannerProps) {
  const { insights, validations, hasData, isLoading } = crossSectionData;

  // Get the most important insight to display
  const topInsight = useMemo(() => {
    if (!insights.length) return null;
    
    // Prioritize opportunities and warnings
    const priority = insights.find(i => i.type === 'opportunity');
    if (priority) return priority;
    
    const warning = insights.find(i => i.type === 'warning');
    if (warning) return warning;
    
    return insights[0];
  }, [insights]);

  // Count by type
  const counts = useMemo(() => ({
    opportunities: insights.filter(i => i.type === 'opportunity').length,
    warnings: insights.filter(i => i.type === 'warning').length,
    validations: insights.filter(i => i.type === 'validation').length,
    total: insights.length,
  }), [insights]);

  // Determine banner style based on content
  const bannerStyle = useMemo(() => {
    if (counts.opportunities > 0 && counts.warnings === 0) {
      return 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/30';
    }
    if (counts.warnings > 0 && counts.opportunities === 0) {
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    }
    if (counts.opportunities > 0 && counts.warnings > 0) {
      return 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-blue-500/30';
    }
    return 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted';
  }, [counts]);

  if (isLoading || !hasData || insights.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
          bannerStyle,
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background/50">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Cross-Section Analysis</span>
                {counts.total > 1 && (
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    {counts.total} insights
                  </Badge>
                )}
              </div>
              {topInsight && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {topInsight.title}
                </p>
              )}
            </div>
          </div>

          {/* Right - Status Badges */}
          <div className="flex items-center gap-2">
            {counts.opportunities > 0 && (
              <Badge className="bg-green-500 text-white text-xs py-0 h-5 gap-1">
                <Zap className="h-3 w-3" />
                {counts.opportunities}
              </Badge>
            )}
            {counts.warnings > 0 && (
              <Badge variant="destructive" className="text-xs py-0 h-5 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {counts.warnings}
              </Badge>
            )}
            {validations.aiAlignedWithSharps && (
              <Badge variant="outline" className="text-xs py-0 h-5 gap-1 text-blue-500 border-blue-500/50">
                <Users className="h-3 w-3" />
                Sharp ✓
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Validation Summary Bar */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-current/10">
          <span className="text-xs text-muted-foreground mr-2">Validations:</span>
          <ValidationDot label="Sharps" isValid={validations.aiAlignedWithSharps} />
          <ValidationDot label="Injuries" isValid={validations.injuryAccountedFor} />
          <ValidationDot label="Scenario" isValid={validations.scenarioMatchesHistory} />
          <ValidationDot label="Trend" isValid={validations.trendSupportsProjection} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ValidationDot({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isValid ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="hidden sm:inline text-muted-foreground">{label}</span>
    </div>
  );
}
