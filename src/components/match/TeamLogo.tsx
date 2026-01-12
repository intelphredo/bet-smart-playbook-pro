// src/components/match/TeamLogo.tsx
// Re-exports the unified TeamLogoImage component for backward compatibility

import { TeamLogoImage, TeamLogoImageProps } from "@/components/ui/TeamLogoImage";
import { League } from "@/types/sports";

interface Props {
  teamName: string;
  league?: League;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

export const TeamLogo: React.FC<Props> = (props) => {
  return <TeamLogoImage {...props} />;
};

export default TeamLogo;
