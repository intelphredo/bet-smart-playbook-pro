import { Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AffiliateDisclosureProps {
  variant?: "inline" | "tooltip" | "badge";
  sportsbookName?: string;
  className?: string;
}

export function AffiliateDisclosure({ 
  variant = "inline",
  sportsbookName,
  className 
}: AffiliateDisclosureProps) {
  const disclosureText = sportsbookName
    ? `This link to ${sportsbookName} is an affiliate link. We may receive compensation if you sign up through this link.`
    : "This is an affiliate link. We may receive compensation if you sign up or make a purchase through this link.";

  if (variant === "tooltip") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help",
            className
          )}>
            <Info className="h-3 w-3" />
            <span>Affiliate</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{disclosureText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === "badge") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        className
      )}>
        <ExternalLink className="h-2.5 w-2.5" />
        Affiliate Link
      </span>
    );
  }

  // Default: inline text
  return (
    <p className={cn(
      "text-xs text-muted-foreground italic flex items-start gap-1.5",
      className
    )}>
      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>{disclosureText}</span>
    </p>
  );
}

// Wrapper component for sportsbook links with built-in disclosure
interface AffiliateLinkProps {
  href: string;
  sportsbookName: string;
  children: React.ReactNode;
  showDisclosure?: boolean;
  className?: string;
}

export function AffiliateLink({ 
  href, 
  sportsbookName, 
  children, 
  showDisclosure = true,
  className 
}: AffiliateLinkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="text-primary hover:underline"
      >
        {children}
      </a>
      {showDisclosure && (
        <AffiliateDisclosure variant="tooltip" sportsbookName={sportsbookName} />
      )}
    </span>
  );
}
