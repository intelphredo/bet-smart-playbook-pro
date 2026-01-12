import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const ContentSection = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = "secondary",
  action,
  children,
  className,
  noPadding = false,
}: ContentSectionProps) => {
  return (
    <Card className={cn("bg-card/80 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {title}
                {badge !== undefined && (
                  <Badge variant={badgeVariant} className="text-xs">
                    {badge}
                  </Badge>
                )}
              </CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <Button variant="ghost" size="sm" onClick={action.onClick} className="gap-1">
              {action.label}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(noPadding && "p-0")}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ContentSection;
